'use strict'
const assert = require('assert')
const context = require('exiftool-context')
const fs = require('fs')
const makepromise = require('makepromise')
const exiftool = require('../../src/')
const executeWithRs = require('../../src/execute-with-rs')

context.globalExiftoolConstructor = exiftool.ExiftoolProcess

const readFromStreamTestSuite = {
    context,
    'should read metadata from a read stream': (ctx) => {
        ctx.create()
        return ctx.ep.open()
            .then(() => {
                const rs = fs.createReadStream(ctx.jpegFile)
                return ctx.ep.readMetadata(rs)
            })
            .then((res) => {
                assert (Array.isArray(res.data))
                assert(res.data.length > 0)
                return ctx.assertJpegMetadata(res.data[0])
            })
    },
}

function assertDoesNotExist(file) {
    return makepromise(fs.stat, [file])
        .then(() => {
            throw new Error('should have thrown ENOENT error')
        }, (err) => {
            if (!/ENOENT/.test(err.message)) {
                throw err
            }
        })
}
function assertExists(file) {
    return makepromise(fs.stat, [file])
        .then(() => {})
}

const readFromRsTestSuite = {
    context,
    'should reject if non-readable passed': () => {
        return executeWithRs('string', null, () => {})
            .then(() => {
                throw new Error('should have thrown an error')
            }, (err) => {
                assert.equal(err.message, 'Please pass a readable stream')
            })
    },
    'should reject if executeCommand is not a function': (ctx) => {
        const rs = fs.createReadStream(ctx.jpegFile)
        return executeWithRs(rs)
            .then(() => {
                throw new Error('should have thrown an error')
            }, (err) => {
                assert.equal(err.message, 'executeCommand must be a function')
            })
    },
    'should read from a rs': (ctx) => {
        ctx.create()
        return ctx.ep.open()
            .then(() => {
                const rs = fs.createReadStream(ctx.jpegFile)
                const executeCommand = ctx.ep._executeCommand.bind(ctx.ep)
                return executeWithRs(rs, null, executeCommand)
            })
            .then((res) => {
                assert (Array.isArray(res.data))
                assert(res.data.length > 0)
                return ctx.assertJpegMetadata(res.data[0])
            })
    },
    'should return execute function result': (ctx) => {
        const rs = fs.createReadStream(ctx.jpegFile)
        const result = [{ some: 'metadata' }, null]
        const executeCommand = () => {
            return result
        }
        return executeWithRs(rs, null, executeCommand)
            .then((res) => {
                assert.strictEqual(res, result)
            })
    },
    'should call executeCommand with an existing file': (ctx) => {
        const rs = fs.createReadStream(ctx.jpegFile)
        let tempFile
        let fileCreated = false
        let error
        const executeCommand = (_tempFile) => {
            tempFile = _tempFile
            return assertExists(tempFile)
                .then(() => {
                    fileCreated = true
                }, (_error) => {
                    error = _error
                })
        }
        return executeWithRs(rs, null, executeCommand)
            .then(() => {
                assert(fileCreated)
                assert.equal(error, undefined)
            })
    },
    'should call executeCommand with args': (ctx) => {
        const rs = fs.createReadStream(ctx.jpegFile)
        const testArgs = ['some-arg=value']
        let args
        const executeCommand = (_, _args) => {
            args = _args
        }
        return executeWithRs(rs, testArgs, executeCommand)
            .then(() => {
                assert.strictEqual(args, testArgs)
            })
    },
    'should remove temp file': (ctx) => {
        const rs = fs.createReadStream(ctx.jpegFile)
        let tempFile
        const executeCommand = (_tempFile) => {
            tempFile = _tempFile
        }
        return executeWithRs(rs, null, executeCommand)
            .then(() => {
                return assertDoesNotExist(tempFile)
            })
    },
    'should reject with execution error': (ctx) => {
        ctx.create()
        const error = new Error('error during execution')
        return ctx.ep.open()
            .then(() => {
                const rs = fs.createReadStream(ctx.jpegFile)
                const executeCommand = () => {
                    throw error
                }
                return executeWithRs(rs, null, executeCommand)
            })
            .then(() => {
                throw new Error('should have thrown execution error')
            }, (err) => {
                assert.strictEqual(err, error)
            })
    },
    'should remove temp file if executeCommand failed': (ctx) => {
        ctx.create()
        const error = new Error('error during execution')
        let tempFile
        return ctx.ep.open()
            .then(() => {
                const rs = fs.createReadStream(ctx.jpegFile)
                const executeCommand = (_tempFile) => {
                    tempFile = _tempFile
                    throw error
                }
                return executeWithRs(rs, null, executeCommand)
            })
            .then(() => {
                throw new Error('should have thrown execution error')
            }, () => {
                return assertDoesNotExist(tempFile)
            })
    },
}

module.exports = {
    readFromStreamTestSuite,
    readFromRsTestSuite,
}
