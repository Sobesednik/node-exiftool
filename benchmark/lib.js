const child_process = require('child_process')
const Transform = require('stream').Transform
const Readable = require('stream').Readable
const Writable = require('stream').Writable
const path = require('path')
const fs = require('fs')
const os = require('os')
const EOL = os.EOL

/**
 * Create a stream which will print objects to process.stdout.
 * @param {displayFunction} - a function which maps an object to a string
 * @return {Transform} - A transform stream.
 */
function createDisplayStream(displayFunction) {
    const displayStream = new Transform({ objectMode: true })
    displayStream._transform = (obj, enc, next) => {
        const s = displayFunction(obj)
        next(null, `${s}${EOL}`)
    }
    return displayStream
}

/**
 * Get a string for printing from object.
 * @param {object} obj - an object with file and time properties
 * @return {string} A formatted string showing how long it took to process the file.
 */
function getObjectPrint(obj) {
    return `${obj.file}: ${obj.time}ms`
}

/**
 * Create a read stream for given read function and files.
 * @param {function} readFn - function to read files,
 *        must return either a promise or a number
 * @param {Array} files - files to read
 * @return {Readable} A readable stream which will push
 *         { file, time } objects.
 */
function createReadStream(readFn, files) {
    const clone = files.slice() // make sure files array won't be changed
    const rs = Readable({ objectMode: true })
    rs._read = readFilesIntoStream.bind(null, rs, clone, readFn)
    return rs
}

/**
 * Read files from an array with a given read function,
 * and push the results into the reabable stream.
 * @param {Reabable} rs - readable stream to push results to
 * @param {Array} filesArray - array with files to read
 * @param {function} readFunction - the function used to read files,
 *        must return a promise or an object
 */
function readFilesIntoStream(rs, filesArray, readFunction) {
    if (!filesArray.length) return rs.push(null)

    const file = filesArray.shift()
    const res = readFunction(file)
    res instanceof Promise
        ? res.then(rs.push.bind(rs))
        : rs.push(res)
}

/**
 * Measure the time it took to fulfill a promise.
 * @param {number} start - start unix time
 * @param {Promise} promise - a promise to measure
 * @return {Promise} A promise resolved with the result and time of the original promise.
 */
function measurePromise(start, promise) {
    return promise
        .then(result =>
            ({ result, time: new Date().getTime() - start})
        )
}

/**
 * Add file property to an object.
 * @param {string} file - file to add as a property
 * @param {object} res - object into which to add the property
 * @return {object} Modified object with file field.
 */
function decorate(file, res) {
    return Object.assign(res, { file })
}

/**
 * Read file with an open process.
 * @param {ExiftoolProcess} ep - an open exiftool process wrapper
 * @param {string} file - file or directory to read
 * @return {Promise} A promise resolved with the result.
 */
function runOpenProcessRead(ep, file) {
    const start = new Date()
    return measurePromise(start, ep.readMetadata(file))
        .then(decorate.bind(null, file))
}

/**
 * Read file with a standard process (not open).
 * @param {string} binary - path to the executable to spawn
 * @param {string} file - file or directory to read
 * @return {Promise} A promise resolve with the result (parsed JSON from stdout)
 */
function runProcessRead(binary, file) {
    const stdoutWriteSteam = new Writable
    const stderrWriteStream = new Writable
    const stdoutBuffers = []
    const stderrBuffers = []

    const write = (buffers, buf) => buffers.push(buf)

    stdoutWriteSteam._write = write.bind(null, stdoutBuffers)
    stderrWriteStream._write = write.bind(null, stderrBuffers)

    const start = new Date()
    const promise = new Promise((resolve) => {
        const ep = child_process.spawn(binary, ['-json', file])
        ep.stdout.pipe(stdoutWriteSteam)
        ep.stderr.pipe(stderrWriteStream)
        ep.on('close', () => {
            // because exiftool from the lib does json processing,
            // we make it part of the benchmark as well
            const stdoutString = String(Buffer.concat(stdoutBuffers))
            const stderrString = String(Buffer.concat(stderrBuffers))
            const data = JSON.parse(stdoutString)
            resolve({
                data,
                error: stderrString,
            })
        })
    })
    return measurePromise(start, promise)
        .then(decorate.bind(null, file))
}

function measureOpenEp(ep) {
    const start = new Date()
    return measurePromise(start, ep.open())
}

function measureCloseEp(ep) {
    const start = new Date()
    return measurePromise(start, ep.close())
}

/**
 * Pipe read stream into write stream and call onfinish when done reading.
 * @param {Readable} rs - readable stream
 * @param {Writable} ws - writable stream
 * @param {function} onfinish - function to call on finish
 * @param {function} onerror - function to call on error
 */
function pipeReadStreamIntoWriteStream(rs, ws, onfinish, onerror) {
    ws.on('finish', onfinish)
    ws.on('error', onerror)
    rs.pipe(ws)
}

/**
 * Read the stream completely.
 * @param {Reabable} rs - a readable stream
 * @return {Promise} A promise which will be resolved with an array with
 *         all data pushed by the read steam when it's finished.
 */
function readStream(rs) {
    const data = []
    const ws = new Writable({ objectMode: true })
    ws._write = (obj, enc, next) => {
        data.push(obj)
        next()
    }

    const pipe = pipeReadStreamIntoWriteStream.bind(null, rs, ws)

    return new Promise(pipe)
        .then(() => data)
}

/**
 * Calculate the total time for all results.
 * @param {Array} results - array with results objects which contain time property
 * @return {number} Total time.
 */
function reduceResultsTime(results) {
    return results
        .reduce((prev, result) => (prev + result.time), 0)
}

/**
 * Get list of files in a directory.
 * @param {string} dir - directory location
 * @return {Array} An array with files' absolute paths (excluding hidden files)
 */
function getFilesInDir(dir) {
    return fs
        .readdirSync(dir)
        .filter(filename => !(/^\./).test(filename))
        .map(filename => path.join(dir, filename))
}

module.exports = {
    createDisplayStream,
    getObjectPrint,
    createReadStream,
    readFilesIntoStream,
    runOpenProcessRead,
    runProcessRead,
    readStream,
    measurePromise,
    measureOpenEp,
    measureCloseEp,
    pipeReadStreamIntoWriteStream,
    reduceResultsTime,
    getFilesInDir,
}
