const { exiftoolBin: bin } = require('exiftool-context')
const exiftool = require('../../src/')

if (typeof process.send !== 'function') {
    throw new Error('This module should be spawned with an IPC channel.')
}

const { EXIFTOOL_DETACHED } = process.env

const detached = EXIFTOOL_DETACHED === 'true';

(async () => {
    try {
        const ep = new exiftool.ExiftoolProcess(bin)
        const pid = await ep.open({ detached })
        process.send(pid)
    } catch (err) {
        console.log(err) // eslint-disable-line no-console
        process.exit(1)
    }
})()
