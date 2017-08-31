'use strict'

const cp = require('child_process')
const path = require('path')
const makepromise = require('makepromise')
const ps = require('ps-node')
const assert = require('assert')

const detachedModulePath = path.join(__dirname, '../fixtures/detached.js')

const isWindows = process.platform === 'win32'

const createMessagePromise = proc => new Promise(resolve => proc.on('message', resolve))

function killWinPid(pid) {
    if (process.platform !== 'win32') {
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

// use this function when we only have a pid, but not process, i.e.,
// we can't assign on('exit') listener
function killPid(pid) {
    if (process.platform === 'win32') {
        return Promise.reject(new Error('This function is not available on win'))
    }
    return new Promise((resolve, reject) => {
        ps.kill(pid, (err) => {
            if (err) return reject(err)
            return resolve()
        })
    })
}

function killFork(proc, withGroup) {
    return new Promise((resolve, reject) => {
        proc.once('exit', resolve)
        try {
            process.kill(withGroup ? -proc.pid : proc.pid)
        } catch(err) {
            reject(err)
        }
    })
}

const checkPid = pid => makepromise(ps.lookup, { pid })
const checkPpid = ppid => makepromise(ps.lookup, { ppid })

const createProc = detached => cp.fork(detachedModulePath, [], {
     // not doing this will not allow debugging, as fork will try to connect
     // to the same debug port as parent
    execArgv: [],
    // make fork start in a new group, so it can be killed with its children
    detached: true,
    env: Object.assign({}, process.env, {
        DETACHED: !!detached,
    }),
})

/**
 * @typedef {Object} PSRes
 * @property {string} pid
 * @property {string} command
 * @property {string[]} arguments
 * @property {string} ppid
 */

/**
 * @typedef {Object} CheckPidsRes
 * @property {PSRes} [fork]
 * @property {PSRes} [ep]
 * @property {PSRes} [epChild]
 * @property {PSRes} [conhost]
 */

/**
 * @typedef {function(): Promise.<CheckPidsRes>} CheckPidsFn
 */

/**
 * Create checkPids function.
 * @param {string|number} forkPid pid of Node fork
 * @param {string|number} epPid exiftool pid
 * @param {string|number} [epChildPid] on windows, child ep pid
 * @param {string|number} [conhostPid] on windows, child conhost pid
 * @returns {CheckPidsFn} Function to check pids with ps-node
 */
function createCheckPids(forkPid, epPid, epChildPid, conhostPid) {
    assert(forkPid)
    assert(epPid)
    const arr = [forkPid, epPid]
    if (epChildPid) arr.push(epChildPid)
    if (conhostPid) arr.push(conhostPid)
    const checkPids = () => checkPid(arr)
        .then((res) => {
            const fork = res.find(r => r.pid === `${forkPid}`)
            const ep = res.find(r => r.pid === `${epPid}`)
            const epChild = epChildPid ? res.find(r => r.pid === `${epChildPid}`) : undefined
            const conhost = conhostPid ? res.find(r => r.pid === `${conhostPid}`) : undefined
            const o = {
                fork,
                ep,
                epChild,
                conhost,
            }
            // filter out undefined
            const fo = Object.keys(o).reduce((acc, key) => {
                const value = o[key]
                if (value === undefined) {
                    return acc
                }
                return Object.assign({}, acc, {
                    [key]: value,
                })
            }, {})
            return fo
        })
    return checkPids
}

/**
 * Fork a node process with a module which will spawn exiftool. Because of the
 * way exiftool works on Windows, it will spawn an extra process itself.
 * @param {boolean} detached Whether to start exiftool in detached mode
 * @returns {{ fork: ChildProcess, checkPids: CheckPidsFn }}
 */
const setup = (detached) => {
    let epPid
    let checkPids

    const fork = createProc(detached)

    return createMessagePromise(fork)
        .then((res) => {
            epPid = res
            return checkPpid(epPid) // find child exiftool on windows by parent pid
        })
        .then((res) => {
            // this step is to find conhost on Windows
            if (!isWindows) return res
            // if not detached, conhost is child of parent exiftool
            if (!detached) return res
            // if detached, conhost is child of child exiftool
            const childExiftool = res[0]
            assert(childExiftool)
            assert(/exiftool\.exe/.test(childExiftool.command))
            return checkPpid(childExiftool.pid).then((conhostRes) => {
                const conhost = conhostRes[0]
                assert(conhost)
                assert(/conhost.exe/.test(conhost.command))
                const all = [].concat(conhostRes, res)
                return all
            })
        })
        .then((res) => {
            let epChildPid
            let conhostPid
            if (isWindows) {
                assert.equal(res.length, 2)
                const conhost = res.find(p => /conhost\.exe/.test(p.command))
                assert(conhost, 'conhost.exe should have been started as child of exiftool')
                conhostPid = conhost.pid
                const epChild = res.find(p => /exiftool\.exe/.test(p.command))
                assert(epChild, 'exiftool.exe should have been started as child of exiftool')
                epChildPid = epChild.pid
            } else {
                assert(!res.length, 'Child exiftool should not have been found on Unix')
            }
            checkPids = createCheckPids(fork.pid, epPid, epChildPid, conhostPid)
            return checkPids()
        })
        .then((res) => {
            assert(res.fork)
            assert(res.ep)
            if (isWindows) {
                assert(res.epChild)
                assert(res.conhost)
            }
            return { checkPids, fork }
        })
}

const createTestWin = (detached) => {
    const test = () => {
        let checkPids
        return setup(detached)
            .then((meta) => {
                checkPids = meta.checkPids
                return killFork(meta.fork).then(checkPids)
            })
            .then((res) => {
                assert(!res.fork, 'Node fork should have quit')
                assert(res.epChild, 'Exiftool child should stay open')
                assert(res.conhost, 'conhost should stay open')

                if (detached) {
                    assert(res.ep, 'Exiftool parent should stay open')
                } else {
                    assert(!res.ep, 'Exiftool parent should have quit')
                }

                // cleanup by killing child exiftool, this should kill the whole tree
                return killWinPid(res.epChild.pid)
            })
    }
    return test
}

const createTest = (detached) => {
    const test = () => {
        let checkPids
        return setup(detached)
            .then((meta) => {
                checkPids = meta.checkPids
                const ps = cp.execSync('ps xao pid,ppid,pgid,stat,sess,tt,command | grep \'node\\|perl\' | grep -v \'chrome\\|Visual\'')
                console.log(String(ps))
                console.log('going to kill by pgid %s', -meta.fork.pid)
                return killFork(meta.fork, true).then(checkPids)
            })
            .then((res) => {
                assert(!res.fork, 'Node fork should have quit')

                if (detached) {
                    assert(res.ep, 'Exiftool parent should stay open')
                    return killPid(res.ep.pid)
                } else {
                    assert(!res.ep, 'Exiftool parent should have quit')
                }
            })

    }
    return test
}

const DetachedTrueTestSuite = {}

if (isWindows) {
    Object.assign(DetachedTrueTestSuite, {
        'should quit child process when fork exits without detached option (win)': createTestWin(),
        'should not quit child process when fork exits with detached option (win)': createTestWin(true),
    })
} else {
    Object.assign(DetachedTrueTestSuite, {
        // Also note: on Linux, child processes of child processes will not be terminated when attempting to kill their parent.
        // kill detached fork by passing -pid (i.e., pgid)
        // https://nodejs.org/api/child_process.html#child_process_subprocess_kill_signal
        'should quit child process when fork exits without detached option': createTest(),
        'should not quit child process when fork exits with detached option': createTest(true),
    })
}


module.exports = DetachedTrueTestSuite
