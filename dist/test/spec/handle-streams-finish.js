'use strict';

require('source-map-support/register');

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var context = require('exiftool-context');
var assert = require('assert');
var exiftool = require('../../src/');
var killPid = require('../lib/kill-pid');

context.globalExiftoolConstructor = exiftool.ExiftoolProcess;

// kill with operating system methods, rather than sending a signal,
// which does not work on Windows
function kill(proc) {
    if (process.platform !== 'win32') {
        return new Promise(function (resolve, reject) {
            proc.once('error', reject);
            proc.once('exit', resolve);
            process.kill(proc.pid);
        });
    }
    return killPid(proc.pid);
}

var expected = 'stdout and stderr finished before operation was complete';

var runTest = function () {
    var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(ctx, getOperationPromise, createTempFile) {
        var operationPromise, killPromise, message;
        return regeneratorRuntime.wrap(function _callee$(_context) {
            while (1) {
                switch (_context.prev = _context.next) {
                    case 0:
                        ctx.create();

                        if (!createTempFile) {
                            _context.next = 4;
                            break;
                        }

                        _context.next = 4;
                        return ctx.createTempFile();

                    case 4:
                        _context.next = 6;
                        return ctx.ep.open();

                    case 6:
                        // stdin might throw "read ECONNRESET" on Linux for some reason
                        ctx.ep._process.stdin.on('error', function () {});
                        // patch stdout so that we never resolve read metadata promise
                        ctx.ep._stdoutResolveWs._write = function (obj, enc, next) {
                            next();
                        };
                        operationPromise = getOperationPromise();
                        killPromise = kill(ctx.ep._process);
                        _context.prev = 10;
                        _context.next = 13;
                        return operationPromise;

                    case 13:
                        throw new Error('Expected operation to be rejected');

                    case 16:
                        _context.prev = 16;
                        _context.t0 = _context['catch'](10);
                        message = _context.t0.message;

                        assert.equal(message, expected);
                        _context.next = 22;
                        return killPromise;

                    case 22:
                    case 'end':
                        return _context.stop();
                }
            }
        }, _callee, undefined, [[10, 16]]);
    }));

    return function runTest(_x, _x2, _x3) {
        return _ref.apply(this, arguments);
    };
}();

var closeStreamsOnExitTestSuite = {
    context: context,
    'should return rejected promise when reading': function () {
        var _ref3 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(ctx) {
            var getOperationPromise;
            return regeneratorRuntime.wrap(function _callee2$(_context2) {
                while (1) {
                    switch (_context2.prev = _context2.next) {
                        case 0:
                            getOperationPromise = function getOperationPromise() {
                                return ctx.ep.readMetadata(ctx.folder);
                            };

                            _context2.next = 3;
                            return runTest(ctx, getOperationPromise);

                        case 3:
                        case 'end':
                            return _context2.stop();
                    }
                }
            }, _callee2, undefined);
        }));

        return function shouldReturnRejectedPromiseWhenReading(_x4) {
            return _ref3.apply(this, arguments);
        };
    }(),
    'should return rejected promise when writing': function () {
        var _ref4 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3(ctx) {
            var getOperationPromise;
            return regeneratorRuntime.wrap(function _callee3$(_context3) {
                while (1) {
                    switch (_context3.prev = _context3.next) {
                        case 0:
                            getOperationPromise = function getOperationPromise() {
                                var keywords = ['keywordA', 'keywordB'];
                                var comment = 'hello world';
                                var data = {
                                    all: '',
                                    comment: comment, // has to come after all in order not to be removed
                                    'Keywords+': keywords
                                };
                                return ctx.ep.writeMetadata(ctx.tempFile, data, ['overwrite_original']);
                            };

                            _context3.next = 3;
                            return runTest(ctx, getOperationPromise, true);

                        case 3:
                        case 'end':
                            return _context3.stop();
                    }
                }
            }, _callee3, undefined);
        }));

        return function shouldReturnRejectedPromiseWhenWriting(_x5) {
            return _ref4.apply(this, arguments);
        };
    }()
};

module.exports = closeStreamsOnExitTestSuite;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3Rlc3Qvc3BlYy9oYW5kbGUtc3RyZWFtcy1maW5pc2guanMiXSwibmFtZXMiOlsiY29udGV4dCIsInJlcXVpcmUiLCJhc3NlcnQiLCJleGlmdG9vbCIsImtpbGxQaWQiLCJnbG9iYWxFeGlmdG9vbENvbnN0cnVjdG9yIiwiRXhpZnRvb2xQcm9jZXNzIiwia2lsbCIsInByb2MiLCJwcm9jZXNzIiwicGxhdGZvcm0iLCJQcm9taXNlIiwicmVzb2x2ZSIsInJlamVjdCIsIm9uY2UiLCJwaWQiLCJleHBlY3RlZCIsInJ1blRlc3QiLCJjdHgiLCJnZXRPcGVyYXRpb25Qcm9taXNlIiwiY3JlYXRlVGVtcEZpbGUiLCJjcmVhdGUiLCJlcCIsIm9wZW4iLCJfcHJvY2VzcyIsInN0ZGluIiwib24iLCJfc3Rkb3V0UmVzb2x2ZVdzIiwiX3dyaXRlIiwib2JqIiwiZW5jIiwibmV4dCIsIm9wZXJhdGlvblByb21pc2UiLCJraWxsUHJvbWlzZSIsIkVycm9yIiwibWVzc2FnZSIsImVxdWFsIiwiY2xvc2VTdHJlYW1zT25FeGl0VGVzdFN1aXRlIiwicmVhZE1ldGFkYXRhIiwiZm9sZGVyIiwia2V5d29yZHMiLCJjb21tZW50IiwiZGF0YSIsImFsbCIsIndyaXRlTWV0YWRhdGEiLCJ0ZW1wRmlsZSIsIm1vZHVsZSIsImV4cG9ydHMiXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBLElBQU1BLFVBQVVDLFFBQVEsa0JBQVIsQ0FBaEI7QUFDQSxJQUFNQyxTQUFTRCxRQUFRLFFBQVIsQ0FBZjtBQUNBLElBQU1FLFdBQVdGLFFBQVEsWUFBUixDQUFqQjtBQUNBLElBQU1HLFVBQVVILFFBQVEsaUJBQVIsQ0FBaEI7O0FBRUFELFFBQVFLLHlCQUFSLEdBQW9DRixTQUFTRyxlQUE3Qzs7QUFFQTtBQUNBO0FBQ0EsU0FBU0MsSUFBVCxDQUFjQyxJQUFkLEVBQW9CO0FBQ2hCLFFBQUlDLFFBQVFDLFFBQVIsS0FBcUIsT0FBekIsRUFBa0M7QUFDOUIsZUFBTyxJQUFJQyxPQUFK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MkIsT0FBT0MsT0FBUCxHQUFpQlYsMkJBQWpCIiwiZmlsZSI6ImhhbmRsZS1zdHJlYW1zLWZpbmlzaC5qcyIsInNvdXJjZXNDb250ZW50IjpbImNvbnN0IGNvbnRleHQgPSByZXF1aXJlKCdleGlmdG9vbC1jb250ZXh0JylcbmNvbnN0IGFzc2VydCA9IHJlcXVpcmUoJ2Fzc2VydCcpXG5jb25zdCBleGlmdG9vbCA9IHJlcXVpcmUoJy4uLy4uL3NyYy8nKVxuY29uc3Qga2lsbFBpZCA9IHJlcXVpcmUoJy4uL2xpYi9raWxsLXBpZCcpXG5cbmNvbnRleHQuZ2xvYmFsRXhpZnRvb2xDb25zdHJ1Y3RvciA9IGV4aWZ0b29sLkV4aWZ0b29sUHJvY2Vzc1xuXG4vLyBraWxsIHdpdGggb3BlcmF0aW5nIHN5c3RlbSBtZXRob2RzLCByYXRoZXIgdGhhbiBzZW5kaW5nIGEgc2lnbmFsLFxuLy8gd2hpY2ggZG9lcyBub3Qgd29yayBvbiBXaW5kb3dzXG5mdW5jdGlvbiBraWxsKHByb2MpIHtcbiAgICBpZiAocHJvY2Vzcy5wbGF0Zm9ybSAhPT0gJ3dpbjMyJykge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgcHJvYy5vbmNlKCdlcnJvcicsIHJlamVjdClcbiAgICAgICAgICAgIHByb2Mub25jZSgnZXhpdCcsIHJlc29sdmUpXG4gICAgICAgICAgICBwcm9jZXNzLmtpbGwocHJvYy5waWQpXG4gICAgICAgIH0pXG4gICAgfVxuICAgIHJldHVybiBraWxsUGlkKHByb2MucGlkKVxufVxuXG5jb25zdCBleHBlY3RlZCA9ICdzdGRvdXQgYW5kIHN0ZGVyciBmaW5pc2hlZCBiZWZvcmUgb3BlcmF0aW9uIHdhcyBjb21wbGV0ZSdcblxuY29uc3QgcnVuVGVzdCA9IGFzeW5jIChjdHgsIGdldE9wZXJhdGlvblByb21pc2UsIGNyZWF0ZVRlbXBGaWxlKSA9PiB7XG4gICAgY3R4LmNyZWF0ZSgpXG4gICAgaWYgKGNyZWF0ZVRlbXBGaWxlKSBhd2FpdCBjdHguY3JlYXRlVGVtcEZpbGUoKVxuICAgIGF3YWl0IGN0eC5lcC5vcGVuKClcbiAgICAvLyBzdGRpbiBtaWdodCB0aHJvdyBcInJlYWQgRUNPTk5SRVNFVFwiIG9uIExpbnV4IGZvciBzb21lIHJlYXNvblxuICAgIGN0eC5lcC5fcHJvY2Vzcy5zdGRpbi5vbignZXJyb3InLCAoKSA9PiB7fSlcbiAgICAvLyBwYXRjaCBzdGRvdXQgc28gdGhhdCB3ZSBuZXZlciByZXNvbHZlIHJlYWQgbWV0YWRhdGEgcHJvbWlzZVxuICAgIGN0eC5lcC5fc3Rkb3V0UmVzb2x2ZVdzLl93cml0ZSA9IChvYmosIGVuYywgbmV4dCkgPT4ge1xuICAgICAgICBuZXh0KClcbiAgICB9XG4gICAgY29uc3Qgb3BlcmF0aW9uUHJvbWlzZSA9IGdldE9wZXJhdGlvblByb21pc2UoKVxuXG4gICAgY29uc3Qga2lsbFByb21pc2UgPSBraWxsKGN0eC5lcC5fcHJvY2VzcylcblxuICAgIHRyeSB7XG4gICAgICAgIGF3YWl0IG9wZXJhdGlvblByb21pc2VcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdFeHBlY3RlZCBvcGVyYXRpb24gdG8gYmUgcmVqZWN0ZWQnKVxuICAgIH0gY2F0Y2ggKHsgbWVzc2FnZSB9KSB7XG4gICAgICAgIGFzc2VydC5lcXVhbChtZXNzYWdlLCBleHBlY3RlZClcbiAgICAgICAgYXdhaXQga2lsbFByb21pc2VcbiAgICB9XG59XG5cbmNvbnN0IGNsb3NlU3RyZWFtc09uRXhpdFRlc3RTdWl0ZSA9IHtcbiAgICBjb250ZXh0LFxuICAgICdzaG91bGQgcmV0dXJuIHJlamVjdGVkIHByb21pc2Ugd2hlbiByZWFkaW5nJzogYXN5bmMgKGN0eCkgPT4ge1xuICAgICAgICBjb25zdCBnZXRPcGVyYXRpb25Qcm9taXNlID0gKCkgPT4gY3R4LmVwLnJlYWRNZXRhZGF0YShjdHguZm9sZGVyKVxuICAgICAgICBhd2FpdCBydW5UZXN0KGN0eCwgZ2V0T3BlcmF0aW9uUHJvbWlzZSlcbiAgICB9LFxuICAgICdzaG91bGQgcmV0dXJuIHJlamVjdGVkIHByb21pc2Ugd2hlbiB3cml0aW5nJzogYXN5bmMgKGN0eCkgPT4ge1xuICAgICAgICBjb25zdCBnZXRPcGVyYXRpb25Qcm9taXNlID0gKCkgPT4ge1xuICAgICAgICAgICAgY29uc3Qga2V5d29yZHMgPSBbICdrZXl3b3JkQScsICdrZXl3b3JkQicgXVxuICAgICAgICAgICAgY29uc3QgY29tbWVudCA9ICdoZWxsbyB3b3JsZCdcbiAgICAgICAgICAgIGNvbnN0IGRhdGEgPSB7XG4gICAgICAgICAgICAgICAgYWxsOiAnJyxcbiAgICAgICAgICAgICAgICBjb21tZW50LCAvLyBoYXMgdG8gY29tZSBhZnRlciBhbGwgaW4gb3JkZXIgbm90IHRvIGJlIHJlbW92ZWRcbiAgICAgICAgICAgICAgICAnS2V5d29yZHMrJzoga2V5d29yZHMsXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gY3R4LmVwLndyaXRlTWV0YWRhdGEoY3R4LnRlbXBGaWxlLCBkYXRhLCBbJ292ZXJ3cml0ZV9vcmlnaW5hbCddKVxuICAgICAgICB9XG5cbiAgICAgICAgYXdhaXQgcnVuVGVzdChjdHgsIGdldE9wZXJhdGlvblByb21pc2UsIHRydWUpXG4gICAgfSxcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBjbG9zZVN0cmVhbXNPbkV4aXRUZXN0U3VpdGVcbiJdfQ==