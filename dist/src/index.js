'use strict';

require('source-map-support/register');

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var EventEmitter = require('events');
var lib = require('./lib');
var beginReady = require('./begin-ready');
var executeWithRs = require('./execute-with-rs');

var EXIFTOOL_PATH = 'exiftool';

var events = {
    OPEN: 'exiftool_opened',
    EXIT: 'exiftool_exit'
};

class ExiftoolProcess extends EventEmitter {
    /**
     * Create an instance of ExiftoolProcess class.
     * @param {string} [bin="exiftool"] path to executable
     */
    constructor(bin) {
        super();
        this._bin = lib.isString(bin) ? bin : EXIFTOOL_PATH;
        this._process = undefined;
        this._open = false;
    }

    /**
     * Close the exiftool process by passing -stay_open false.
     * @returns {Promise} a promise to stop the process.
     */
    close() {
        if (!this._open) {
            return Promise.reject(new Error('Exiftool process is not open'));
        }
        return lib.close(this._process);
    }

    _assignEncoding(encoding) {
        var _encoding = void 0;
        if (encoding === null) {
            _encoding = undefined;
        } else if (lib.isString(encoding)) {
            _encoding = encoding;
        } else {
            _encoding = 'utf8';
        }
        this._encoding = _encoding;
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
        var _this = this;

        return _asyncToGenerator(function* () {
            var _encoding = encoding;
            var _options = options;
            // if encoding is not a string and options are not given, treat it as options
            if (options === undefined && typeof encoding !== 'string') {
                _encoding = undefined;
                _options = encoding;
            }
            _this._assignEncoding(_encoding);
            if (_this._open) {
                throw new Error('Exiftool process is already open');
            }
            var exiftoolProcess = yield lib.spawn(_this._bin, _options);
            //console.log(`Started exiftool process %s`, process.pid);
            _this.emit(events.OPEN, exiftoolProcess.pid);
            _this._process = exiftoolProcess;

            _this._process.on('exit', _this._exitListener.bind(_this));
            if (!lib.isReadable(_this._process.stdout)) {
                lib.killProcess(_this._process);
                throw new Error('Process was not spawned with a readable stdout, check stdio options.');
            }
            if (!lib.isWritable(_this._process.stdin)) {
                lib.killProcess(_this._process);
                throw new Error('Process was not spawned with a writable stdin, check stdio options.');
            }

            // if process was spawned, stderr is readable (see lib/spawn)

            _this._process.stdout.setEncoding(_this._encoding);
            _this._process.stderr.setEncoding(_this._encoding);

            // resolve-write streams
            _this._stdoutResolveWs = beginReady.setupResolveWriteStreamPipe(_this._process.stdout);
            _this._stderrResolveWs = beginReady.setupResolveWriteStreamPipe(_this._process.stderr);

            // handle errors so that Node does not crash
            _this._stdoutResolveWs.on('error', console.error); // eslint-disable-line no-console
            _this._stderrResolveWs.on('error', console.error); // eslint-disable-line no-console

            // debug
            // exiftoolProcess.stdout.pipe(process.stdout)
            // exiftoolProcess.stderr.pipe(process.stderr)

            _this._open = true;

            return exiftoolProcess.pid;
        })();
    }

    _exitListener() {
        // console.log('exiftool process exit')
        this.emit(events.EXIT);
        this._open = false; // try to re-spawn?
    }

    /**
     * Checks if process is opens.
     * @returns {boolean} true if open and false otherwise.
     */
    get isOpen() {
        return this._open;
    }

    _executeCommand(command, args, argsNoSplit, debug) {
        var _this2 = this;

        return _asyncToGenerator(function* () {
            //test this!
            if (!_this2._open) {
                throw new Error('exiftool is not open');
            }
            if (_this2._process.signalCode === 'SIGTERM') {
                throw new Error('Could not connect to the exiftool process');
            }

            var proc = debug === true ? process : _this2._process;
            return lib.executeCommand(proc, _this2._stdoutResolveWs, _this2._stderrResolveWs, command, args, argsNoSplit, _this2._encoding);
        })();
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
            return executeWithRs(file, args, this._executeCommand.bind(this));
        }
        return this._executeCommand(file, args);
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
        var _this3 = this;

        return _asyncToGenerator(function* () {
            if (!lib.isString(file)) {
                throw new Error('File must be a string');
            }
            if (!lib.checkDataObject(data)) {
                throw new Error('Data argument is not an object');
            }

            var writeArgs = lib.mapDataToTagArray(data);
            return _this3._executeCommand(file, args, writeArgs, debug);
        })();
    }
}

module.exports = {
    ExiftoolProcess: ExiftoolProcess,
    EXIFTOOL_PATH: EXIFTOOL_PATH,
    events: events
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9pbmRleC5qcyJdLCJuYW1lcyI6WyJFdmVudEVtaXR0ZXIiLCJyZXF1aXJlIiwibGliIiwiYmVnaW5SZWFkeSIsImV4ZWN1dGVXaXRoUnMiLCJFWElGVE9PTF9QQVRIIiwiZXZlbnRzIiwiT1BFTiIsIkVYSVQiLCJFeGlmdG9vbFByb2Nlc3MiLCJjb25zdHJ1Y3RvciIsImJpbiIsIl9iaW4iLCJpc1N0cmluZyIsIl9wcm9jZXNzIiwidW5kZWZpbmVkIiwiX29wZW4iLCJjbG9zZSIsIlByb21pc2UiLCJyZWplY3QiLCJFcnJvciIsIl9hc3NpZ25FbmNvZGluZyIsImVuY29kaW5nIiwiX2VuY29kaW5nIiwib3BlbiIsIm9wdGlvbnMiLCJfb3B0aW9ucyIsImV4aWZ0b29sUHJvY2VzcyIsInNwYXduIiwiZW1pdCIsInBpZCIsIm9uIiwiX2V4aXRMaXN0ZW5lciIsImJpbmQiLCJpc1JlYWRhYmxlIiwic3Rkb3V0Iiwia2lsbFByb2Nlc3MiLCJpc1dyaXRhYmxlIiwic3RkaW4iLCJzZXRFbmNvZGluZyIsInN0ZGVyciIsIl9zdGRvdXRSZXNvbHZlV3MiLCJzZXR1cFJlc29sdmVXcml0ZVN0cmVhbVBpcGUiLCJfc3RkZXJyUmVzb2x2ZVdzIiwiY29uc29sZSIsImVycm9yIiwiaXNPcGVuIiwiX2V4ZWN1dGVDb21tYW5kIiwiY29tbWFuZCIsImFyZ3MiLCJhcmdzTm9TcGxpdCIsImRlYnVnIiwic2lnbmFsQ29kZSIsInByb2MiLCJwcm9jZXNzIiwiZXhlY3V0ZUNvbW1hbmQiLCJyZWFkTWV0YWRhdGEiLCJmaWxlIiwid3JpdGVNZXRhZGF0YSIsImRhdGEiLCJjaGVja0RhdGFPYmplY3QiLCJ3cml0ZUFyZ3MiLCJtYXBEYXRhVG9UYWdBcnJheSIsIm1vZHVsZSIsImV4cG9ydHMiXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBLElBQU1BLGVBQWVDLFFBQVEsUUFBUixDQUFyQjtBQUNBLElBQU1DLE1BQU1ELFFBQVEsT0FBUixDQUFaO0FBQ0EsSUFBTUUs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PSByZXF1aXJlKCdldmVudHMnKVxuY29uc3QgbGliID0gcmVxdWlyZSgnLi9saWInKVxuY29uc3QgYmVnaW5SZWFkeSA9IHJlcXVpcmUoJy4vYmVnaW4tcmVhZHknKVxuY29uc3QgZXhlY3V0ZVdpdGhScyA9IHJlcXVpcmUoJy4vZXhlY3V0ZS13aXRoLXJzJylcblxuY29uc3QgRVhJRlRPT0xfUEFUSCA9ICdleGlmdG9vbCdcblxuY29uc3QgZXZlbnRzID0ge1xuICAgIE9QRU46ICdleGlmdG9vbF9vcGVuZWQnLFxuICAgIEVYSVQ6ICdleGlmdG9vbF9leGl0Jyxcbn1cblxuY2xhc3MgRXhpZnRvb2xQcm9jZXNzIGV4dGVuZHMgRXZlbnRFbWl0dGVyIHtcbiAgICAvKipcbiAgICAgKiBDcmVhdGUgYW4gaW5zdGFuY2Ugb2YgRXhpZnRvb2xQcm9jZXNzIGNsYXNzLlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBbYmluPVwiZXhpZnRvb2xcIl0gcGF0aCB0byBleGVjdXRhYmxlXG4gICAgICovXG4gICAgY29uc3RydWN0b3IoYmluKSB7XG4gICAgICAgIHN1cGVyKClcbiAgICAgICAgdGhpcy5fYmluID0gbGliLmlzU3RyaW5nKGJpbikgPyBiaW4gOiBFWElGVE9PTF9QQVRIXG4gICAgICAgIHRoaXMuX3Byb2Nlc3MgPSB1bmRlZmluZWRcbiAgICAgICAgdGhpcy5fb3BlbiA9IGZhbHNlXG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ2xvc2UgdGhlIGV4aWZ0b29sIHByb2Nlc3MgYnkgcGFzc2luZyAtc3RheV9vcGVuIGZhbHNlLlxuICAgICAqIEByZXR1cm5zIHtQcm9taXNlfSBhIHByb21pc2UgdG8gc3RvcCB0aGUgcHJvY2Vzcy5cbiAgICAgKi9cbiAgICBjbG9zZSgpIHtcbiAgICAgICAgaWYgKCF0aGlzLl9vcGVuKSB7XG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IEVycm9yKCdFeGlmdG9vbCBwcm9jZXNzIGlzIG5vdCBvcGVuJykpXG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGxpYi5jbG9zZSh0aGlzLl9wcm9jZXNzKVxuICAgIH1cblxuICAgIF9hc3NpZ25FbmNvZGluZyhlbmNvZGluZykge1xuICAgICAgICBsZXQgX2VuY29kaW5nXG4gICAgICAgIGlmIChlbmNvZGluZyA9PT0gbnVsbCkge1xuICAgICAgICAgICAgX2VuY29kaW5nID0gdW5kZWZpbmVkXG4gICAgICAgIH0gZWxzZSBpZiAobGliLmlzU3RyaW5nKGVuY29kaW5nKSkge1xuICAgICAgICAgICAgX2VuY29kaW5nID0gZW5jb2RpbmdcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIF9lbmNvZGluZyA9ICd1dGY4J1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX2VuY29kaW5nID0gX2VuY29kaW5nXG4gICAgfVxuICAgIC8qKlxuICAgICAqIFNwYXduIGV4aWZ0b29sIHByb2Nlc3Mgd2l0aCAtc3RheV9vcGVuIFRydWUgLUAgLSBhcmd1bWVudHMuXG4gICAgICogT3B0aW9ucyBjYW4gYmUgcGFzc2VkIGFzIHRoZSBmaXJzdCBhcmd1bWVudCBpbnN0ZWFkIG9mIGVuY29kaW5nLlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBbZW5jb2Rpbmc9XCJ1dGY4XCJdIEVuY29kaW5nIHdpdGggd2hpY2ggdG8gcmVhZCBmcm9tIGFuZFxuICAgICAqIHdyaXRlIHRvIHN0cmVhbXMuIHBhc3MgbnVsbCB0byBub3QgdXNlIGVuY29kaW5nLCB1dGY4IG90aGVyd2lzZVxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBbb3B0aW9uc10gb3B0aW9ucyB0byBwYXNzIHRvIHRoZSBzcGF3biBtZXRob2RcbiAgICAgKiBAcmV0dXJucyB7UHJvbWlzZS48bnVtYmVyPn0gQSBwcm9taXNlIHRvIHNwYXduIGV4aWZ0b29sIGluIHN0YXlfb3BlblxuICAgICAqIG1vZGUsIHJlc29sdmVkIHdpdGggcGlkLlxuICAgICAqL1xuICAgIGFzeW5jIG9wZW4oZW5jb2RpbmcsIG9wdGlvbnMpIHtcbiAgICAgICAgbGV0IF9lbmNvZGluZyA9IGVuY29kaW5nXG4gICAgICAgIGxldCBfb3B0aW9ucyA9IG9wdGlvbnNcbiAgICAgICAgLy8gaWYgZW5jb2RpbmcgaXMgbm90IGEgc3RyaW5nIGFuZCBvcHRpb25zIGFyZSBub3QgZ2l2ZW4sIHRyZWF0IGl0IGFzIG9wdGlvbnNcbiAgICAgICAgaWYgKG9wdGlvbnMgPT09IHVuZGVmaW5lZCAmJiB0eXBlb2YgZW5jb2RpbmcgIT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICBfZW5jb2RpbmcgPSB1bmRlZmluZWRcbiAgICAgICAgICAgIF9vcHRpb25zID0gZW5jb2RpbmdcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9hc3NpZ25FbmNvZGluZyhfZW5jb2RpbmcpXG4gICAgICAgIGlmICh0aGlzLl9vcGVuKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0V4aWZ0b29sIHByb2Nlc3MgaXMgYWxyZWFkeSBvcGVuJylcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBleGlmdG9vbFByb2Nlc3MgPSBhd2FpdCBsaWIuc3Bhd24odGhpcy5fYmluLCBfb3B0aW9ucylcbiAgICAgICAgLy9jb25zb2xlLmxvZyhgU3RhcnRlZCBleGlmdG9vbCBwcm9jZXNzICVzYCwgcHJvY2Vzcy5waWQpO1xuICAgICAgICB0aGlzLmVtaXQoZXZlbnRzLk9QRU4sIGV4aWZ0b29sUHJvY2Vzcy5waWQpXG4gICAgICAgIHRoaXMuX3Byb2Nlc3MgPSBleGlmdG9vbFByb2Nlc3NcblxuICAgICAgICB0aGlzLl9wcm9jZXNzLm9uKCdleGl0JywgdGhpcy5fZXhpdExpc3RlbmVyLmJpbmQodGhpcykpXG4gICAgICAgIGlmICghbGliLmlzUmVhZGFibGUodGhpcy5fcHJvY2Vzcy5zdGRvdXQpKSB7XG4gICAgICAgICAgICBsaWIua2lsbFByb2Nlc3ModGhpcy5fcHJvY2VzcylcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignUHJvY2VzcyB3YXMgbm90IHNwYXduZWQgd2l0aCBhIHJlYWRhYmxlIHN0ZG91dCwgY2hlY2sgc3RkaW8gb3B0aW9ucy4nKVxuICAgICAgICB9XG4gICAgICAgIGlmICghbGliLmlzV3JpdGFibGUodGhpcy5fcHJvY2Vzcy5zdGRpbikpIHtcbiAgICAgICAgICAgIGxpYi5raWxsUHJvY2Vzcyh0aGlzLl9wcm9jZXNzKVxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdQcm9jZXNzIHdhcyBub3Qgc3Bhd25lZCB3aXRoIGEgd3JpdGFibGUgc3RkaW4sIGNoZWNrIHN0ZGlvIG9wdGlvbnMuJylcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGlmIHByb2Nlc3Mgd2FzIHNwYXduZWQsIHN0ZGVyciBpcyByZWFkYWJsZSAoc2VlIGxpYi9zcGF3bilcblxuICAgICAgICB0aGlzLl9wcm9jZXNzLnN0ZG91dC5zZXRFbmNvZGluZyh0aGlzLl9lbmNvZGluZylcbiAgICAgICAgdGhpcy5fcHJvY2Vzcy5zdGRlcnIuc2V0RW5jb2RpbmcodGhpcy5fZW5jb2RpbmcpXG5cbiAgICAgICAgLy8gcmVzb2x2ZS13cml0ZSBzdHJlYW1zXG4gICAgICAgIHRoaXMuX3N0ZG91dFJlc29sdmVXcyA9IGJlZ2luUmVhZHkuc2V0dXBSZXNvbHZlV3JpdGVTdHJlYW1QaXBlKHRoaXMuX3Byb2Nlc3Muc3Rkb3V0KVxuICAgICAgICB0aGlzLl9zdGRlcnJSZXNvbHZlV3MgPSBiZWdpblJlYWR5LnNldHVwUmVzb2x2ZVdyaXRlU3RyZWFtUGlwZSh0aGlzLl9wcm9jZXNzLnN0ZGVycilcblxuICAgICAgICAvLyBoYW5kbGUgZXJyb3JzIHNvIHRoYXQgTm9kZSBkb2VzIG5vdCBjcmFzaFxuICAgICAgICB0aGlzLl9zdGRvdXRSZXNvbHZlV3Mub24oJ2Vycm9yJywgY29uc29sZS5lcnJvcikgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1jb25zb2xlXG4gICAgICAgIHRoaXMuX3N0ZGVyclJlc29sdmVXcy5vbignZXJyb3InLCBjb25zb2xlLmVycm9yKSAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLWNvbnNvbGVcblxuICAgICAgICAvLyBkZWJ1Z1xuICAgICAgICAvLyBleGlmdG9vbFByb2Nlc3Muc3Rkb3V0LnBpcGUocHJvY2Vzcy5zdGRvdXQpXG4gICAgICAgIC8vIGV4aWZ0b29sUHJvY2Vzcy5zdGRlcnIucGlwZShwcm9jZXNzLnN0ZGVycilcblxuICAgICAgICB0aGlzLl9vcGVuID0gdHJ1ZVxuXG4gICAgICAgIHJldHVybiBleGlmdG9vbFByb2Nlc3MucGlkXG4gICAgfVxuXG4gICAgX2V4aXRMaXN0ZW5lcigpIHtcbiAgICAgICAgLy8gY29uc29sZS5sb2coJ2V4aWZ0b29sIHByb2Nlc3MgZXhpdCcpXG4gICAgICAgIHRoaXMuZW1pdChldmVudHMuRVhJVClcbiAgICAgICAgdGhpcy5fb3BlbiA9IGZhbHNlIC8vIHRyeSB0byByZS1zcGF3bj9cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDaGVja3MgaWYgcHJvY2VzcyBpcyBvcGVucy5cbiAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn0gdHJ1ZSBpZiBvcGVuIGFuZCBmYWxzZSBvdGhlcndpc2UuXG4gICAgICovXG4gICAgZ2V0IGlzT3BlbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX29wZW5cbiAgICB9XG5cbiAgICBhc3luYyBfZXhlY3V0ZUNvbW1hbmQoY29tbWFuZCwgYXJncywgYXJnc05vU3BsaXQsIGRlYnVnKSB7XG4gICAgICAgIC8vdGVzdCB0aGlzIVxuICAgICAgICBpZiAoIXRoaXMuX29wZW4pIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignZXhpZnRvb2wgaXMgbm90IG9wZW4nKVxuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLl9wcm9jZXNzLnNpZ25hbENvZGUgPT09ICdTSUdURVJNJykge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdDb3VsZCBub3QgY29ubmVjdCB0byB0aGUgZXhpZnRvb2wgcHJvY2VzcycpXG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBwcm9jID0gZGVidWcgPT09IHRydWUgPyBwcm9jZXNzIDogdGhpcy5fcHJvY2Vzc1xuICAgICAgICByZXR1cm4gbGliLmV4ZWN1dGVDb21tYW5kKHByb2MsIHRoaXMuX3N0ZG91dFJlc29sdmVXcyxcbiAgICAgICAgICAgIHRoaXMuX3N0ZGVyclJlc29sdmVXcywgY29tbWFuZCwgYXJncywgYXJnc05vU3BsaXQsIHRoaXMuX2VuY29kaW5nKVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJlYWQgbWV0YWRhdGEgb2YgYSBmaWxlIG9yIGRpcmVjdG9yeS5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ3xSZWFkYWJsZX0gZmlsZSBwYXRoIHRvIHRoZSBmaWxlIG9yIGRpcmVjdG9yeSwgb3IgYVxuICAgICAqIHJlYWRhYmxlIHN0cmVhbVxuICAgICAqIEBwYXJhbSB7c3RyaW5nW119IGFyZ3MgYW55IGFkZGl0aW9uYWwgYXJndW1lbnRzLCBlLmcuLCBbJ09yaWVudGF0aW9uIyddXG4gICAgICogdG8gcmVwb3J0IE9yaWVudGF0aW9uIG9ubHksIG9yIFsnLUZpbGVTaXplJ10gdG8gZXhjbHVkZSBGaWxlU2l6ZVxuICAgICAqIEByZXR1cm5zIHtQcm9taXNlLjx7ZGF0YTogb2JqZWN0W118bnVsbCwgZXJyb3I6IHN0cmluZ3xudWxsfT59IGEgcHJvbWlzZVxuICAgICAqIHJlc29sdmVkIHdpdGggcGFyc2VkIHN0ZG91dCBhbmQgc3RkZXJyLlxuICAgICAqL1xuICAgIHJlYWRNZXRhZGF0YShmaWxlLCBhcmdzKSB7XG4gICAgICAgIGlmIChsaWIuaXNSZWFkYWJsZShmaWxlKSkge1xuICAgICAgICAgICAgcmV0dXJuIGV4ZWN1dGVXaXRoUnMoZmlsZSwgYXJncywgdGhpcy5fZXhlY3V0ZUNvbW1hbmQuYmluZCh0aGlzKSlcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcy5fZXhlY3V0ZUNvbW1hbmQoZmlsZSwgYXJncylcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBXcml0ZSBtZXRhZGF0YSB0byBhIGZpbGUgb3IgZGlyZWN0b3J5LlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBmaWxlIHBhdGggdG8gdGhlIGZpbGUgb3IgZGlyZWN0b3J5XG4gICAgICogQHBhcmFtIHtvYmplY3R9IGRhdGEgZGF0YSB0byB3cml0ZSwgd2l0aCBrZXlzIGFzIHRhZ3NcbiAgICAgKiBAcGFyYW0ge3N0cmluZ1tdfSBhcmdzIGFkZGl0aW9uYWwgYXJndW1lbnRzLCBlLmcuLCBbJ292ZXJ3cml0ZV9vcmlnaW5hbCddXG4gICAgICogQHBhcmFtIHtib29sZWFufSBkZWJ1ZyB3aGV0aGVyIHRvIHByaW50IHRvIHN0ZG91dFxuICAgICAqIEByZXR1cm5zIHtQcm9taXNlLjx7e2RhdGEsIGVycm9yfX0+fSBBIHByb21pc2UgdG8gd3JpdGUgbWV0YWRhdGEsXG4gICAgICogcmVzb2x2ZWQgd2l0aCBkYXRhIGZyb20gc3Rkb3V0IGFuZCBzdGRlcnIuXG4gICAgICovXG4gICAgYXN5bmMgd3JpdGVNZXRhZGF0YShmaWxlLCBkYXRhLCBhcmdzLCBkZWJ1Zykge1xuICAgICAgICBpZiAoIWxpYi5pc1N0cmluZyhmaWxlKSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdGaWxlIG11c3QgYmUgYSBzdHJpbmcnKVxuICAgICAgICB9XG4gICAgICAgIGlmICghbGliLmNoZWNrRGF0YU9iamVjdChkYXRhKSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdEYXRhIGFyZ3VtZW50IGlzIG5vdCBhbiBvYmplY3QnKVxuICAgICAgICB9XG5cbiAgICAgICAgY29uc3Qgd3JpdGVBcmdzID0gbGliLm1hcERhdGFUb1RhZ0FycmF5KGRhdGEpXG4gICAgICAgIHJldHVybiB0aGlzLl9leGVjdXRlQ29tbWFuZChmaWxlLCBhcmdzLCB3cml0ZUFyZ3MsIGRlYnVnKVxuICAgIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgRXhpZnRvb2xQcm9jZXNzLFxuICAgIEVYSUZUT09MX1BBVEgsXG4gICAgZXZlbnRzLFxufVxuIl19