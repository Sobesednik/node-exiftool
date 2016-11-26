'use strict'

const path = require('path')
const os = require('os')
const assert = require('assert')
const fs = require('fs')
const child_process = require('child_process')
const exiftoolBin = require('dist-exiftool')
const ChildProcess = child_process.ChildProcess
const EOL = os.EOL
const exiftool = require('../../src/index')

// exiftool will print "File not found: test/fixtures/no_such_file.jpg"
// with forward slashes independent of platform
const replaceSlashes = str => str.replace(/\\/g, '/')

const fixturesDir = 'fixtures'
const testDir = 'test'
const fileDoesNotExist = replaceSlashes(path.join(testDir, fixturesDir, 'no_such_file.jpg'))
const fileDoesNotExist2 = replaceSlashes(path.join(testDir, fixturesDir, 'no_such_file2.jpg'))
const jpegFile = path.join(testDir, fixturesDir, 'CANON', 'IMG_9858.JPG')
const jpegFile2 = path.join(testDir, fixturesDir, 'CANON', 'IMG_9859.JPG')
const folder = path.join(testDir, fixturesDir, 'CANON')
const emptyFolder = path.join(testDir, fixturesDir, 'empty')

// create temp file for writing metadata
const tempFile = path.join(os.tmpdir(), `node-exiftool_test_${Math.floor(Math.random() * 100000)}.jpg`)
fs.writeFileSync(tempFile, fs.readFileSync(jpegFile))

const unlinkTempFile = tempFile => new Promise((resolve, reject) =>
    fs.unlink(tempFile, err => (err ? reject(err) : resolve()))
)

function assertJpegMetadata(file) {
    assert(file.FileType === 'JPEG')
    assert(file.MIMEType === 'image/jpeg')
    assert(file.CreatorWorkURL === 'https://sobesednik.media')
    assert(file.Creator === 'Anton')
    assert(file.Scene === '011200')
}

const exiftoolProcesses = []
const startExiftool = () => {
    const ep = new exiftool.ExiftoolProcess(exiftoolBin)
    exiftoolProcesses.push(ep)
    return ep
}

const exiftoolTestSuite = {
    'class': {
        'creates new ExiftoolProcess object with default bin': () => {
            const ep = new exiftool.ExiftoolProcess()
            assert(ep instanceof exiftool.ExiftoolProcess)
            assert(!ep.isOpen)
            assert(ep._bin === exiftool.EXIFTOOL_PATH)
        },
        'creates new ExiftoolProcess object with specific bin': () => {
            const bin = 'notexiftool'
            const ep = new exiftool.ExiftoolProcess(bin)
            assert(ep instanceof exiftool.ExiftoolProcess)
            assert(!ep.isOpen)
            assert(ep._bin === bin)
        },
    },
    'open': {
        'opens exiftool': () => {
            const ep = startExiftool()
            return ep
                .open()
                .then((pid) => {
                    assert(ep._process instanceof ChildProcess)
                    assert(ep._process.stdout.readable)
                    assert(ep._process.stderr.readable)
                    assert(ep._process.stdin.writable)
                    assert(ep.isOpen)
                    assert(typeof pid === 'number')
                    assert(pid === ep._process.pid)
                })
        },
        'returns rejected promise when exiftool executable not found': () => {
            const ep = new exiftool.ExiftoolProcess('notexiftool')
            return ep
                .open()
                .then(() => {
                    throw new Error('open should have resulted in error')
                })
                .catch(() => {})
        },
        'emits OPEN event with PID': () => {
            const ep = startExiftool()
            const eventPromise = new Promise(resolve =>
                ep.on(exiftool.events.OPEN, resolve)
            )
            return ep
                .open()
                .then(() => eventPromise)
                .then(pid => assert(pid === ep._process.pid))
        },
        'returns rejected promise when process is open already': () => {
            const ep = startExiftool()
            return ep
                .open()
                .then(ep.open.bind(ep))
                .then(() => {
                    throw new Error('second open should have resulted in error')
                })
                .catch(() => {})
        },
    },
    'close': {
        'closes the process': () => {
            const ep = startExiftool()
            return ep
                .open()
                .then(ep.close.bind(ep))
                .then(() => {
                    assert(ep._process instanceof ChildProcess)
                    assert(!ep._process.stdout.readable)
                    assert(!ep._process.stderr.readable)
                    assert(!ep._process.stdin.writable)
                    assert(!ep.isOpen)
                })
        },
        'completes remaining jobs': () => {
            const ep = startExiftool()
            return ep
                .open()
                .then(() => {
                    const p = ep
                        .readMetadata(jpegFile)
                        .then((res) => {
                            assert(Array.isArray(res.data))
                            assert(res.error === null)
                            res.data.forEach(assertJpegMetadata)
                        })
                    const p2 = ep
                        .readMetadata(jpegFile2)
                        .then((res) => {
                            assert(Array.isArray(res.data))
                            assert(res.error === null)
                            res.data.forEach(assertJpegMetadata)
                        })
                    const both = Promise.all([p, p2])

                    return ep
                        .close()
                        .then(() => both)
                })
        },
        'emits EXIT event': () => {
            const ep = startExiftool()
            const eventPromise = new Promise(resolve =>
                ep.on(exiftool.events.EXIT, resolve)
            )
            return ep
                .open()
                .then(ep.close.bind(ep))
                .then(() => eventPromise)
        },
        'sets open to false': () => {
            const ep = startExiftool()
            return ep
                .open()
                .then(ep.close.bind(ep))
                .then(() => assert(!ep.isOpen))
        },
        'returns rejected promise when process not open': () => {
            const ep = startExiftool()
            return ep
                .close()
                .then(() => {
                    throw new Error('close should have resulted in error')
                })
                .catch(err => assert(err.message === 'Exiftool process is not open'))
        },
    },
    'readMetadata': {
        'returns rejected promise when trying to execute when not open': () => {
            const ep = startExiftool()
            return ep
                .readMetadata(jpegFile)
                .then(() => {
                    throw new Error('readMetadata should have resulted in error')
                })
                .catch(err => assert(err.message === 'exiftool is not open'))
        },
        'reads metadata of files in a directory': () => {
            const ep = startExiftool()
            return ep
                .open()
                .then(() => ep.readMetadata(folder))
                .then((res) => {
                    assert(Array.isArray(res.data))
                    assert(res.data.length === 5)
                    res.data.forEach(assertJpegMetadata)
                    assert(res.error === `1 directories scanned${EOL}    5 image files read`)
                })
        },
        'returns null data for empty directory and info error': () => {
            const ep = startExiftool()
            return ep
                .open()
                .then(() => ep.readMetadata(emptyFolder))
                .then((res) => {
                    assert(res.data === null)
                    assert(res.error === `1 directories scanned${EOL}    0 image files read`)
                })
        },
        'allows to specify arguments': () => {
            const ep = startExiftool()
            return ep
                .open()
                .then(() => ep.readMetadata(jpegFile, ['Orientation', 'n']))
                .then((res) => {
                    assert(res.error === null)
                    assert(Array.isArray(res.data))
                    assert(res.data[0].SourceFile === 'test/fixtures/CANON/IMG_9858.JPG')
                    assert(res.data[0].Orientation === 6)
                })
        },
        'reads metadata of a file': () => {
            const ep = startExiftool()
            return ep
                .open()
                .then(() => ep.readMetadata(jpegFile))
                .then((res) => {
                    assert(res.error === null)
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
                        XMPToolkit: 'Image::ExifTool 10.11',
                        CreatorWorkURL: 'https://sobesednik.media',
                        Scene: '011200',
                        Creator: 'Anton',
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
                            assert(res.data[0][key] === expected[key])
                        )
                })
        },
        'returns promise with null data and error when file not found': () => {
            const ep = startExiftool()
            return ep
                .open()
                .then(() => ep.readMetadata(fileDoesNotExist))
                .then((res) => {
                    assert(res.data === null)
                    assert(res.error === `File not found: ${fileDoesNotExist}`)
                })
        },
        'works with simultaneous requests': () => {
            const ep = startExiftool()
            return ep
                .open()
                .then(() => Promise.all([
                    ep.readMetadata(fileDoesNotExist),
                    ep.readMetadata(fileDoesNotExist2),
                    ep.readMetadata(jpegFile),
                    ep.readMetadata(jpegFile2),
                ]))
                .then((res) => {
                    assert(res[0].data === null)
                    assert(res[0].error === `File not found: ${fileDoesNotExist}`)

                    assert(res[1].data === null)
                    assert(res[1].error === `File not found: ${fileDoesNotExist2}`)

                    assert(Array.isArray(res[2].data))
                    assert(res[2].error === null)
                    res[2].data.forEach(assertJpegMetadata)

                    assert(Array.isArray(res[3].data))
                    assert(res[3].error === null)
                    res[3].data.forEach(assertJpegMetadata)
                })
        },
    },
    'writeMetadata': {
        'should return rejected promise when data is not an object': () => {
            const ep = startExiftool()
            return ep
                .open()
                .then(() => ep.writeMetadata('file_path'))
                .then(() => {
                    throw new Error('writeMetadata should have resulted in error')
                })
                .catch(err => assert(err.message === 'Data argument is not an object'))
        },
        'should write metadata': () => {
            const ep = startExiftool()
            const keywords = [ 'keywordA', 'keywordB' ]
            const comment = 'hello_world'
            const data = {
                all: '',
                comment, // has to come after all in order not to be removed
                'Keywords+': keywords,
            }
            return ep
                .open()
                .then(() => ep.writeMetadata(tempFile, data, ['overwrite_original']))
                .then((res) => {
                    assert(res.data === null)
                    assert(res.error === '1 image files updated')
                })
                .then(() => ep.readMetadata(tempFile))
                .then((res) => {
                    assert(Array.isArray(res.data))
                    assert(res.error === null)
                    const meta = res.data[0]
                    assert(meta.Keywords.length === keywords.length)
                    meta.Keywords.forEach((keyword, index) => {
                        assert(keyword === keywords[index])
                    })
                    assert(meta.Comment === comment)
                    assert(meta.Scene === undefined) // should be removed with -all=
                })
        },
    },
    '_after': {
        'closes exiftool processes': () =>
            Promise
                .all(
                    exiftoolProcesses.map(
                        ep => ep.close()
                    )
                )
                .catch(() => {}),
        'removes temp file': () =>
            unlinkTempFile(tempFile)
    }
}

module.exports = exiftoolTestSuite
