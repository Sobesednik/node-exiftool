'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

require('source-map-support/register');

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var EventEmitter = require('events');
var lib = require('./lib');
var beginReady = require('./begin-ready');
var executeWithRs = require('./execute-with-rs');

var EXIFTOOL_PATH = 'exiftool';

var events = {
    OPEN: 'exiftool_opened',
    EXIT: 'exiftool_exit'
};

var ExiftoolProcess = function (_EventEmitter) {
    _inherits(ExiftoolProcess, _EventEmitter);

    /**
     * Create an instance of ExiftoolProcess class.
     * @param {string} [bin="exiftool"] path to executable
     */
    function ExiftoolProcess(bin) {
        _classCallCheck(this, ExiftoolProcess);

        var _this = _possibleConstructorReturn(this, (ExiftoolProcess.__proto__ || Object.getPrototypeOf(ExiftoolProcess)).call(this));

        _this._bin = lib.isString(bin) ? bin : EXIFTOOL_PATH;
        _this._process = undefined;
        _this._open = false;
        return _this;
    }

    /**
     * Close the exiftool process by passing -stay_open false.
     * @returns {Promise} a promise to stop the process.
     */


    _createClass(ExiftoolProcess, [{
        key: 'close',
        value: function close() {
            if (!this._open) {
                return Promise.reject(new Error('Exiftool process is not open'));
            }
            return lib.close(this._process);
        }
    }, {
        key: '_assignEncoding',
        value: function _assignEncoding(encoding) {
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

    }, {
        key: 'open',
        value: function () {
            var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(encoding, options) {
                var _encoding, _options, exiftoolProcess;

                return regeneratorRuntime.wrap(function _callee$(_context) {
                    while (1) {
                        switch (_context.prev = _context.next) {
                            case 0:
                                _encoding = encoding;
                                _options = options;
                                // if encoding is not a string and options are not given, treat it as options

                                if (options === undefined && typeof encoding !== 'string') {
                                    _encoding = undefined;
                                    _options = encoding;
                                }
                                this._assignEncoding(_encoding);

                                if (!this._open) {
                                    _context.next = 6;
                                    break;
                                }

                                throw new Error('Exiftool process is already open');

                            case 6:
                                _context.next = 8;
                                return lib.spawn(this._bin, _options);

                            case 8:
                                exiftoolProcess = _context.sent;

                                //console.log(`Started exiftool process %s`, process.pid);
                                this.emit(events.OPEN, exiftoolProcess.pid);
                                this._process = exiftoolProcess;

                                this._process.on('exit', this._exitListener.bind(this));

                                if (lib.isReadable(this._process.stdout)) {
                                    _context.next = 15;
                                    break;
                                }

                                lib.killProcess(this._process);
                                throw new Error('Process was not spawned with a readable stdout, check stdio options.');

                            case 15:
                                if (lib.isWritable(this._process.stdin)) {
                                    _context.next = 18;
                                    break;
                                }

                                lib.killProcess(this._process);
                                throw new Error('Process was not spawned with a writable stdin, check stdio options.');

                            case 18:

                                // if process was spawned, stderr is readable (see lib/spawn)

                                this._process.stdout.setEncoding(this._encoding);
                                this._process.stderr.setEncoding(this._encoding);

                                // resolve-write streams
                                this._stdoutResolveWs = beginReady.setupResolveWriteStreamPipe(this._process.stdout);
                                this._stderrResolveWs = beginReady.setupResolveWriteStreamPipe(this._process.stderr);

                                // handle errors so that Node does not crash
                                this._stdoutResolveWs.on('error', console.error); // eslint-disable-line no-console
                                this._stderrResolveWs.on('error', console.error); // eslint-disable-line no-console

                                // debug
                                // exiftoolProcess.stdout.pipe(process.stdout)
                                // exiftoolProcess.stderr.pipe(process.stderr)

                                this._open = true;

                                return _context.abrupt('return', exiftoolProcess.pid);

                            case 26:
                            case 'end':
                                return _context.stop();
                        }
                    }
                }, _callee, this);
            }));

            function open(_x, _x2) {
                return _ref.apply(this, arguments);
            }

            return open;
        }()
    }, {
        key: '_exitListener',
        value: function _exitListener() {
            // console.log('exiftool process exit')
            this.emit(events.EXIT);
            this._open = false; // try to re-spawn?
        }

        /**
         * Checks if process is opens.
         * @returns {boolean} true if open and false otherwise.
         */

    }, {
        key: '_executeCommand',
        value: function () {
            var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(command, args, argsNoSplit, debug) {
                var proc;
                return regeneratorRuntime.wrap(function _callee2$(_context2) {
                    while (1) {
                        switch (_context2.prev = _context2.next) {
                            case 0:
                                if (this._open) {
                                    _context2.next = 2;
                                    break;
                                }

                                throw new Error('exiftool is not open');

                            case 2:
                                if (!(this._process.signalCode === 'SIGTERM')) {
                                    _context2.next = 4;
                                    break;
                                }

                                throw new Error('Could not connect to the exiftool process');

                            case 4:
                                proc = debug === true ? process : this._process;
                                return _context2.abrupt('return', lib.executeCommand(proc, this._stdoutResolveWs, this._stderrResolveWs, command, args, argsNoSplit, this._encoding));

                            case 6:
                            case 'end':
                                return _context2.stop();
                        }
                    }
                }, _callee2, this);
            }));

            function _executeCommand(_x3, _x4, _x5, _x6) {
                return _ref2.apply(this, arguments);
            }

            return _executeCommand;
        }()

        /**
         * Read metadata of a file or directory.
         * @param {string|Readable} file path to the file or directory, or a
         * readable stream
         * @param {string[]} args any additional arguments, e.g., ['Orientation#']
         * to report Orientation only, or ['-FileSize'] to exclude FileSize
         * @returns {Promise.<{data: object[]|null, error: string|null}>} a promise
         * resolved with parsed stdout and stderr.
         */

    }, {
        key: 'readMetadata',
        value: function readMetadata(file, args) {
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

    }, {
        key: 'writeMetadata',
        value: function () {
            var _ref3 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3(file, data, args, debug) {
                var writeArgs;
                return regeneratorRuntime.wrap(function _callee3$(_context3) {
                    while (1) {
                        switch (_context3.prev = _context3.next) {
                            case 0:
                                if (lib.isString(file)) {
                                    _context3.next = 2;
                                    break;
                                }

                                throw new Error('File must be a string');

                            case 2:
                                if (lib.checkDataObject(data)) {
                                    _context3.next = 4;
                                    break;
                                }

                                throw new Error('Data argument is not an object');

                            case 4:
                                writeArgs = lib.mapDataToTagArray(data);
                                return _context3.abrupt('return', this._executeCommand(file, args, writeArgs, debug));

                            case 6:
                            case 'end':
                                return _context3.stop();
                        }
                    }
                }, _callee3, this);
            }));

            function writeMetadata(_x7, _x8, _x9, _x10) {
                return _ref3.apply(this, arguments);
            }

            return writeMetadata;
        }()
    }, {
        key: 'isOpen',
        get: function get() {
            return this._open;
        }
    }]);

    return ExiftoolProcess;
}(EventEmitter);

module.exports = {
    ExiftoolProcess: ExiftoolProcess,
    EXIFTOOL_PATH: EXIFTOOL_PATH,
    events: events
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9pbmRleC5qcyJdLCJuYW1lcyI6WyJFdmVudEVtaXR0ZXIiLCJyZXF1aXJlIiwibGliIiwiYmVnaW5SZWFkeSIsImV4ZWN1dGVXaXRoUnMiLCJFWElGVE9PTF9QQVRIIiwiZXZlbnRzIiwiT1BFTiIsIkVYSVQiLCJFeGlmdG9vbFByb2Nlc3MiLCJiaW4iLCJfYmluIiwiaXNTdHJpbmciLCJfcHJvY2VzcyIsInVuZGVmaW5lZCIsIl9vcGVuIiwiUHJvbWlzZSIsInJlamVjdCIsIkVycm9yIiwiY2xvc2UiLCJlbmNvZGluZyIsIl9lbmNvZGluZyIsIm9wdGlvbnMiLCJfb3B0aW9ucyIsIl9hc3NpZ25FbmNvZGluZyIsInNwYXduIiwiZXhpZnRvb2xQcm9jZXNzIiwiZW1pdCIsInBpZCIsIm9uIiwiX2V4aXRMaXN0ZW5lciIsImJpbmQiLCJpc1JlYWRhYmxlIiwic3Rkb3V0Iiwia2lsbFByb2Nlc3MiLCJpc1dyaXRhYmxlIiwic3RkaW4iLCJzZXRFbmNvZGluZyIsInN0ZGVyciIsIl9zdGRvdXRSZXNvbHZlV3MiLCJzZXR1cFJlc29sdmVXcml0ZVN0cmVhbVBpcGUiLCJfc3RkZXJyUmVzb2x2ZVdzIiwiY29uc29sZSIsImVycm9yIiwiY29tbWFuZCIsImFyZ3MiLCJhcmdzTm9TcGxpdCIsImRlYnVnIiwic2lnbmFsQ29kZSIsInByb2MiLCJwcm9jZXNzIiwiZXhlY3V0ZUNvbW1hbmQiLCJmaWxlIiwiX2V4ZWN1dGVDb21tYW5kIiwiZGF0YSIsImNoZWNrRGF0YU9iamVjdCIsIndyaXRlQXJncyIsIm1hcERhdGFUb1RhZ0FycmF5IiwibW9kdWxlIiwiZXhwb3J0cyJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7QUFBQSxJQUFNQSxlQUFlQyxRQUFRLFFBQVIsQ0FBckI7QUFDQSxJQUFNQyxNQUFNRCxRQUFRLE9BQVIsQ0FBWjtBQUNBLElBQU1FLGFBQWFGLFFBQVEsZUFBUixDQUFuQjtBQUNBLElBQU1HLGdCQUFnQkgsUUFBUSxtQkFBUixD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SSxFQUFNVCxJLEVBQU1FLEs7Ozs7OztvQ0FDN0I3QyxJQUFJVSxRQUFKLENBQWF3QyxJQUFiLEM7Ozs7O3NDQUNLLElBQUlsQyxLQUFKLENBQVUsdUJBQVYsQzs7O29DQUVMaEIsSUFBSXFELGVBQUosQ0FBb0JELElBQXBCLEM7Ozs7O3NDQUNLLElBQUlwQyxLQUFKLENBQVUsZ0NBQVYsQzs7O0FBR0pzQyx5QyxHQUFZdEQsSUFBSXVELGlCQUFKLENBQXNCSCxJQUF0QixDO2tFQUNYLEtBQUtELGVBQUwsQ0FBcUJELElBQXJCLEVBQTJCUCxJQUEzQixFQUFpQ1csU0FBakMsRUFBNENULEtBQTVDLEM7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs0QkFwREU7QUFDVCxtQkFBTyxLQUFLaEMsS0FBWjtBQUNIOzs7O0VBeEd5QmYsWTs7QUE4SjlCMEQsT0FBT0MsT0FBUCxHQUFpQjtBQUNibEQsb0NBRGE7QUFFYkosZ0NBRmE7QUFHYkM7QUFIYSxDQUFqQiIsImZpbGUiOiJpbmRleC5qcyIsInNvdXJjZXNDb250ZW50IjpbImNvbnN0IEV2ZW50RW1pdHRlciA9IHJlcXVpcmUoJ2V2ZW50cycpXG5jb25zdCBsaWIgPSByZXF1aXJlKCcuL2xpYicpXG5jb25zdCBiZWdpblJlYWR5ID0gcmVxdWlyZSgnLi9iZWdpbi1yZWFkeScpXG5jb25zdCBleGVjdXRlV2l0aFJzID0gcmVxdWlyZSgnLi9leGVjdXRlLXdpdGgtcnMnKVxuXG5jb25zdCBFWElGVE9PTF9QQVRIID0gJ2V4aWZ0b29sJ1xuXG5jb25zdCBldmVudHMgPSB7XG4gICAgT1BFTjogJ2V4aWZ0b29sX29wZW5lZCcsXG4gICAgRVhJVDogJ2V4aWZ0b29sX2V4aXQnLFxufVxuXG5jbGFzcyBFeGlmdG9vbFByb2Nlc3MgZXh0ZW5kcyBFdmVudEVtaXR0ZXIge1xuICAgIC8qKlxuICAgICAqIENyZWF0ZSBhbiBpbnN0YW5jZSBvZiBFeGlmdG9vbFByb2Nlc3MgY2xhc3MuXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IFtiaW49XCJleGlmdG9vbFwiXSBwYXRoIHRvIGV4ZWN1dGFibGVcbiAgICAgKi9cbiAgICBjb25zdHJ1Y3RvcihiaW4pIHtcbiAgICAgICAgc3VwZXIoKVxuICAgICAgICB0aGlzLl9iaW4gPSBsaWIuaXNTdHJpbmcoYmluKSA/IGJpbiA6IEVYSUZUT09MX1BBVEhcbiAgICAgICAgdGhpcy5fcHJvY2VzcyA9IHVuZGVmaW5lZFxuICAgICAgICB0aGlzLl9vcGVuID0gZmFsc2VcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDbG9zZSB0aGUgZXhpZnRvb2wgcHJvY2VzcyBieSBwYXNzaW5nIC1zdGF5X29wZW4gZmFsc2UuXG4gICAgICogQHJldHVybnMge1Byb21pc2V9IGEgcHJvbWlzZSB0byBzdG9wIHRoZSBwcm9jZXNzLlxuICAgICAqL1xuICAgIGNsb3NlKCkge1xuICAgICAgICBpZiAoIXRoaXMuX29wZW4pIHtcbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgRXJyb3IoJ0V4aWZ0b29sIHByb2Nlc3MgaXMgbm90IG9wZW4nKSlcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbGliLmNsb3NlKHRoaXMuX3Byb2Nlc3MpXG4gICAgfVxuXG4gICAgX2Fzc2lnbkVuY29kaW5nKGVuY29kaW5nKSB7XG4gICAgICAgIGxldCBfZW5jb2RpbmdcbiAgICAgICAgaWYgKGVuY29kaW5nID09PSBudWxsKSB7XG4gICAgICAgICAgICBfZW5jb2RpbmcgPSB1bmRlZmluZWRcbiAgICAgICAgfSBlbHNlIGlmIChsaWIuaXNTdHJpbmcoZW5jb2RpbmcpKSB7XG4gICAgICAgICAgICBfZW5jb2RpbmcgPSBlbmNvZGluZ1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgX2VuY29kaW5nID0gJ3V0ZjgnXG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fZW5jb2RpbmcgPSBfZW5jb2RpbmdcbiAgICB9XG4gICAgLyoqXG4gICAgICogU3Bhd24gZXhpZnRvb2wgcHJvY2VzcyB3aXRoIC1zdGF5X29wZW4gVHJ1ZSAtQCAtIGFyZ3VtZW50cy5cbiAgICAgKiBPcHRpb25zIGNhbiBiZSBwYXNzZWQgYXMgdGhlIGZpcnN0IGFyZ3VtZW50IGluc3RlYWQgb2YgZW5jb2RpbmcuXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IFtlbmNvZGluZz1cInV0ZjhcIl0gRW5jb2Rpbmcgd2l0aCB3aGljaCB0byByZWFkIGZyb20gYW5kXG4gICAgICogd3JpdGUgdG8gc3RyZWFtcy4gcGFzcyBudWxsIHRvIG5vdCB1c2UgZW5jb2RpbmcsIHV0Zjggb3RoZXJ3aXNlXG4gICAgICogQHBhcmFtIHtvYmplY3R9IFtvcHRpb25zXSBvcHRpb25zIHRvIHBhc3MgdG8gdGhlIHNwYXduIG1ldGhvZFxuICAgICAqIEByZXR1cm5zIHtQcm9taXNlLjxudW1iZXI+fSBBIHByb21pc2UgdG8gc3Bhd24gZXhpZnRvb2wgaW4gc3RheV9vcGVuXG4gICAgICogbW9kZSwgcmVzb2x2ZWQgd2l0aCBwaWQuXG4gICAgICovXG4gICAgYXN5bmMgb3BlbihlbmNvZGluZywgb3B0aW9ucykge1xuICAgICAgICBsZXQgX2VuY29kaW5nID0gZW5jb2RpbmdcbiAgICAgICAgbGV0IF9vcHRpb25zID0gb3B0aW9uc1xuICAgICAgICAvLyBpZiBlbmNvZGluZyBpcyBub3QgYSBzdHJpbmcgYW5kIG9wdGlvbnMgYXJlIG5vdCBnaXZlbiwgdHJlYXQgaXQgYXMgb3B0aW9uc1xuICAgICAgICBpZiAob3B0aW9ucyA9PT0gdW5kZWZpbmVkICYmIHR5cGVvZiBlbmNvZGluZyAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIF9lbmNvZGluZyA9IHVuZGVmaW5lZFxuICAgICAgICAgICAgX29wdGlvbnMgPSBlbmNvZGluZ1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX2Fzc2lnbkVuY29kaW5nKF9lbmNvZGluZylcbiAgICAgICAgaWYgKHRoaXMuX29wZW4pIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignRXhpZnRvb2wgcHJvY2VzcyBpcyBhbHJlYWR5IG9wZW4nKVxuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGV4aWZ0b29sUHJvY2VzcyA9IGF3YWl0IGxpYi5zcGF3bih0aGlzLl9iaW4sIF9vcHRpb25zKVxuICAgICAgICAvL2NvbnNvbGUubG9nKGBTdGFydGVkIGV4aWZ0b29sIHByb2Nlc3MgJXNgLCBwcm9jZXNzLnBpZCk7XG4gICAgICAgIHRoaXMuZW1pdChldmVudHMuT1BFTiwgZXhpZnRvb2xQcm9jZXNzLnBpZClcbiAgICAgICAgdGhpcy5fcHJvY2VzcyA9IGV4aWZ0b29sUHJvY2Vzc1xuXG4gICAgICAgIHRoaXMuX3Byb2Nlc3Mub24oJ2V4aXQnLCB0aGlzLl9leGl0TGlzdGVuZXIuYmluZCh0aGlzKSlcbiAgICAgICAgaWYgKCFsaWIuaXNSZWFkYWJsZSh0aGlzLl9wcm9jZXNzLnN0ZG91dCkpIHtcbiAgICAgICAgICAgIGxpYi5raWxsUHJvY2Vzcyh0aGlzLl9wcm9jZXNzKVxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdQcm9jZXNzIHdhcyBub3Qgc3Bhd25lZCB3aXRoIGEgcmVhZGFibGUgc3Rkb3V0LCBjaGVjayBzdGRpbyBvcHRpb25zLicpXG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFsaWIuaXNXcml0YWJsZSh0aGlzLl9wcm9jZXNzLnN0ZGluKSkge1xuICAgICAgICAgICAgbGliLmtpbGxQcm9jZXNzKHRoaXMuX3Byb2Nlc3MpXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1Byb2Nlc3Mgd2FzIG5vdCBzcGF3bmVkIHdpdGggYSB3cml0YWJsZSBzdGRpbiwgY2hlY2sgc3RkaW8gb3B0aW9ucy4nKVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gaWYgcHJvY2VzcyB3YXMgc3Bhd25lZCwgc3RkZXJyIGlzIHJlYWRhYmxlIChzZWUgbGliL3NwYXduKVxuXG4gICAgICAgIHRoaXMuX3Byb2Nlc3Muc3Rkb3V0LnNldEVuY29kaW5nKHRoaXMuX2VuY29kaW5nKVxuICAgICAgICB0aGlzLl9wcm9jZXNzLnN0ZGVyci5zZXRFbmNvZGluZyh0aGlzLl9lbmNvZGluZylcblxuICAgICAgICAvLyByZXNvbHZlLXdyaXRlIHN0cmVhbXNcbiAgICAgICAgdGhpcy5fc3Rkb3V0UmVzb2x2ZVdzID0gYmVnaW5SZWFkeS5zZXR1cFJlc29sdmVXcml0ZVN0cmVhbVBpcGUodGhpcy5fcHJvY2Vzcy5zdGRvdXQpXG4gICAgICAgIHRoaXMuX3N0ZGVyclJlc29sdmVXcyA9IGJlZ2luUmVhZHkuc2V0dXBSZXNvbHZlV3JpdGVTdHJlYW1QaXBlKHRoaXMuX3Byb2Nlc3Muc3RkZXJyKVxuXG4gICAgICAgIC8vIGhhbmRsZSBlcnJvcnMgc28gdGhhdCBOb2RlIGRvZXMgbm90IGNyYXNoXG4gICAgICAgIHRoaXMuX3N0ZG91dFJlc29sdmVXcy5vbignZXJyb3InLCBjb25zb2xlLmVycm9yKSAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLWNvbnNvbGVcbiAgICAgICAgdGhpcy5fc3RkZXJyUmVzb2x2ZVdzLm9uKCdlcnJvcicsIGNvbnNvbGUuZXJyb3IpIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tY29uc29sZVxuXG4gICAgICAgIC8vIGRlYnVnXG4gICAgICAgIC8vIGV4aWZ0b29sUHJvY2Vzcy5zdGRvdXQucGlwZShwcm9jZXNzLnN0ZG91dClcbiAgICAgICAgLy8gZXhpZnRvb2xQcm9jZXNzLnN0ZGVyci5waXBlKHByb2Nlc3Muc3RkZXJyKVxuXG4gICAgICAgIHRoaXMuX29wZW4gPSB0cnVlXG5cbiAgICAgICAgcmV0dXJuIGV4aWZ0b29sUHJvY2Vzcy5waWRcbiAgICB9XG5cbiAgICBfZXhpdExpc3RlbmVyKCkge1xuICAgICAgICAvLyBjb25zb2xlLmxvZygnZXhpZnRvb2wgcHJvY2VzcyBleGl0JylcbiAgICAgICAgdGhpcy5lbWl0KGV2ZW50cy5FWElUKVxuICAgICAgICB0aGlzLl9vcGVuID0gZmFsc2UgLy8gdHJ5IHRvIHJlLXNwYXduP1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENoZWNrcyBpZiBwcm9jZXNzIGlzIG9wZW5zLlxuICAgICAqIEByZXR1cm5zIHtib29sZWFufSB0cnVlIGlmIG9wZW4gYW5kIGZhbHNlIG90aGVyd2lzZS5cbiAgICAgKi9cbiAgICBnZXQgaXNPcGVuKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fb3BlblxuICAgIH1cblxuICAgIGFzeW5jIF9leGVjdXRlQ29tbWFuZChjb21tYW5kLCBhcmdzLCBhcmdzTm9TcGxpdCwgZGVidWcpIHtcbiAgICAgICAgLy90ZXN0IHRoaXMhXG4gICAgICAgIGlmICghdGhpcy5fb3Blbikge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdleGlmdG9vbCBpcyBub3Qgb3BlbicpXG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMuX3Byb2Nlc3Muc2lnbmFsQ29kZSA9PT0gJ1NJR1RFUk0nKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0NvdWxkIG5vdCBjb25uZWN0IHRvIHRoZSBleGlmdG9vbCBwcm9jZXNzJylcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHByb2MgPSBkZWJ1ZyA9PT0gdHJ1ZSA/IHByb2Nlc3MgOiB0aGlzLl9wcm9jZXNzXG4gICAgICAgIHJldHVybiBsaWIuZXhlY3V0ZUNvbW1hbmQocHJvYywgdGhpcy5fc3Rkb3V0UmVzb2x2ZVdzLFxuICAgICAgICAgICAgdGhpcy5fc3RkZXJyUmVzb2x2ZVdzLCBjb21tYW5kLCBhcmdzLCBhcmdzTm9TcGxpdCwgdGhpcy5fZW5jb2RpbmcpXG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmVhZCBtZXRhZGF0YSBvZiBhIGZpbGUgb3IgZGlyZWN0b3J5LlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfFJlYWRhYmxlfSBmaWxlIHBhdGggdG8gdGhlIGZpbGUgb3IgZGlyZWN0b3J5LCBvciBhXG4gICAgICogcmVhZGFibGUgc3RyZWFtXG4gICAgICogQHBhcmFtIHtzdHJpbmdbXX0gYXJncyBhbnkgYWRkaXRpb25hbCBhcmd1bWVudHMsIGUuZy4sIFsnT3JpZW50YXRpb24jJ11cbiAgICAgKiB0byByZXBvcnQgT3JpZW50YXRpb24gb25seSwgb3IgWyctRmlsZVNpemUnXSB0byBleGNsdWRlIEZpbGVTaXplXG4gICAgICogQHJldHVybnMge1Byb21pc2UuPHtkYXRhOiBvYmplY3RbXXxudWxsLCBlcnJvcjogc3RyaW5nfG51bGx9Pn0gYSBwcm9taXNlXG4gICAgICogcmVzb2x2ZWQgd2l0aCBwYXJzZWQgc3Rkb3V0IGFuZCBzdGRlcnIuXG4gICAgICovXG4gICAgcmVhZE1ldGFkYXRhKGZpbGUsIGFyZ3MpIHtcbiAgICAgICAgaWYgKGxpYi5pc1JlYWRhYmxlKGZpbGUpKSB7XG4gICAgICAgICAgICByZXR1cm4gZXhlY3V0ZVdpdGhScyhmaWxlLCBhcmdzLCB0aGlzLl9leGVjdXRlQ29tbWFuZC5iaW5kKHRoaXMpKVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzLl9leGVjdXRlQ29tbWFuZChmaWxlLCBhcmdzKVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFdyaXRlIG1ldGFkYXRhIHRvIGEgZmlsZSBvciBkaXJlY3RvcnkuXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGZpbGUgcGF0aCB0byB0aGUgZmlsZSBvciBkaXJlY3RvcnlcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gZGF0YSBkYXRhIHRvIHdyaXRlLCB3aXRoIGtleXMgYXMgdGFnc1xuICAgICAqIEBwYXJhbSB7c3RyaW5nW119IGFyZ3MgYWRkaXRpb25hbCBhcmd1bWVudHMsIGUuZy4sIFsnb3ZlcndyaXRlX29yaWdpbmFsJ11cbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IGRlYnVnIHdoZXRoZXIgdG8gcHJpbnQgdG8gc3Rkb3V0XG4gICAgICogQHJldHVybnMge1Byb21pc2UuPHt7ZGF0YSwgZXJyb3J9fT59IEEgcHJvbWlzZSB0byB3cml0ZSBtZXRhZGF0YSxcbiAgICAgKiByZXNvbHZlZCB3aXRoIGRhdGEgZnJvbSBzdGRvdXQgYW5kIHN0ZGVyci5cbiAgICAgKi9cbiAgICBhc3luYyB3cml0ZU1ldGFkYXRhKGZpbGUsIGRhdGEsIGFyZ3MsIGRlYnVnKSB7XG4gICAgICAgIGlmICghbGliLmlzU3RyaW5nKGZpbGUpKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ZpbGUgbXVzdCBiZSBhIHN0cmluZycpXG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFsaWIuY2hlY2tEYXRhT2JqZWN0KGRhdGEpKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0RhdGEgYXJndW1lbnQgaXMgbm90IGFuIG9iamVjdCcpXG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCB3cml0ZUFyZ3MgPSBsaWIubWFwRGF0YVRvVGFnQXJyYXkoZGF0YSlcbiAgICAgICAgcmV0dXJuIHRoaXMuX2V4ZWN1dGVDb21tYW5kKGZpbGUsIGFyZ3MsIHdyaXRlQXJncywgZGVidWcpXG4gICAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBFeGlmdG9vbFByb2Nlc3MsXG4gICAgRVhJRlRPT0xfUEFUSCxcbiAgICBldmVudHMsXG59XG4iXX0=