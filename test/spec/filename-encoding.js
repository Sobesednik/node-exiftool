const context = require('../context/ExiftoolContext')
const assert = require('assert')

const Encoding = {
    context,
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
