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

    process.stdin.write(argsString);
    process.stdin.write(EOL);
    process.stdin.write(`-json${EOL}`);
    process.stdin.write(`-s${EOL}`);
    process.stdin.write(command);
    process.stdin.write(EOL);
    process.stdin.write(`-echo1${EOL}{begin${commandNumber}}${EOL}`);
    process.stdin.write(`-echo2${EOL}{begin${commandNumber}}${EOL}`);
    process.stdin.write(`-echo4${EOL}{ready${commandNumber}}${EOL}`);
    process.stdin.write(`-execute${commandNumber}${EOL}`);
}

function spawn(bin) {
    return new Promise((resolve, reject) => {
        const echo = String(Date.now());
        const process = cp.spawn(bin, ['-echo2', echo, '-stay_open', 'True', '-@', '-']);
        process.on('error', (err) => {
            reject(err);
        });
        const echoHandler = (data) => {
            // listening for echo2 in stderr (echo and echo1 won't work)
            if (String(data).trim() === echo) {
                process.stderr.removeListener('data', echoHandler);
                resolve(process);
            }
        }
        process.stderr.on('data', echoHandler);
    });
}

module.exports = {
	spawn,
	close,
    execute,
}
