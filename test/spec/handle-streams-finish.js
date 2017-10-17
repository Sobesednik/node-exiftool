const context = require('exiftool-context')
const assert = require('assert')
const exiftool = require('../../src/')
const killPid = require('../lib/kill-pid')

context.globalExiftoolConstructor = exiftool.ExiftoolProcess

// kill with operating system methods, rather than sending a signal,
// which does not work on Windows
function kill(proc) {
    if (process.platform !== 'win32') {
        return new Promise((resolve, reject) => {
            proc.once('error', reject)
            proc.once('exit', resolve)
            process.kill(proc.pid)
        })
    }
    return killPid(proc.pid)
}

const expected = 'stdout and stderr finished before operation was complete'

const runTest = async (ctx, getOperationPromise, createTempFile) => {
    ctx.create()
    if (createTempFile) await ctx.createTempFile()
    await ctx.ep.open()
    // stdin might throw "read ECONNRESET" on Linux for some reason
    ctx.ep._process.stdin.on('error', () => {})
    // patch stdout so that we never resolve read metadata promise
    ctx.ep._stdoutResolveWs._write = (obj, enc, next) => {
        next()
    }
    const operationPromise = getOperationPromise()

    const killPromise = kill(ctx.ep._process)

    try {
        await operationPromise
        throw new Error('Expected operation to be rejected')
    } catch ({ message }) {
        assert.equal(message, expected)
        await killPromise
    }
}

const closeStreamsOnExitTestSuite = {
    context,
    'should return rejected promise when reading': async (ctx) => {
        const getOperationPromise = () => ctx.ep.readMetadata(ctx.folder)
        await runTest(ctx, getOperationPromise)
    },
    'should return rejected promise when writing': async (ctx) => {
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

        await runTest(ctx, getOperationPromise, true)
    },
}

module.exports = closeStreamsOnExitTestSuite
