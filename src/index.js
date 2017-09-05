'use strict'

const EventEmitter = require('events')
const lib = require('./lib')
const beginReady = require('./begin-ready')
const executeWithRs = require('./execute-with-rs')

const EXIFTOOL_PATH = 'exiftool'

const events = {
    OPEN: 'exiftool_opened',
    EXIT: 'exiftool_exit',
}

class ExiftoolProcess extends EventEmitter {
    /**
     * Create an instance of ExiftoolProcess class.
     * @param {string} [bin="exiftool"] path to executable
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
     * Spawn exiftool process with -stay_open True -@ - arguments.
     * Options can be passed as the first argument instead of encoding.
     * @param {string} [encoding="utf8"] Encoding with which to read from and
     * write to streams. pass null to not use encoding, utf8 otherwise
     * @param {object} [options] options to pass to the spawn method
     * @returns {Promise.<number>} A promise to spawn exiftool in stay_open
     * mode, resolved with pid.
     */
    open(encoding, options) {
        let _encoding = encoding
        let _options = options
        // if encoding is not a string and options are not given, treat it as options
        if (options === undefined && typeof encoding !== 'string') {
            _encoding = undefined
            _options = encoding
        }
        this._assignEncoding(_encoding)
        if (this._open) {
            return Promise.reject(new Error('Exiftool process is already open'))
        }
        return lib.spawn(this._bin, _options)
            .then((exiftoolProcess) => {
                //console.log(`Started exiftool process %s`, process.pid);
                this.emit(events.OPEN, exiftoolProcess.pid)
                this._process = exiftoolProcess

                this._process.on('exit', this._exitListener.bind(this))
                if (!lib.isReadable(this._process.stdout)) {
                    lib.killProcess(this._process)
                    throw new Error('Process was not spawned with a readable stdout, check stdio options.')
                }
                if (!lib.isWritable(this._process.stdin)) {
                    lib.killProcess(this._process)
                    throw new Error('Process was not spawned with a writable stdin, check stdio options.')
                }

                // if process was spawned, stderr is readable (see lib/spawn)

                this._process.stdout.setEncoding(this._encoding)
                this._process.stderr.setEncoding(this._encoding)

                // resolve-write streams
                this._stdoutResolveWs = beginReady.setupResolveWriteStreamPipe(this._process.stdout)
                this._stderrResolveWs = beginReady.setupResolveWriteStreamPipe(this._process.stderr)

                // handle errors so that Node does not crash
                this._stdoutResolveWs.on('error', console.error) // eslint-disable-line no-console
                this._stderrResolveWs.on('error', console.error) // eslint-disable-line no-console

                // debug
                // exiftoolProcess.stdout.pipe(process.stdout)
                // exiftoolProcess.stderr.pipe(process.stderr)

                this._open = true

                return exiftoolProcess.pid
            })
    }

    _exitListener() {
        // console.log('exiftool process exit')
        this.emit(events.EXIT)
        this._open = false // try to re-spawn?
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
     * @param {string|Readable} file path to the file or directory, or a
     * readable stream
     * @param {string[]} args any additional arguments, e.g., ['Orientation#']
     * to report Orientation only, or ['-FileSize'] to exclude FileSize
     * @returns {Promise.<{data: object[]|null, error: string|null}>} a promise
     * resolved with parsed stdout and stderr.
     */
    readMetadata(file, args) {
        if (lib.isReadable(file)) {
            return executeWithRs(file, args, this._executeCommand.bind(this))
        }
        return this._executeCommand(file, args)
    }

    /**
     * Write metadata to a file or directory.
     * @param {string} file path to the file or directory
     * @param {object} data data to write, with keys as tags
     * @param {string[]} args additional arguments, e.g., ['overwrite_original']
     * @param {boolean} debug whether to print to stdout
     * @returns {Promise.<{{data, error}}>} A promise to write metadata,
     * resolved with data from stdout and stderr.
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
