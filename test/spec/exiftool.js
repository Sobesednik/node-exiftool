const os = require('os')
const assert = require('assert')
const child_process = require('child_process')
const exiftool = require('../../src/index')
const context = require('../context/ExiftoolContext')

const ChildProcess = child_process.ChildProcess
const EOL = os.EOL

function assertJpegMetadata(file) {
    const mask = {
        FileType: 'JPEG',
        MIMEType: 'image/jpeg',
        CreatorWorkURL: 'https://sobesednik.media',
        Creator: 'Photographer Name',
        Scene: '011200',
    }
    // shallow deep equal
    Object.keys(mask)
        .forEach((key) => {
            assert.equal(file[key], mask[key])
        })

}

const exiftoolTestSuite = {
    context,
    class: {
        'creates new ExiftoolProcess instance with default bin': (ctx) => {
            const ep = new exiftool.ExiftoolProcess()
            assert(ep instanceof exiftool.ExiftoolProcess)
            assert.equal(ep._bin, exiftool.EXIFTOOL_PATH)
            assert.equal(ep._bin, ctx.defaultBin)
        },
        'instance\'s isOpen getter returns false': (ctx) => {
            ctx.create()
            assert(!ctx.ep.isOpen)
        },
        'creates new ExiftoolProcess object with specific bin': (ctx) => {
            const bin = 'notexiftool'
            ctx.create(bin)
            assert.equal(ctx.ep._bin, bin)
        },
    },
    open: {
        'opens exiftool': (ctx) => {
            return ctx.createOpen()
                .then((pid) => {
                    assert(ctx.ep._process instanceof ChildProcess)
                    assert(ctx.ep._process.stdout.readable)
                    assert(ctx.ep._process.stderr.readable)
                    assert(ctx.ep._process.stdin.writable)
                    assert(ctx.ep.isOpen)
                    assert.equal(typeof pid, 'number')
                    assert.equal(pid, ctx.ep._process.pid)
                })
        },
        'returns rejected promise when exiftool executable not found': (ctx) => {
            return ctx.createOpen('notexiftool')
                .then(() => {
                    throw new Error('open should have resulted in error')
                }, (err) => {
                    assert.equal(err.message, 'spawn notexiftool ENOENT')
                })
        },
        'emits OPEN event with PID': (ctx) => {
            ctx.create()
            const eventPromise = new Promise(resolve =>
                ctx.ep.on(exiftool.events.OPEN, resolve)
            )
            return ctx.open()
                .then(() => eventPromise)
                .then(pid => assert.equal(pid, ctx.ep._process.pid))
        },
        'returns rejected promise when process is open already': (ctx) => {
            return ctx.createOpen()
                .then(() => ctx.open())
                .then(() => {
                    throw new Error('second open should have resulted in error')
                }, (err) => {
                    assert.equal(err.message, 'Exiftool process is already open')
                })
        },
    },
    close: {
        'closes the process': (ctx) => {
            return ctx.createOpen()
                .then(() => ctx.close())
                .then(() => {
                    assert(ctx.ep._process instanceof ChildProcess)
                    assert(!ctx.ep._process.stdout.readable)
                    assert(!ctx.ep._process.stderr.readable)
                    assert(!ctx.ep._process.stdin.writable)
                    assert(!ctx.ep.isOpen)
                })
        },
        'updates resolve write streams to be finished': (ctx) => {
            return ctx.createOpen()
                .then(() => ctx.close())
                .then(() => {
                    assert(ctx.ep._stdoutResolveWs._writableState.finished)
                    assert(ctx.ep._stderrResolveWs._writableState.finished)
                })
        },
        'completes remaining jobs': (ctx) => {
            return ctx.createOpen()
                .then(() => {
                    const p = ctx.ep
                        .readMetadata(ctx.jpegFile)
                        .then((res) => {
                            assert(Array.isArray(res.data))
                            assert.equal(res.error, null)
                            res.data.forEach(assertJpegMetadata)
                        })
                    const p2 = ctx.ep
                        .readMetadata(ctx.jpegFile2)
                        .then((res) => {
                            assert(Array.isArray(res.data))
                            assert.equal(res.error, null)
                            res.data.forEach(assertJpegMetadata)
                        })
                    const readPromises = Promise.all([p, p2])

                    return ctx.close()
                        .then(() => {
                            assert(!Object.keys(ctx.ep._stdoutResolveWs._resolveMap).length)
                            assert(!Object.keys(ctx.ep._stderrResolveWs._resolveMap).length)
                        })
                        .then(() => readPromises)
                })
        },
        'emits EXIT event': (ctx) => {
            ctx.create()
            const eventPromise = new Promise(resolve =>
                ctx.ep.on(exiftool.events.EXIT, resolve)
            )
            return ctx.open()
                .then(() => ctx.close())
                .then(() => eventPromise)
        },
        'sets open to false': (ctx) => {
            return ctx.createOpen()
                .then(() => ctx.close())
                .then(() => assert(!ctx.ep.isOpen))
        },
        'returns rejected promise when process not open': (ctx) => {
            return ctx.create()
                .close()
                .then(() => {
                    throw new Error('close should have resulted in error')
                }, (err) => {
                    assert.equal(err.message, 'Exiftool process is not open')
                })
        },
    },
    readMetadata: {
        'returns rejected promise when trying to execute when not open': (ctx) => {
            return ctx.create()
                .readMetadata(ctx.jpegFile)
                .then(() => {
                    throw new Error('readMetadata should have resulted in error')
                })
                .catch(err => assert.equal(err.message, 'exiftool is not open'))
        },
        'reads metadata of files in a directory': (ctx) => {
            return ctx.initAndReadMetadata(ctx.folder)
                .then((res) => {
                    assert(Array.isArray(res.data))
                    assert.equal(res.data.length, 5)
                    res.data.forEach(assertJpegMetadata)
                    assert.equal(res.error, `1 directories scanned${EOL}    5 image files read`)
                })
        },
        'returns null data for empty directory and info error': (ctx) => {
            return ctx.initAndReadMetadata(ctx.emptyFolder)
                .then((res) => {
                    assert.equal(res.data, null)
                    assert.equal(res.error, `1 directories scanned${EOL}    0 image files read`)
                })
        },
        'allows to specify arguments': (ctx) => {
            return ctx.initAndReadMetadata(ctx.jpegFile, ['Orientation', 'n'])
                .then((res) => {
                    assert.equal(res.error, null)
                    assert(Array.isArray(res.data))
                    assert.equal(res.data[0].SourceFile, 'test/fixtures/CANON/IMG_9858.JPG')
                    assert.equal(res.data[0].Orientation, 6)
                })
        },
        'reads metadata of a file': (ctx) => {
            return ctx.initAndReadMetadata(ctx.jpegFile)
                .then((res) => {
                    assert.equal(res.error, null)
                    assert(Array.isArray(res.data))
                    const expected = {
                        SourceFile: 'test/fixtures/CANON/IMG_9858.JPG',
                        FileName: 'IMG_9858.JPG',
                        Directory: 'test/fixtures/CANON',
                        FileSize: '52 kB',
                        FileType: 'JPEG',
                        FileTypeExtension: 'jpg',
                        MIMEType: 'image/jpeg',
                        ExifByteOrder: 'Big-endian (Motorola, MM)',
                        Orientation: 'Rotate 90 CW',
                        XResolution: 72,
                        YResolution: 72,
                        ResolutionUnit: 'inches',
                        YCbCrPositioning: 'Centered',
                        XMPToolkit: 'Image::ExifTool 10.40',
                        CreatorWorkURL: 'https://sobesednik.media',
                        Scene: '011200',
                        Creator: 'Photographer Name',
                        ImageWidth: 500,
                        ImageHeight: 334,
                        EncodingProcess: 'Baseline DCT, Huffman coding',
                        BitsPerSample: 8,
                        ColorComponents: 3,
                        YCbCrSubSampling: 'YCbCr4:2:0 (2 2)',
                        ImageSize: '500x334',
                        Megapixels: 0.167,
                    }
                    Object
                        .keys(expected)
                        .forEach(key =>
                            assert.equal(res.data[0][key], expected[key])
                        )
                })
        },
        'returns promise with null data and error when file not found': (ctx) => {
            return ctx.initAndReadMetadata(ctx.fileDoesNotExist)
                .then((res) => {
                    assert.equal(res.data, null)
                    assert.equal(res.error, `File not found: ${ctx.fileDoesNotExist}`)
                })
        },
        'works with simultaneous requests': (ctx) => {
            return ctx.createOpen()
                .then(() => Promise.all([
                    ctx.ep.readMetadata(ctx.fileDoesNotExist),
                    ctx.ep.readMetadata(ctx.fileDoesNotExist2),
                    ctx.ep.readMetadata(ctx.jpegFile),
                    ctx.ep.readMetadata(ctx.jpegFile2),
                ]))
                .then((res) => {
                    assert.equal(res[0].data, null)
                    assert.equal(res[0].error, `File not found: ${ctx.fileDoesNotExist}`)

                    assert.equal(res[1].data, null)
                    assert.equal(res[1].error, `File not found: ${ctx.fileDoesNotExist2}`)

                    assert(Array.isArray(res[2].data))
                    assert.equal(res[2].error, null)
                    res[2].data.forEach(assertJpegMetadata)

                    assert(Array.isArray(res[3].data))
                    assert.equal(res[3].error, null)
                    res[3].data.forEach(assertJpegMetadata)
                })
        },
    },
    writeMetadata: {
        'returns rejected promise when trying to execute when not open': (ctx) => {
            return ctx.create()
                .writeMetadata('/temp-file', { comment: 'test-comment' }, ['overwrite_original'])
                .then(() => {
                    throw new Error('writeMetadata should have resulted in error')
                })
                .catch(err => assert.equal(err.message, 'exiftool is not open'))
        },
        'should return rejected promise when data is not an object': (ctx) => {
            return ctx.initAndWriteMetadata('file_path')
                .then(() => {
                    throw new Error('writeMetadata should have resulted in error')
                }, (err) => {
                    assert.equal(err.message, 'Data argument is not an object')
                })
        },
        'should write metadata': (ctx) => {
            const keywords = [ 'keywordA', 'keywordB' ]
            const comment = 'hello world'
            const data = {
                all: '',
                comment, // has to come after all in order not to be removed
                'Keywords+': keywords,
            }
            return ctx.createTempFile()
                .then(() => ctx.initAndWriteMetadata(ctx.tempFile, data, ['overwrite_original']))
                .then((res) => {
                    assert.equal(res.data, null)
                    assert.equal(res.error, '1 image files updated')
                })
                .then(() => ctx.ep.readMetadata(ctx.tempFile))
                .then((res) => {
                    assert(Array.isArray(res.data))
                    assert.equal(res.error, null)
                    const meta = res.data[0]
                    assert.equal(meta.Keywords.length, keywords.length)
                    meta.Keywords.forEach((keyword, index) => {
                        assert.equal(keyword, keywords[index])
                    })
                    assert.equal(meta.Comment, comment)
                    assert.equal(meta.Scene, undefined) // should be removed with -all=
                })
        },
    },
}

module.exports = exiftoolTestSuite
