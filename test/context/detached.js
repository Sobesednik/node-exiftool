const cp = require('child_process')
const makepromise = require('makepromise')
const debuglog = require('util').debuglog('detached')
const path = require('path')

const MODULE_PATH = path.join(__dirname, './detached-child.js')

const createFork = (modulePath, detached, env) => cp.spawn('node', [modulePath], {
    detached,
    // not doing this will not allow debugging, as fork will try to connect
    // to the same debug port as parent
    execArgv: [],
    env: Object.assign({}, process.env, env),
    stdio: ['pipe', 'pipe', 'pipe', 'ipc'],
})

function ps(include, exclude) {
    const grep = include.join('\\|')
    const vgrep = [].concat(exclude, 'grep').join('\\|')
    const com = ['ps xao pid,ppid,pgid,stat,sess,tt,tty,command']
    if (grep) com.push(`grep '${grep}'`)
    com.push(`grep -v '${vgrep}'`)
    const s = com.join(' | ')
    return makepromise(cp.exec, [s])
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
 * This context is a work-around for Travis build stopping earlier on OSX,
 * when killing detached fork by process group id results in failure.
 */
const context = function DetachedContext() {
    Object.defineProperties(this, {
        _destroy: {
            value: () => {
                if (this.proc) {
                    return killFork(this.proc)
                }
                return Promise.resolve()
            },
        },
        ps: {
            value: () => {
                return ps(['node', 'perl', 'npm'], ['Visual'])
                    .then(r => debuglog(`\n${r}`))
                    .then(() => {
                        // return ps([], ['Visual'])
                    })
                    // .then(r => debuglog(`\n${r}`))
            },
        },
    })

    if (process.platform !== 'darwin') {
        return
    }

    return ps(['node', 'perl', 'npm'], ['Visual'])
        .then((r) => {
            debuglog('before starting context proc')
            debuglog('======')
            debuglog(`\n${r}`)
            debuglog('======')
        })
        .then(() => {
            this.proc = createFork(MODULE_PATH, true, {
                EXIFTOOL_DETACHED: true,
            })
            return new Promise((resolve) => {
                this.proc.once('message', resolve)
            })
        })
        .then((res) => {
            if (res !== this.proc.pid) {
                throw new Error('received pid does not match expected')
            }
            debuglog('(context) fork pid: %s', this.proc.pid)
            this.proc.on('disconnect', () => {
                debuglog('(context) fork disconnected')
            })
        })
}

Object.defineProperties(context, {
    createFork: {
        get: () => createFork,
    },
    ps: {
        get: () => ps,
    },
    killFork: {
        get: () => killFork,
    },
})

module.exports = context
