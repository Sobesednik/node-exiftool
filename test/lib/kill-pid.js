const cp = require('child_process')
const ps = require('ps-node')

const isWindows = process.platform === 'win32'
// use this function when we only have a pid, but not process, i.e.,
// we can't assign on('exit') listener
function killUnixPid(pid) {
    if (isWindows) {
        return Promise.reject(new Error('This function is not available on win'))
    }
    return new Promise((resolve, reject) => {
        ps.kill(pid, (err) => {
            if (err) return reject(err)
            return resolve(pid)
        })
    })
}

function killWinPid(pid) {
    if (!isWindows) {
        return Promise.reject(new Error('This function is only available on win'))
    }
    return new Promise((resolve, reject) => {
        cp.exec(`taskkill /t /F /PID ${pid}`, (err, stdout) => {
            if (err) return reject(err)
            if (!/SUCCESS/.test(stdout)) return reject(new Error(stdout.trim()))
            resolve(pid)
        })
    })
}

/**
 * Kill a process by pid, if pointer is not available.
 * @param {number|string} pid Process ID
 * @returns {Promise.<string|number>} Promise resolved with the pid.
 */
function killPid(pid) {
    return isWindows ? killWinPid(pid) : killUnixPid(pid)
}

module.exports = killPid
