'use strict'

const makepromise = require('makepromise')
const ps = require('ps-node')
const assert = require('assert')
const killPid = require('../lib/kill-pid')

const exiftool = require('../../src/')
const context = require('../context/detached')
context.globalExiftoolConstructor = exiftool.ExiftoolProcess

const isWindows = process.platform === 'win32'

const checkPid = pid => makepromise(ps.lookup, { pid })
const checkPpid = ppid => makepromise(ps.lookup, { ppid })

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

const findExiftoolChildAndConhost = (epPid, exiftoolDetached) => {
    if (!isWindows) {
        return Promise.reject(new Error('This function is only available on Windows'))
    }
    return checkPpid(epPid)
        .then((res) => {
            // if not detached, conhost is child of parent exiftool,
            // which is already found above
            if (!exiftoolDetached) return res
            // if detached, conhost is child of child exiftool,
            // which we are now finding
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
            assert.equal(res.length, 2)
            const conhost = res.find(p => /conhost\.exe/.test(p.command))
            assert(conhost, 'conhost.exe should have been started as child of exiftool')
            const conhostPid = conhost.pid
            const epChild = res.find(p => /exiftool\.exe/.test(p.command))
            assert(epChild, 'exiftool.exe should have been started as child of exiftool')
            const epChildPid = epChild.pid
            return { conhostPid, epChildPid }
        })
}

/**
 * Fork a node process with a module which will spawn exiftool. Because of the
 * way exiftool works on Windows, it will spawn an extra process itself.
 * @param {boolean} exiftoolDetached Whether to start exiftool in detached mode
 * @returns {CheckPidsFn} A scoped function to check pids
 */
const setup = (exiftoolDetached, ctx) => {
    let checkPids

    return ctx.forkNode(exiftoolDetached)
        .then((meta) => {
            const forkPid = meta.forkPid
            const epPid = meta.epPid

            const res = { forkPid, epPid }

            if (isWindows) {
                return findExiftoolChildAndConhost(epPid, exiftoolDetached)
                    .then(r => Object.assign(res, r))
            }
            return res
        })
        .then((res) => {
            checkPids = createCheckPids(res.forkPid, res.epPid, res.epChildPid, res.conhostPid)
            return checkPids()
        })
        .then((res) => {
            assert(res.fork)
            assert(res.ep)
            if (isWindows) {
                assert(res.epChild)
                assert(res.conhost)
            }
            return checkPids
        })
}

const createTestWin = (detached) => {
    const test = (ctx) => {
        let checkPids
        return setup(detached, ctx)
            .then((res) => {
                checkPids = res
                return ctx.killFork().then(checkPids)
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
                return killPid(res.epChild.pid)
            })
    }
    return test
}

const createTest = (detached) => {
    const test = (ctx) => {
        let checkPids
        return setup(detached, ctx)
            .then((res) => {
                checkPids = res
                return ctx.killFork(true).then(checkPids)
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
        context,
        'should quit child process when fork exits without detached option (win)': createTestWin(),
        'should not quit child process when fork exits with detached option (win)': createTestWin(true),
    })
} else {
    Object.assign(DetachedTrueTestSuite, {
        context,
        // Also note: on Linux, child processes of child processes will not be terminated when attempting to kill their parent.
        // kill detached fork by passing -pid (i.e., pgid)
        // https://nodejs.org/api/child_process.html#child_process_subprocess_kill_signal
        'should quit child process when fork exits without detached option': createTest(),
        'should not quit child process when fork exits with detached option': createTest(true),
    })
}


module.exports = DetachedTrueTestSuite
