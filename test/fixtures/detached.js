const ExiftoolContext = require('exiftool-context')
const util = require('util')
const exiftool = require('../../.')

const debuglog = util.debuglog('detached')

const bin = ExiftoolContext.exiftoolBin
const ep = new exiftool.ExiftoolProcess(bin)

if (typeof process.send !== 'function') {
    throw new Error('This module should be spawned with an IPC channel.')
}

const detached = process.env.DETACHED === 'true'

debuglog('fork pid: %s', process.pid)

ep
    .open({ detached })
    .then((pid) => {
        debuglog('exiftool pid: %s', pid)
        ep._process.unref()
        process.send(pid)
    })
    .catch((err) => {
        console.log(err)
        process.exit(1)
    })
