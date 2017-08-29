const assert = require('assert')
const context = require('exiftool-context')
const exiftool = require('../../src/')
context.globalExiftoolConstructor = exiftool.ExiftoolProcess

/*
* If something is going wrong with this test suite, check
* https://github.com/Sobesednik/exiftool-context#filenamewithencoding
*/
const Encoding = {
    context,
    /*'should contain correct file in the repo': (ctx) => {
        const fs = require('fs')
        const path = require('path')
        const basename = path.basename(ctx.filenameWithEncoding)
        const dir = path.dirname(ctx.filenameWithEncoding)

        console.log('File to read: %s', ctx.filenameWithEncoding)
        console.log('Filename in unicode to read: %s', ctx.toUnicode(basename))
        const res = fs.readdirSync(dir)
        console.log('Files in fixtures:')
        res.map(n => ` ${n}: ${ctx.toUnicode(n)}`).forEach(n => console.log(n))
    },*/
    'should read file with filename in utf8': (ctx) => {
        return ctx.initAndReadMetadata(ctx.filenameWithEncoding, ['charset filename=utf8'])
            .then((res) => {
                assert.notEqual(res.data, null)
                assert.equal(
                    res.data[0].SourceFile,
                    ctx.replaceSlashes(ctx.filenameWithEncoding)
                )
                assert.equal(res.error, null)
            })
    },
}

module.exports = {
    encoding: Encoding,
}
