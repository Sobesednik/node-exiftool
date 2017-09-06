'use strict'

const context = require('exiftool-context')
const assert = require('assert')
const exiftool = require('../../src/')
const killPid = require('../lib/kill-pid')

context.globalExiftoolConstructor = exiftool.ExiftoolProcess

// kill with operating system methods, rather than sending a signal,
// which does not work on Windows
function killAndWaitForExit(proc) {
    const pid = proc.pid
    const killPromise = killPid(pid)
    const exitPromise = new Promise(resolve => proc.once('exit', resolve))
    return Promise.all([killPromise, exitPromise])
}

const expected = 'stdout and stderr finished before operation was complete'

const runTest = (ctx, getOperationPromise, createTempFile) => {
    let err
    ctx.create()
    return (createTempFile ? ctx.createTempFile() : Promise.resolve())
        .then(() => ctx.ep.open())
        .then(() => {
            // stdin might throw "read ECONNRESET" on Linux for some reason
            ctx.ep._process.stdin.on('error', () => {})
            // patch stdout so that we never resolve read metadata promise
            ctx.ep._stdoutResolveWs._write = (obj, enc, next) => {
                next()
            }
            const operationPromise = getOperationPromise()
                .catch((error) => { err = error })

            const killPromise = killAndWaitForExit(ctx.ep._process)

            return Promise.all([operationPromise, killPromise])
        })
        .then(() => {
            if (!err) {
                throw new Error('Expected operation to be rejected')
            }
            throw err
        }).catch((error) => {
            assert.equal(error.message, expected)
        })
}

const closeStreamsOnExitTestSuite = {
    context,
    'should return rejected promise on read': (ctx) => {
        const getOperationPromise = () => ctx.ep.readMetadata(ctx.folder)
        return runTest(ctx, getOperationPromise)
    },
    'should return rejected promise on write': (ctx) => {
        const getOperationPromise = () => {
            const keywords = [ 'keywordA', 'keywordB' ]
            const comment = 'hello world'
            const data = {
                all: '',
                comment, // has to come after all in order not to be removed
                'Keywords+': keywords,
            }
            return ctx.ep.writeMetadata(ctx.tempFile, data, ['overwrite_original'])
        }

        return runTest(ctx, getOperationPromise, true)
    },
}

module.exports = closeStreamsOnExitTestSuite
