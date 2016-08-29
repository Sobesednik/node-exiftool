'use strict';
const cp = require('child_process');
const fs = require('fs');
const path = require('path');
const EventEmitter = require('events');
const EOL = require('os').EOL;
const lib = require('./lib');
const CommandDeferred = require('./command-deferred');

const EXIFTOOL_PATH = 'exiftool';

const events = {
    OPEN: 'exiftool_opened',
    EXIT: 'exiftool_exit',
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
        return lib.close(this._process)
            .then(() => {
                this._open = false;
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
        return lib.spawn(this._bin).then((process) => {
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

        lib.execute(this._process, command, deferred.commandNumber, args);

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
    EXIFTOOL_PATH,
    events,
}
