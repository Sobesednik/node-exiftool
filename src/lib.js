const cp = require('child_process')
const EOL = require('os').EOL

function writeStdIn(process, data) {
    // console.log('write stdin', data)
    process.stdin.write(data)
    process.stdin.write(EOL)
}

function close(process) {
    return new Promise((resolve) => {
        process.on('close', resolve)
        writeStdIn(process, '-stay_open')
        writeStdIn(process, 'false')
    })
}

function getArgs(args, noSplit) {
    const res = []
    if (Array.isArray(args)) {
        args
            .forEach(arg => {
                if (['string', 'String'].indexOf(typeof arg) !== -1) {
                    const prefixedArg = `-${arg}`
                    if (noSplit) {
                        res.push(prefixedArg)
                    } else {
                        prefixedArg
                            .split(/\s+/)
                            .forEach(a => res.push(a))
                    }
                }
            })
    }
    return res
}

/**
 * Write command data to the exiftool's stdin.
 * @param {ChildProcess} process - exiftool process executed with -stay_open True -@ -
 * @param {string} command - which command to execute
 * @param {string} commandNumber - text which will be echoed before and after results
 * @param {Array} args - any additional arguments
 */
function execute(process, command, commandNumber, args, noSplitArgs) {
    const extendedArgs = getArgs(args)
    const extendedArgsNoSplit = getArgs(noSplitArgs, true)

    command = command !== undefined ? command : ''

    // write user arguments
    extendedArgs
        .forEach(writeStdIn.bind(null, process))
    extendedArgsNoSplit
        .forEach(writeStdIn.bind(null, process))

    writeStdIn(process, '-json')
    writeStdIn(process, '-s')
    writeStdIn(process, command)
    writeStdIn(process, '-echo1')
    writeStdIn(process, `{begin${commandNumber}}`)
    writeStdIn(process, '-echo2')
    writeStdIn(process, `{begin${commandNumber}}`)
    writeStdIn(process, '-echo4')
    writeStdIn(process, `{ready${commandNumber}}`)
    writeStdIn(process, `-execute${commandNumber}`)
}

function genCommandNumber() {
    return String(Math.floor(Math.random() * 1000000))
}

function executeCommand(process, stdoutRws, stderrRws, command, args, noSplitArgs) {
    const commandNumber = genCommandNumber()

    const dataPromise = new Promise(resolve => {
        stdoutRws.addToResolveMap(commandNumber, resolve)
    })

    const errPromise = new Promise(resolve =>
        stderrRws.addToResolveMap(commandNumber, resolve)
    )

    execute(process, command, commandNumber, args, noSplitArgs)

    return Promise.all([
        dataPromise,
        errPromise,
    ])
        .then(res => ({
            data: res[0] ? JSON.parse(res[0]) : null,
            error: res[1] || null,
        }))
}

function spawn(bin) {
    return new Promise((resolve, reject) => {
        const echoString = Date.now().toString()
        const process = cp.spawn(bin, ['-echo2', echoString, '-stay_open', 'True', '-@', '-'])
        process.once('error', reject)
        const echoHandler = (data) => {
            const d = data.toString().trim()
            // listening for echo2 in stderr (echo and echo1 won't work)
            if (d === echoString) {
                resolve(process)
            } else {
                reject(new Error(`Unexpected string on start: ${d}`))
            }
        }
        process.stderr.once('data', echoHandler)
    })
}

function checkDataObject(data) {
    return data === Object(data) && !Array.isArray(data)
}

function mapDataToTagArray(data, array) {
    const res = Array.isArray(array) ? array : []
    Object
        .keys(data)
        .forEach(tag => {
            const value = data[tag]
            if (Array.isArray(value)) {
                value.forEach((v) => {
                    const arg = `${tag}=${v}`
                    res.push(arg)
                })
            } else {
                res.push(`${tag}=${value}`)
            }
        })
    return res
}

module.exports = {
    spawn,
    close,
    executeCommand,
    checkDataObject,
    mapDataToTagArray,
    getArgs,
    execute,
}
