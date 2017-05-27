const assert = require('assert')
const Readable = require('stream').Readable
const Writable = require('stream').Writable
const Transform = require('stream').Transform
const beginReady = require('../../src/begin-ready')
const createBeginReadyMatchTransformStream = beginReady.createBeginReadyMatchTransformStream
const createResolverWriteStream = beginReady.createResolverWriteStream
const setupResolveWriteStreamPipe = beginReady.setupResolveWriteStreamPipe

/**
 * Pipe Readable stream in object mode into process.stdout,
 * using JSON.stringify to print data. This might results in
 * MaxListenersExceededWarning in tests, when process.stdout
 * gets assigned a lot of stream listeners such as end, drain,
 * error, finish, unpipe, close.
 */
function debugObjectReadStream(rs, name) {
    rs.pipe(new Transform({
        objectMode: true,
        transform: (chunk, enc, next) => {
            const s = JSON.stringify(chunk, null, 2)
            console.log(`Some data from ${name} rs: `)
            next(null, `${s}\r\n`)
        },
    })).pipe(process.stdout)
}

const commandNumber = '376080'
const commandNumber2 = '65754'

const data = `
[{
  "SourceFile": "test/fixtures/CANON/IMG_9857.JPG",
  "ExifToolVersion": 10.25,
  "FileName": "IMG_9857.JPG",
  "Directory": "test/fixtures/CANON",
  "FileSize": "51 kB",
  "FileModifyDate": "2016:05:16 00:25:40+01:00",
  "FileAccessDate": "2016:11:26 01:20:48+00:00",
  "FileInodeChangeDate": "2016:05:16 00:25:40+01:00",
  "FilePermissions": "rw-r--r--",
  "FileType": "JPEG",
  "FileTypeExtension": "jpg",
  "MIMEType": "image/jpeg",
  "XMPToolkit": "Image::ExifTool 10.11",
  "CreatorWorkURL": "https://sobesednik.media",
  "Scene": "011200",
  "Creator": "Photographer Name",
  "ImageWidth": 500,
  "ImageHeight": 333,
  "EncodingProcess": "Baseline DCT, Huffman coding",
  "BitsPerSample": 8,
  "ColorComponents": 3,
  "YCbCrSubSampling": "YCbCr4:2:0 (2 2)",
  "ImageSize": "500x333",
  "Megapixels": 0.167
}]
`
    .trim()

const data2 = 'File not found: test/fixtures/no_such_file2.jpg'

const s = `
{begin${commandNumber}}
${data}
{ready${commandNumber}}
`
    .trim()

const s2 = `
{begin${commandNumber2}}
${data2}
{ready${commandNumber2}}
`
    .trim()
const exiftoolOutput = `
${s}
${s2}
`
    .trim()

const brtsTestSuite = {
    createBeginReadyMatchTransformStream: {
        'should transform match data': () => {
            const rs = new Readable({ objectMode: true })
            rs._read = () => {
                const match = {
                    1: commandNumber,
                    2: data,
                }
                const match2 = {
                    1: commandNumber2,
                    2: data2,
                }
                rs.push(match)
                rs.push(match2)
                rs.push(null)
            }
            const brts = createBeginReadyMatchTransformStream()

            return new Promise((resolve, reject) => {
                const ws = new Writable({ objectMode: true })
                const data = []
                ws._write = (chunk, enc, next) => {
                    data.push(chunk)
                    next()
                }
                ws.on('finish', () => { resolve(data) })
                ws.on('error', reject)
                rs.pipe(brts).pipe(ws)
            })
                .then((res) => {
                    assert.equal(res.length, 2)
                    const output = res[0]
                    const output2 = res[1]
                    assert.equal(output.cn, commandNumber)
                    assert.equal(output.d, data)
                    assert.equal(output2.cn, commandNumber2)
                    assert.equal(output2.d, data2)
                })
        },
    },
    createResolverWriteStream: {
        'should have _resolveMap property': () => {
            const rws = createResolverWriteStream()
            assert.equal(typeof rws._resolveMap, 'object')
        },
        'should have addToResolveMap function': () => {
            const rws = createResolverWriteStream()
            assert.equal(typeof rws.addToResolveMap, 'function')
        },
        'should add resolve function to the map': () => {
            const rws = createResolverWriteStream()
            const handler = () => {}
            rws.addToResolveMap(commandNumber, handler)
            assert.strictEqual(rws._resolveMap[commandNumber], handler)
        },
        'should throw an error when resolve is not a function': () => {
            const rws = createResolverWriteStream()
            assert.throws(
                () => rws.addToResolveMap(commandNumber),
                /resolve argument must be a function/
            )
        },
        'should throw an error when commandNumber is not a string': () => {
            const rws = createResolverWriteStream()
            assert.throws(
                () => rws.addToResolveMap(),
                /commandNumber argument must be a string/
            )
        },
        'should throw an error when key already exists in the map': () => {
            const rws = createResolverWriteStream()
            const handler = () => {}
            rws.addToResolveMap(commandNumber, handler)
            assert.throws(
                () => rws.addToResolveMap(commandNumber, handler),
                /Command with the same number is already expected/
            )
        },
        'should call resolve and delete entry from resolveMap on data': () => {
            const rs = new Readable({ objectMode: true})
            rs._read = () => {
                rs.push({
                    cn: commandNumber,
                    d: data,
                })
                rs.push({
                    cn: commandNumber2,
                    d: data2,
                })
                rs.push(null)
            }
            const results = []
            const handler = (data) => results.push(data)
            const rws = createResolverWriteStream()
            rws.addToResolveMap(commandNumber, handler)
            rws.addToResolveMap(commandNumber2, handler)

            rs.pipe(rws)

            return new Promise(resolve => rws.on('finish', resolve))
                .then(() => {
                    assert.equal(results.length, 2)
                    assert.equal(results[0], data)
                    assert.equal(results[1], data2)
                    assert(!Object.keys(rws._resolveMap).length)
                })
        },
        'should call next with an error when command number cannot be found': () => {
            const rs = new Readable({ objectMode: true})
            rs._read = () => {
                rs.push({
                    cn: commandNumber,
                    d: data,
                })
                rs.push({
                    cn: commandNumber2,
                    d: data2,
                })
                rs.push(null)
            }
            const results = []
            const handler = (data) => results.push(data)
            const rws = createResolverWriteStream()
            rws.addToResolveMap(commandNumber, handler)

            rs.pipe(rws)

            return new Promise(resolve => rws.on('error', resolve))
                .then((err) => {
                    assert.equal(err.message, `Command with index ${commandNumber2} not found`)
                    assert.equal(results.length, 1)
                    assert.equal(results[0], data)
                })
        },
    },
    setupResolveWriteStreamPipe: {
        'should pipe exiftool data and call resolve functions': () => {
            const rs = new Readable
            rs._read = () => {
                rs.push(exiftoolOutput)
                rs.push(null)
            }
            const results = []
            const rws = setupResolveWriteStreamPipe(rs)
            rws.addToResolveMap(commandNumber, (data) => results.push(data))
            rws.addToResolveMap(commandNumber2, (data) => results.push(data))
            return new Promise(resolve => rws.on('finish', resolve))
                .then(() => {
                    assert.equal(results.length, 2)
                    assert.equal(results[0], data)
                    assert.equal(results[1], data2)
                })
        },
    },
}

module.exports = brtsTestSuite
