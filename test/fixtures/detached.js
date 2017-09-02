const ExiftoolContext = require('exiftool-context')
const util = require('util')
const exiftool = require('../../.')
const context = require('../context/detached')

const debuglog = util.debuglog('detached')

const bin = ExiftoolContext.exiftoolBin
const ep = new exiftool.ExiftoolProcess(bin)

if (typeof process.send !== 'function') {
    throw new Error('This module should be spawned with an IPC channel.')
}

const EXIFTOOL_DETACHED = process.env.EXIFTOOL_DETACHED === 'true'

debuglog('fork pid: %s', process.pid)
debuglog('exiftool detached: %s', EXIFTOOL_DETACHED)

// ep
//     .open({ detached })
//     .then((pid) => {
//         debuglog('exiftool pid: %s', pid)
//         ep._process.unref()


context.ps(['node', 'perl', 'npm'], ['Visual'])
.then((r) => {
    debuglog('after starting fork')
    debuglog('======')
    debuglog(`\n${r}`)
    debuglog('======')
    process.send(process.pid)
    while (true) {}
})

//     })
//     .catch((err) => {
//         console.log(err)
//         process.exit(1)
//     })
