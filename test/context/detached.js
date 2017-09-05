const cp = require('child_process')
const makepromise = require('makepromise')
const debuglog = require('util').debuglog('detached')
const path = require('path')

const FORK_PATH = path.join(__dirname, '../fixtures/detached')

const isWindows = process.platform === 'win32'

const createFork = (modulePath, detached, env) => cp.spawn(
    process.argv[0],
    [modulePath],
    {
        detached,
        // not doing this will not allow debugging, as fork will try to connect
        // to the same debug port as parent
        execArgv: [],
        env: Object.assign({}, process.env, env),
        stdio: ['pipe', 'pipe', 'pipe', 'ipc'],
    }
)

function getGrep(include, exclude) {
    const grep = include.join('\\|')
    const vgrep = [].concat(exclude, 'grep').join('\\|')
    const com = ['ps xao pid,ppid,pgid,stat,sess,tt,tty,command']
    if (grep) com.push(`grep '${grep}'`)
    com.push(`grep -v '${vgrep}'`)
    const s = com.join(' | ')
    return s
}

function getWmic(include) {
    const procs = include.map(p => `caption='${p}'`).join(' or ')
    return `wmic process where "${procs}" get caption,processid,parentprocessid`
}

function ps(comment) {
    const psInclude = ['node', 'perl', 'npm']
    const psExclude = ['Visual']
    const wmicInclude = ['node.exe', 'exiftool.exe', 'conhost.exe']
    const s = isWindows ? getWmic(wmicInclude) : getGrep(psInclude, psExclude)
    return makepromise(cp.exec, [s])
        .then((r) => {
            debuglog(comment)
            debuglog(`======\n${r}`)
            debuglog('======')
        })
}

function killFork(proc, withGroup) {
    return new Promise((resolve, reject) => {
        proc.once('exit', () => {
            debuglog('killed %s', proc.pid)
            resolve()
        })
        try {
            const p = withGroup ? -proc.pid : proc.pid
            debuglog('going to kill %s', p)
            process.kill(p)
        } catch(err) {
            debuglog(err.message)
            reject(err)
        }
    })
}

/**
 * This context will allow to create and destroy Node fork.
 */
const context = function DetachedContext() {
    this.fork = null
    this.epPid = null

    this.forkNode = (exiftoolDetached) => {
        return ps('before starting fork')
            .then(() => {
                const env = exiftoolDetached ? { EXIFTOOL_DETACHED: true } : {}
                this.fork = createFork(FORK_PATH, true, env)
                debuglog('fork pid: %s', this.fork.pid)
                return new Promise((resolve) => {
                    this.fork.on('message', resolve)
                })
            })
            .then((res) => {
                this.epPid = res
                debuglog('exiftool pid: %s', this.epPid)
                this.fork.on('disconnect', () => {
                    debuglog('fork disconnected')
                })
                this.fork.on('exit', () => {
                    debuglog('fork exited')
                })
                return ps('after starting fork')
            })
            .then(() => ({ epPid: this.epPid, forkPid: this.fork.pid }))
    }
    this.killFork = (withGroup) => {
        if (!this.fork) {
            return Promise.reject(new Error('fork has not started'))
        }
        return killFork(this.fork, withGroup)
    }
    this._destroy = () => ps('after test')
}

module.exports = context
