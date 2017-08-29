const context = require('exiftool-context')
const assert = require('assert')
const exiftool = require('../../src/')
context.globalExiftoolConstructor = exiftool.ExiftoolProcess

const OptionsTestSuite = {
    context,
    'calls child_process.spawn with specified options': (ctx) => {
        ctx.mockSpawn()
        const options = { detached: true }

        return ctx.createOpen(options)
            .then(() => {
                assert.equal(ctx.proc.args.options, options)
            })
    },
    'returns rejected promise when trying to open without readable stderr': (ctx) => {
        const options = {
            stdio: ['pipe', 'pipe', 'ignore'],
        }
        return ctx.createOpen(options)
            .then(() => {
                throw new Error('open should have resulted in error')
            }, (err) => {
                assert.equal(err.message, 'Process was not spawned with a readable stderr, check stdio options.')
            })
    },
    'returns rejected promise when trying to open without readable stdout': (ctx) => {
        const options = {
            stdio: ['ignore', 'ignore', 'pipe'],
        }
        return ctx.createOpen(options)
            .then(() => {
                throw new Error('open should have resulted in error')
            }, (err) => {
                assert.equal(err.message, 'Process was not spawned with a readable stdout, check stdio options.')
            })
    },
    'returns rejected promise when trying to open without stdin': (ctx) => {
        const options = {
            stdio: ['ignore', 'pipe', 'pipe'],
        }
        return ctx.createOpen(options)
            .then(() => {
                throw new Error('open should have resulted in error')
            }, (err) => {
                assert.equal(err.message, 'Process was not spawned with a writable stdin, check stdio options.')
            })
    },
}

module.exports = OptionsTestSuite
