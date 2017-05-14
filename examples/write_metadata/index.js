#!/usr/bin/env node
/**
 * This example shows how to write metadata, with unicode characters. It will create a new file in
 * the example directory.
 *
 * ./examples/write_metadata/index.js, or
 * npm run write-example
 */

const exiftool =  require('../..')
const exiftoolBin = require('dist-exiftool')
const path = require('path')
const lib = require('../lib')

const ep = new exiftool.ExiftoolProcess(exiftoolBin)

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

function writeMetadata(file, metadata, extraArgs, debug) {
    let res
    return ep
        .open()
        .then((pid) => console.log('Started exiftool process %s', pid))
        .then(() => ep.writeMetadata(file, metadata, extraArgs, debug))
        .then((writeRes) => {
            res = writeRes
        })
        .catch((err) => {
            console.error(err)
        })
        .then(() => ep.close())
        .then(() => console.log('Closed exiftool'))
        .then(() => res)
}

const originalFile = path.join(__dirname, 'image.jpg')
const filename = lib.makeJpegFilenameWithParams('image', { codedcharacterset: 'utf8' })
const file = path.join(__dirname, filename)

function run() {
    return lib.cloneFile(originalFile, file)
        .then(file => writeMetadata(file, metadata, ['codedcharacterset=utf8', 'overwrite_original']))
}

run()
    .then(results => console.log(JSON.stringify(results, null, 2)))
