const assert = require('assert')
const context = require('exiftool-context')
const exiftool = require('../../src/')
context.globalExiftoolConstructor = exiftool.ExiftoolProcess

const constructorTestSuite = {
    context,
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
        const bin = '/usr/local/my-exiftool'
        ctx.create(bin)
        assert.equal(ctx.ep._bin, bin)
    },
}

module.exports = constructorTestSuite
