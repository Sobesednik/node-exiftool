'use strict'

const cp = require('child_process')
const EOL = require('os').EOL
const isStream = require('is-stream')

function writeStdIn(proc, data, encoding) {
    // console.log('write stdin', data)
    proc.stdin.write(data, encoding)
    proc.stdin.write(EOL, encoding)
}

function close(proc) {
    let errHandler
    return new Promise((resolve, reject) => {
        errHandler = (err) => {
            reject(new Error(`Could not write to stdin: ${err.message}`))
        }
        proc.once('close', resolve)
        proc.stdin.once('error', errHandler)
        writeStdIn(proc, '-stay_open')
        writeStdIn(proc, 'false')
    })
    .then(() => {
        proc.stdin.removeListener('error', errHandler)
    })
}

function isString(s) {
    return (typeof s).toLowerCase() === 'string'
}

function isObject(o) {
    return (typeof o).toLowerCase() === 'object' && o !== null
}

/**
 * Get arguments. Split by new line to write to exiftool
 */
function getArgs(args, noSplit) {
    if(!(Array.isArray(args) && args.length)) {
        return []
    }
    return args
        .filter(isString)
        .map(arg => `-${arg}`)
        .reduce((acc, arg) =>
            [].concat(acc, noSplit ? [arg] : arg.split(/\s+/))
        , [])
}

/**
 * Write command data to the exiftool's stdin.
 * @param {ChildProcess} process - exiftool process executed with -stay_open True -@ -
 * @param {string} command - which command to execute
 * @param {string} commandNumber - text which will be echoed before and after results
 * @param {string[]} args - any additional arguments
 * @param {string[]} noSplitArgs - arguments which should not be broken up like args
 * @param {string} encoding - which encoding to write in. default no encoding
 */
function execute(proc, command, commandNumber, args, noSplitArgs, encoding) {
    const extendedArgs = getArgs(args)
    const extendedArgsNoSplit = getArgs(noSplitArgs, true)

    command = command !== undefined ? command : ''

    const allArgs = [].concat(
        extendedArgsNoSplit,
        extendedArgs,
        ['-json', '-s'],
        [
            command,
            '-echo1',
            `{begin${commandNumber}}`,
            '-echo2',
            `{begin${commandNumber}}`,
            '-echo4',
            `{ready${commandNumber}}`,
            `-execute${commandNumber}`,
        ]
    )
    if (process.env.DEBUG) {
        console.log(JSON.stringify(allArgs, null, 2))
    }
    allArgs.forEach(arg => writeStdIn(proc, arg, encoding))
}

let currentCommand = 0
function genCommandNumber() {
    return String(++currentCommand)
}

function executeCommand(proc, stdoutRws, stderrRws, command, args, noSplitArgs, encoding) {
    const commandNumber = genCommandNumber()

    if (proc === process) { // debugging
        execute(proc, command, commandNumber, args, noSplitArgs, encoding)
        return Promise.resolve({ data: 'debug', error: null })
    }

    let dataFinishHandler
    let errFinishHandler
    let dataErr
    let errErr

    const dataPromise = new Promise((resolve, reject) => {
        dataFinishHandler = () => {
            reject(new Error('stdout stream finished before operation was complete'))
        }
        stdoutRws.once('finish', dataFinishHandler)
        stdoutRws.addToResolveMap(commandNumber, resolve)
    }).catch(error => { dataErr = error })
    const errPromise = new Promise((resolve, reject) => {
        errFinishHandler = () => {
            reject(new Error('stderr stream finished before operation was complete'))
        }
        stderrRws.once('finish', errFinishHandler)
        stderrRws.addToResolveMap(commandNumber, resolve)
    }).catch(error => { errErr = error })

    execute(proc, command, commandNumber, args, noSplitArgs, encoding)

    return Promise.all([
        dataPromise,
        errPromise,
    ])
        .then((res) => {
            stderrRws.removeListener('finish', errFinishHandler)
            stdoutRws.removeListener('finish', dataFinishHandler)
            if (dataErr && !errErr) {
                throw dataErr
            } else if (errErr && !dataErr) {
                throw errErr
            } else if (dataErr && errErr) {
                throw new Error('stdout and stderr finished before operation was complete')
            }
            return {
                data: res[0] ? JSON.parse(res[0]) : null,
                error: res[1] || null,
            }
        })
}

function isReadable(stream) {
    return isStream.readable(stream)
}
function isWritable(stream) {
    return isStream.writable(stream)
}

/**
 * Spawn exiftool.
 * @param {string} bin Path to the binary
 * @param {object} [options] options to pass to child_process.spawn method
 * @returns {Promise.<ChildProcess>} A promise resolved with the process pointer, or rejected on error.
 */
function spawn(bin, options) {
    const echoString = Date.now().toString()
    const proc = cp.spawn(bin, ['-echo2', echoString, '-stay_open', 'True', '-@', '-'], options)
    if (!isReadable(proc.stderr)) {
        killProcess(proc)
        return Promise.reject(new Error('Process was not spawned with a readable stderr, check stdio options.'))
    }

    return new Promise((resolve, reject) => {
        const echoHandler = (data) => {
            const d = data.toString().trim()
            // listening for echo2 in stderr (echo and echo1 won't work)
            if (d === echoString) {
                resolve(proc)
            } else {
                reject(new Error(`Unexpected string on start: ${d}`))
            }
        }
        proc.stderr.once('data', echoHandler)
        proc.once('error', reject)
    })
}

function checkDataObject(data) {
    return data === Object(data) && !Array.isArray(data)
}

function mapDataToTagArray(data, array) {
    const res = Array.isArray(array) ? array : []
    Object
        .keys(data)
        .forEach(tag => {
            const value = data[tag]
            if (Array.isArray(value)) {
                value.forEach((v) => {
                    const arg = `${tag}=${v}`
                    res.push(arg)
                })
            } else {
                res.push(`${tag}=${value}`)
            }
        })
    return res
}

/**
 * Use process.kill on POSIX or terminate process with taskkill on Windows.
 * @param {ChildProcess} proc Process to terminate
 */
function killProcess(proc) {
    if (process.platform === 'win32') {
        cp.exec(`taskkill /t /F /PID ${proc.pid}`)
    } else {
        proc.kill()
    }
}

module.exports = {
    spawn,
    close,
    executeCommand,
    checkDataObject,
    mapDataToTagArray,
    getArgs,
    execute,
    isString,
    isObject,
    isReadable,
    isWritable,
    killProcess,
}
