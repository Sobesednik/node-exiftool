'use strict'
const EventEmitter = require('events')
const lib = require('./lib')
const BeginReadySnitch = require('./begin-ready-snitch')

const EXIFTOOL_PATH = 'exiftool'

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
        super()
        this._bin = bin !== undefined ? bin : EXIFTOOL_PATH
        this._process = undefined
        this._open = false
    }

    /**
     * Close the exiftool process by passing -stay_open false.
     * @returns {Promise} a promise to stop the process.
     */
    close() {
        if (!this._open) {
            return Promise.reject(new Error('Exiftool process is not open'))
        }
        return lib.close(this._process)
            .then(() => {
                this._open = false
            })
    }

    /**
     * Spawn exfitool process with -stay_open True -@ - arguments.
     * @returns {Promise} a promise to spawn exiftool in stay_open mode.
     */
    open() {
        if (this._open) {
            return Promise.reject(new Error('Exiftool process is already open'))
        }
        return lib.spawn(this._bin)
            .then((process) => {
                //console.log(`Started exiftool process %s`, process.pid);
                this.emit(events.OPEN, process.pid)
                this._process = process

                process.on('exit', this._exitListener.bind(this))

                this._stdoutSnitch = new BeginReadySnitch(process.stdout)
                this._stderrSnitch = new BeginReadySnitch(process.stderr)

                this._open = true

                return process.pid
            })
    }

    _exitListener() {
        //console.log('exfitool process exit');
        this.emit(events.EXIT)
        this._open = false // try to respawn?
    }

    /**
     * Checks if process is opens.
     * @returns {boolean} true if open and false otherwise.
     */
    get isOpen() {
        return this._open
    }

    _executeCommand(command, args, argsNoSplit) {
        //test this!
        if (!this._open) {
            return Promise.reject(new Error('exiftool is not open'))
        }
        if (this._process.signalCode === 'SIGTERM') {
            return Promise.reject(new Error('Could not connect to the exiftool process'))
        }

        return lib.executeCommand(this._process, this._stdoutSnitch, this._stderrSnitch, command, args, argsNoSplit)
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
        return this._executeCommand(file, args)
    }

    /**
     * Write metadata to a file or directory.
     * @param {string} file - path to the file or directory
     * @param {Object} data - data to write, with keys as tags.
     * @returns {Promise} a promise to write metadata
     */
    writeMetadata(file, data, args) {
        if (!lib.checkDataObject(data)) {
            return Promise.reject(new Error('Data argument is not an object'))
        }
        const writeArgs = lib.mapDataToTagArray(data)
        return this._executeCommand(file, args, writeArgs)
    }
}

module.exports = {
    ExiftoolProcess,
    EXIFTOOL_PATH,
    events,
}
