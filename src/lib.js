const cp = require('child_process');
const EOL = require('os').EOL;

function close(process) {
    return new Promise((resolve) => {
        process.on('close', (code, signal) => {
            resolve(code);
        });
        process.stdin.write(`-stay_open${EOL}`);
        process.stdin.write(`false${EOL}`);
    });
}

function writeStdIn(process, data) {
    // console.log('write stdin', data);
    process.stdin.write(data);
    process.stdin.write(EOL);
}

/**
 * Write command data to the exiftool's stdin.
 * @param {ChildProcess} process - exiftool process executed with -stay_open True -@ -
 * @param {string} command - which command to execute
 * @param {string} commandNumber - text which will be echoed before and after results
 * @param {Array} args - any additional arguments
 */
function execute(process, command, commandNumber, args) {
    args = args !== undefined ? args : [];
    const argsString = args.length ? args.map(arg => `-${arg}`).join(EOL) : '';

    command = command !== undefined ? command : '';

    if (argsString) writeStdIn(process, argsString);
    writeStdIn(process, '-json');
    writeStdIn(process, '-s');
    writeStdIn(process, command);
    writeStdIn(process, '-echo1');
    writeStdIn(process, `{begin${commandNumber}}`);
    writeStdIn(process, '-echo2');
    writeStdIn(process, `{begin${commandNumber}}`);
    writeStdIn(process, '-echo4');
    writeStdIn(process, `{ready${commandNumber}}`);
    writeStdIn(process, `-execute${commandNumber}`);
}

function getCommandNumber() {
    return Math.floor(Math.random() * 1000000);
}

function createHandler(commandNumber, snitch, cb) {
    const handler = (data) => {
        if (data.commandNumber === commandNumber) {
            snitch.removeListener('data', handler)
            cb(data.data)
        }
    }
    snitch.on('data', handler)
}

function executeCommand(process, stdoutSnitch, stderrSnitch, command, args) {
    const commandNumber = getCommandNumber();

    const dataPromise = new Promise(resolve =>
        createHandler(commandNumber, stdoutSnitch, resolve)
    );

    const errPromise = new Promise(resolve =>
        createHandler(commandNumber, stderrSnitch, resolve)
    );

    execute(process, command, commandNumber, args);

    return Promise.all([
        dataPromise,
        errPromise
    ])
        .then(res => ({
            data: res[0] ? JSON.parse(res[0]) : null,
            error: res[1] || null,
        }));
}

function spawn(bin) {
    return new Promise((resolve, reject) => {
        const echoString = Date.now().toString();
        const process = cp.spawn(bin, ['-echo2', echoString, '-stay_open', 'True', '-@', '-']);
        process.once('error', reject);
        const echoHandler = (data) => {
            const d = data.toString().trim();
            // listening for echo2 in stderr (echo and echo1 won't work)
            if (d === echoString) {
                resolve(process);
            } else {
                reject(new Error(`Unexpected string on start: ${d}`))
            }
        }
        process.stderr.once('data', echoHandler);
    });
}

module.exports = {
    spawn,
    close,
    executeCommand,
}
