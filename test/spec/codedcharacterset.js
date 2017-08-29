const assert = require('assert')
const EOL = require('os').EOL
const context = require('exiftool-context')
const exiftool = require('../../src/')
context.globalExiftoolConstructor = exiftool.ExiftoolProcess

const metadata = {
    all: '', // remove all metadata at first
    Title: 'åäö',
    LocalCaption: 'local caption',
    'Caption-Abstract': 'Câptïön \u00C3bstráct: åäö',
    Copyright: '2017 ©',
    'Keywords+': [ 'këywôrd \u00C3…', 'keywórdB ©˙µå≥' ],
    Creator: 'Mr Author',
    Rating: 5,
}

const IPTCEncoding = {
    context,
    'should raise a warning when codedcharacterset=utf8 not provided for IPTC tags': (ctx) => {
        return ctx.createTempFile()
            .then(() => ctx.initAndWriteMetadata(ctx.tempFile, metadata))
            .then((res) => {
                assert.equal(res.data, null)
                const expected = `Warning: Some character(s) could not be encoded in Latin\
 - ${ctx.replaceSlashes(ctx.tempFile)}${EOL}\
    1 image files updated`
                assert.equal(res.error, expected)
            })
    },
    'should successfully update the file when codedcharacterset=utf8 passed': (ctx) => {
        const args = ['codedcharacterset=utf8']
        return ctx.createTempFile()
            .then(() => ctx.initAndWriteMetadata(ctx.tempFile, metadata, args))
            .then((res) => {
                assert.equal(res.data, null)
                const expected = '1 image files updated'
                assert.equal(res.error, expected)
            })
    },
}

module.exports = {
    codedcharacterset: {
        IPTCEncoding,
    },
}
