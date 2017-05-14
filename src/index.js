'use strict'

const EventEmitter = require('events')
const lib = require('./lib')
const beginReady = require('./begin-ready')

const EXIFTOOL_PATH = 'exiftool'

const events = {
    OPEN: 'exiftool_opened',
    EXIT: 'exiftool_exit',
}

class ExiftoolProcess extends EventEmitter {

    /**
     * Create an instance of ExoftoolProcess class.
     * @param {string} [exiftool] - path to executable
     */
    constructor(bin) {
        super()
        this._bin = lib.isString(bin) ? bin : EXIFTOOL_PATH
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
                this._stdoutResolveWs.end()
                this._stderrResolveWs.end()
                this._open = false
            })
    }

    _assignEncoding(encoding) {
        let _encoding
        if (encoding === null) {
            _encoding = undefined
        } else if (lib.isString(encoding)) {
            _encoding = encoding
        } else {
            _encoding = 'utf8'
        }
        this._encoding = _encoding
    }
    /**
     * Spawn exfitool process with -stay_open True -@ - arguments.
     * @returns {Promise} a promise to spawn exiftool in stay_open mode.
     * @param {string} [encoding=utf8] - encoding with which to read from and write to streams.
     * pass null to not use encoding, utf8 otherwise
     */
    open(encoding) {
        this._assignEncoding(encoding)
        if (this._open) {
            return Promise.reject(new Error('Exiftool process is already open'))
        }
        return lib.spawn(this._bin)
            .then((exiftoolProcess) => {
                //console.log(`Started exiftool process %s`, process.pid);
                this.emit(events.OPEN, exiftoolProcess.pid)
                this._process = exiftoolProcess

                exiftoolProcess.on('exit', this._exitListener.bind(this))

                // resolve write streams
                if (this._encoding) {
                    exiftoolProcess.stdout.setEncoding(this._encoding)
                    exiftoolProcess.stderr.setEncoding(this._encoding)
                }
                this._stdoutResolveWs = beginReady.setupResolveWriteStreamPipe(exiftoolProcess.stdout)
                this._stderrResolveWs = beginReady.setupResolveWriteStreamPipe(exiftoolProcess.stderr)

                // handle erros so that Node does not crash
                this._stdoutResolveWs.on('error', console.error)
                this._stderrResolveWs.on('error', console.error)

                // debug
                // exiftoolProcess.stdout.pipe(process.stdout)
                // exiftoolProcess.stderr.pipe(process.stderr)

                this._open = true

                return exiftoolProcess.pid
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

    _executeCommand(command, args, argsNoSplit, debug) {
        //test this!
        if (!this._open) {
            return Promise.reject(new Error('exiftool is not open'))
        }
        if (this._process.signalCode === 'SIGTERM') {
            return Promise.reject(new Error('Could not connect to the exiftool process'))
        }

        const proc = debug === true ? process : this._process
        return lib.executeCommand(proc, this._stdoutResolveWs,
            this._stderrResolveWs, command, args, argsNoSplit, this._encoding)
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
     * @param {object} data - data to write, with keys as tags.
     * @param {object}
     * @param {string} destination where to write
     * @param {boolean} debug whether to print to stdout
     * @returns {Promise} a promise to write metadata
     */
    writeMetadata(file, data, args, debug) {
        if (!lib.isString(file)) {
            throw new Error('File must be a string')
        }
        if (!lib.checkDataObject(data)) {
            return Promise.reject(new Error('Data argument is not an object'))
        }

        const writeArgs = lib.mapDataToTagArray(data)
        return this._executeCommand(file, args, writeArgs, debug)
    }
}

module.exports = {
    ExiftoolProcess,
    EXIFTOOL_PATH,
    events,
}
