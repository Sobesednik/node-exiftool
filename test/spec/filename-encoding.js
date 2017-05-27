'use strict'

const assert = require('assert')
const context = require('exiftool-context')
const path = require('path')
const exiftool = require('../../src/index')
context.globalExiftoolConstructor = exiftool.ExiftoolProcess


// thanks stackoverflow
function toUnicode(theString) {
    let unicodeString = ''
    for (var i=0; i < theString.length; i++) {
        let theUnicode = theString.charCodeAt(i).toString(16).toUpperCase()
        while (theUnicode.length < 4) {
            theUnicode = '0' + theUnicode
        }
        theUnicode = '\\u' + theUnicode
        unicodeString += theUnicode
    }
    return unicodeString
}

const Encoding = {
    context,
    'should read file with filename in utf8': (ctx) => {
        const basename = path.basename(ctx.filenameWithEncoding)
        console.log(basename, toUnicode(basename))
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
