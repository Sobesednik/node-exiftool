const ExiftoolContext = require('exiftool-context')
const exiftool = require('../../.')

const bin = ExiftoolContext.exiftoolBin
const ep = new exiftool.ExiftoolProcess(bin)

if (typeof process.send !== 'function') {
    throw new Error('This module should be spawned with an IPC channel.')
}

const EXIFTOOL_DETACHED = process.env.EXIFTOOL_DETACHED === 'true'

ep
    .open({ detached: EXIFTOOL_DETACHED })
    .then((pid) => {
        process.send(pid)
    })
    .catch((err) => {
        console.log(err) // eslint-disable-line no-console
        process.exit(1)
    })
