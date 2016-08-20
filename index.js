'use strict';
const cp = require('child_process');
const fs = require('fs');
const path = require('path');
const EventEmitter = require('events');
const EOL = require('os').EOL;

const EXIFTOOL_PATH = path.resolve(path.join(__dirname, 'vendor', 'Image-ExifTool-10.25', 'exiftool'));

const events = {
    OPEN: 'exiftool_opened',
    EXIT: 'exiftool_exit',
}
/**
 * A deferred which promise will be resolved when both
 * data and error from exiftool process have been received.
 */
class CommandDeferred {
    constructor() {
        this._data = undefined;
        this._error = undefined;
        this._commandNumber = String(Math.floor(Math.random()*1000000)); //commandNumber;
        this._re = CommandDeferred._makeRegExp(this._commandNumber);
        this._promise = new Promise((resolve, reject) => {
            this._resolve = function(res) {
                resolve(res);
            }
            this._reject = function(err) {
                reject(err);
            }
        });
    }
    _addData(data) {
        //console.log(`Received data for ${this._commandNumber}: "${data}"`);
        if(data) {
            try {
                this._data = JSON.parse(data);
            } catch (err) {
                // should not really happen with -j flag
                this._reject(new Error('Could not parse response'));
            }
        } else {
            this._data = null;
        }
        this._sync();
    }
    _addError(error) {
        //console.log(`Received error for ${this._commandNumber}: "${error}"`);
        if(error) {
            this._error = error.trim();
        } else {
            this._error = null;
        }
        this._sync();
    }
    _sync(d, e) {
        if (this._data !== undefined && this._error !== undefined) {
            this._resolve({ data: this._data, error: this._error });
        }
    }
    get commandNumber() {
        return this._commandNumber;
    }
    get promise() {
        return this._promise;
    }
    matchData(string) {
        const res = this._re.exec(string);
        if (res) {
            this._addData(res[1]);
            return res[0];
        } else {
            return false;
        }
    }
    matchError(string) {
        const res = this._re.exec(string);
        if (res) {
            this._addError(res[1]);
            return res[0];
        } else {
            return false;
        }
    }
    reject(err) {
        this._reject(err);
    }
    get hasData() {
        return this._data !== undefined;
    }
    get hasError() {
        return this._error !== undefined;
    }
    static _makeRegExp(commandNumber) {
        return new RegExp(`{begin${commandNumber}}${EOL}` +
                          '([\\s\\S]*)' +
                          `{ready${commandNumber}}${EOL}`);
    }
}

class ExiftoolProcess extends EventEmitter {

    /**
     * Create an instance of ExoftoolProcess class.
     * @param {string} [bin=vendor/Image-ExifTool/exiftool] - path to executable
     */
    constructor(bin) {
        super();
        this._bin = bin !== undefined ? bin : EXIFTOOL_PATH;
        this._process = undefined;
        this._open = false;
    }

    /**
     * Kill the exiftool process.
     * @returns {Promise} a promise to stop the process.
     */
    close() {
        if (!this._open) {
            return Promise.reject(new Error('Exiftool process is not open'));
        }
        return new Promise((resolve) => {
            this._process.on('close', (code, signal) => {
                this._open = false;
                resolve(code);
            });
            this._process.stdin.write(`-stay_open${EOL}`);
            this._process.stdin.write(`false${EOL}`);
            this._process.kill();
        });
    }

    /**
     * Spawn exfitool process with -stay_open True -@ - arguments.
     * @returns {Promise} a promise to spawn exiftool in stay_open mode.
     */
    open() {
        if (this._open) {
            return Promise.reject(new Error('Exiftool process is already open'));
        }
        return new Promise((resolve, reject) => {
            const echo = String(Date.now());
            const process = cp.spawn(this._bin, ['-echo2', echo, '-stay_open', 'True', '-@', '-']);
            process.on('error', (err) => {
                reject(err);
            });
            const echoHandler = (data) => {
                // listening for echo2 in stderr (echo and echo1 won't work)
                if(String(data).trim() === echo) {
                    process.stderr.removeListener('data', echoHandler);
                    resolve(process);
                }
            }
            process.stderr.on('data', echoHandler);
        }).then((process) => {
            //console.log(`Started exiftool process %s`, process.pid);
            this.emit(events.OPEN, process.pid);
            this._process = process;

            process.on('exit', () => this._exitListener());

            this._stdoutData = '';
            this._stderrData = '';
            this._deferreds = [];

            process.stdout.on('data', data => this._stdoutListener(data));
            process.stderr.on('data', data => this._stderrListener(data));

            this._open = true;

            return process.pid;
        });
    }

    _exitListener() {
        //console.log('exfitool process exit');
        this.emit(events.EXIT);
        this._deferreds.forEach((d) => {
            d.reject(new Error('The process has exited'));
        });
        this._deferreds.length = 0; //empty array
        this._open = false; // try to respawn?
    }

    _stdoutListener(data) {
        //console.log(`---\n[+] exiftool stdout:\n"${String(data).trim()}"\n---`);
        this._stdoutData += data;
        this._deferreds.forEach((d) => {
            if(!d.hasData) {
                const res = d.matchData(this._stdoutData);
                if (res) {
                    this._stdoutData = this._stdoutData.split(res).join('');
                }
            }
        });
    }

    _stderrListener(data) {
        //console.log(`---\n[+] exiftool stderr:\n"${String(data).trim()}"\n---`);
        this._stderrData += data;
        this._deferreds.forEach((d) => {
            if(!d.hasError) {
                const res = d.matchError(this._stderrData);
                if (res) {
                    this._stderrData = this._stderrData.split(res).join('');
                }
            }
        });
    }

    /**
     * Checks if process is opens.
     * @returns {boolean} true if open and false otherwise.
     */
    get isOpen() {
        return this._open;
    }

    /**
     * Write command data to the exiftool's stdin.
     * @param {ChildProcess} process - exiftool process executed with -stay_open True -@ -
     * @param {string} command - which command to execute
     * @param {string} commandNumber - text which will be echoed before and after results
     * @param {Array} args - any additional arguments
     */
    static _execute(process, command, commandNumber, args) {
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

    _executeCommand(command, args) {
        //test this!
        if (!this._open) {
            return Promise.reject(new Error('exiftool is not open'));
        }
        if (this._process.signalCode === 'SIGTERM') {
            return Promise.reject(new Error('Could not connect to the exiftool process'));
        }

        const deferred = new CommandDeferred();
        this._deferreds.push(deferred);

        ExiftoolProcess._execute(this._process, command, deferred.commandNumber, args);

        deferred.promise.then(() => {
            const index = this._deferreds.indexOf(deferred);
            if (index > -1) {
                this._deferreds.splice(index, 1);
            }
        });

        return deferred.promise;
    }

    /**
     * Read metadata of a file or directory.
     * @param {string} file - path to the file or directory
     * @param {Array} args - any additional arguments, e.g.,
     * ['Orientation#'] to report Orientation only, or ['-FileSize'] to exclude FileSize
     * @returns {Promise} a promise resolved with data (array or null) and error
     * (string or null) properties from stdout and stderr of exiftool.
     */
    readMetadata(file, args) {
        return this._executeCommand(file, args);
    }
}

module.exports = {
    ExiftoolProcess,
    CommandDeferred,
    EXIFTOOL_PATH,
    events,
}
