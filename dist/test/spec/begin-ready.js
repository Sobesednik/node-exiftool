'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

require('source-map-support/register');

var assert = require('assert');

var _require = require('stream'),
    Readable = _require.Readable,
    Writable = _require.Writable;

var _require2 = require('../../src/begin-ready'),
    createBeginReadyMatchTransformStream = _require2.createBeginReadyMatchTransformStream,
    createResolverWriteStream = _require2.createResolverWriteStream,
    setupResolveWriteStreamPipe = _require2.setupResolveWriteStreamPipe;

/**
 * Pipe Readable stream in object mode into process.stdout,
 * using JSON.stringify to print data. This might results in
 * MaxListenersExceededWarning in tests, when process.stdout
 * gets assigned a lot of stream listeners such as end, drain,
 * error, finish, unpipe, close.
 */
// function debugObjectReadStream(rs, name) {
//     rs.pipe(new Transform({
//         objectMode: true,
//         transform: (chunk, enc, next) => {
//             const s = JSON.stringify(chunk, null, 2)
//             console.log(`Some data from ${name} rs: `)
//             next(null, `${s}\r\n`)
//         },
//     })).pipe(process.stdout)
// }

var commandNumber = '376080';
var commandNumber2 = '65754';

var data = '\n[{\n  "SourceFile": "test/fixtures/CANON/IMG_9857.JPG",\n  "ExifToolVersion": 10.25,\n  "FileName": "IMG_9857.JPG",\n  "Directory": "test/fixtures/CANON",\n  "FileSize": "51 kB",\n  "FileModifyDate": "2016:05:16 00:25:40+01:00",\n  "FileAccessDate": "2016:11:26 01:20:48+00:00",\n  "FileInodeChangeDate": "2016:05:16 00:25:40+01:00",\n  "FilePermissions": "rw-r--r--",\n  "FileType": "JPEG",\n  "FileTypeExtension": "jpg",\n  "MIMEType": "image/jpeg",\n  "XMPToolkit": "Image::ExifTool 10.11",\n  "CreatorWorkURL": "https://sobesednik.media",\n  "Scene": "011200",\n  "Creator": "Photographer Name",\n  "ImageWidth": 500,\n  "ImageHeight": 333,\n  "EncodingProcess": "Baseline DCT, Huffman coding",\n  "BitsPerSample": 8,\n  "ColorComponents": 3,\n  "YCbCrSubSampling": "YCbCr4:2:0 (2 2)",\n  "ImageSize": "500x333",\n  "Megapixels": 0.167\n}]\n'.trim();

var data2 = 'File not found: test/fixtures/no_such_file2.jpg';

var s = ('\n{begin' + commandNumber + '}\n' + data + '\n{ready' + commandNumber + '}\n').trim();

var s2 = ('\n{begin' + commandNumber2 + '}\n' + data2 + '\n{ready' + commandNumber2 + '}\n').trim();
var exiftoolOutput = ('\n' + s + '\n' + s2 + '\n').trim();

var brtsTestSuite = {
    createBeginReadyMatchTransformStream: {
        'should transform match data': function shouldTransformMatchData() {
            var rs = new Readable({ objectMode: true });
            rs._read = function () {
                var match = {
                    1: commandNumber,
                    2: data
                };
                var match2 = {
                    1: commandNumber2,
                    2: data2
                };
                rs.push(match);
                rs.push(match2);
                rs.push(null);
            };
            var brts = createBeginReadyMatchTransformStream();

            return new Promise(function (resolve, reject) {
                var ws = new Writable({ objectMode: true });
                var data = [];
                ws._write = function (chunk, enc, next) {
                    data.push(chunk);
                    next();
                };
                ws.on('finish', function () {
                    resolve(data);
                });
                ws.on('error', reject);
                rs.pipe(brts).pipe(ws);
            }).then(function (res) {
                assert.equal(res.length, 2);

                var _res = _slicedToArray(res, 2),
                    output = _res[0],
                    output2 = _res[1];

                assert.equal(output.cn, commandNumber);
                assert.equal(output.d, data);
                assert.equal(output2.cn, commandNumber2);
                assert.equal(output2.d, data2);
            });
        }
    },
    createResolverWriteStream: {
        'should have _resolveMap property': function shouldHave_resolveMapProperty() {
            var rws = createResolverWriteStream();
            assert.equal(_typeof(rws._resolveMap), 'object');
        },
        'should have addToResolveMap function': function shouldHaveAddToResolveMapFunction() {
            var rws = createResolverWriteStream();
            assert.equal(_typeof(rws.addToResolveMap), 'function');
        },
        'should add resolve function to the map': function shouldAddResolveFunctionToTheMap() {
            var rws = createResolverWriteStream();
            var handler = function handler() {};
            rws.addToResolveMap(commandNumber, handler);
            assert.strictEqual(rws._resolveMap[commandNumber], handler);
        },
        'should throw an error when resolve is not a function': function shouldThrowAnErrorWhenResolveIsNotAFunction() {
            var rws = createResolverWriteStream();
            assert.throws(function () {
                return rws.addToResolveMap(commandNumber);
            }, /resolve argument must be a function/);
        },
        'should throw an error when commandNumber is not a string': function shouldThrowAnErrorWhenCommandNumberIsNotAString() {
            var rws = createResolverWriteStream();
            assert.throws(function () {
                return rws.addToResolveMap();
            }, /commandNumber argument must be a string/);
        },
        'should throw an error when key already exists in the map': function shouldThrowAnErrorWhenKeyAlreadyExistsInTheMap() {
            var rws = createResolverWriteStream();
            var handler = function handler() {};
            rws.addToResolveMap(commandNumber, handler);
            assert.throws(function () {
                return rws.addToResolveMap(commandNumber, handler);
            }, /Command with the same number is already expected/);
        },
        'should call resolve and delete entry from resolveMap on data': function shouldCallResolveAndDeleteEntryFromResolveMapOnData() {
            var rs = new Readable({ objectMode: true });
            rs._read = function () {
                rs.push({
                    cn: commandNumber,
                    d: data
                });
                rs.push({
                    cn: commandNumber2,
                    d: data2
                });
                rs.push(null);
            };
            var results = [];
            var handler = function handler(data) {
                return results.push(data);
            };
            var rws = createResolverWriteStream();
            rws.addToResolveMap(commandNumber, handler);
            rws.addToResolveMap(commandNumber2, handler);

            rs.pipe(rws);

            return new Promise(function (resolve) {
                return rws.on('finish', resolve);
            }).then(function () {
                assert.equal(results.length, 2);
                assert.equal(results[0], data);
                assert.equal(results[1], data2);
                assert(!Object.keys(rws._resolveMap).length);
            });
        },
        'should call next with an error when command number cannot be found': function shouldCallNextWithAnErrorWhenCommandNumberCannotBeFound() {
            var rs = new Readable({ objectMode: true });
            rs._read = function () {
                rs.push({
                    cn: commandNumber,
                    d: data
                });
                rs.push({
                    cn: commandNumber2,
                    d: data2
                });
                rs.push(null);
            };
            var results = [];
            var handler = function handler(data) {
                return results.push(data);
            };
            var rws = createResolverWriteStream();
            rws.addToResolveMap(commandNumber, handler);

            rs.pipe(rws);

            return new Promise(function (resolve) {
                return rws.on('error', resolve);
            }).then(function (err) {
                assert.equal(err.message, 'Command with index ' + commandNumber2 + ' not found');
                assert.equal(results.length, 1);
                assert.equal(results[0], data);
            });
        }
    },
    setupResolveWriteStreamPipe: {
        'should pipe exiftool data and call resolve functions': function shouldPipeExiftoolDataAndCallResolveFunctions() {
            var rs = new Readable();
            rs._read = function () {
                rs.push(exiftoolOutput);
                rs.push(null);
            };
            var results = [];
            var rws = setupResolveWriteStreamPipe(rs);
            rws.addToResolveMap(commandNumber, function (data) {
                return results.push(data);
            });
            rws.addToResolveMap(commandNumber2, function (data) {
                return results.push(data);
            });
            return new Promise(function (resolve) {
                return rws.on('finish', resolve);
            }).then(function () {
                assert.equal(results.length, 2);
                assert.equal(results[0], data);
                assert.equal(results[1], data2);
            });
        }
    }
};

module.exports = brtsTestSuite;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3Rlc3Qvc3BlYy9iZWdpbi1yZWFkeS5qcyJdLCJuYW1lcyI6WyJhc3NlcnQiLCJyZXF1aXJlIiwiUmVhZGFibGUiLCJXcml0YWJsZSIsImNyZWF0ZUJlZ2luUmVhZHlNYXRjaFRyYW5zZm9ybVN0cmVhbSIsImNyZWF0ZVJlc29sdmVyV3JpdGVTdHJlYW0iLCJzZXR1cFJlc29sdmVXcml0ZVN0cmVhbVBpcGUiLCJjb21tYW5kTnVtYmVyIiwiY29tbWFuZE51bWJlcjIiLCJkYXRhIiwidHJpbSIsImRhdGEyIiwicyIsInMyIiwiZXhpZnRvb2xPdXRwdXQiLCJicnRzVGVzdFN1aXRlIiwicnMiLCJvYmplY3RNb2RlIiwiX3JlYWQiLCJtYXRjaCIsIm1hdGNoMiIsInB1c2giLCJicnRzIiwiUHJvbWlzZSIsInJlc29sdmUiLCJyZWplY3QiLCJ3cyIsIl93cml0ZSIsImNodW5rIiwiZW5jIiwibmV4dCIsIm9uIiwicGlwZSIsInRoZW4iLCJyZXMiLCJlcXVhbCIsImxlbmd0aCIsIm91dHB1dCIsIm91dHB1dDIiLCJjbiIsImQiLCJyd3MiLCJfcmVzb2x2ZU1hcCIsImFkZFRvUmVzb2x2ZU1hcCIsImhhbmRsZXIiLCJzdHJpY3RFcXVhbCIsInRocm93cyIsInJlc3VsdHMiLCJPYmplY3QiLCJrZXlzIiwiZXJyIiwibWVzc2FnZSIsIm1vZHVsZSIsImV4cG9ydHMiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7O0FBQUEsSUFBTUEsU0FBU0MsUUFBUSxRQUFSLENBQWY7O2VBQytCQSxRQUFRLFFBQVIsQztJQUF2QkMsUSxZQUFBQSxRO0lBQVVDLFEsWUFBQUEsUTs7Z0JBS2RGLFFBQVEsdUJBQVIsQztJQUhBRyxvQyxhQUFBQSxvQztJQUNBQyx5QixhQUFBQSx5QjtJQUNBQywyQixhQUFBQSwyQjs7QUFHSjs7Ozs7OztBQU9BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLElBQU1DLGdCQUFnQixRQUF0QjtBQUNB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b0JuQyxjQUFwQixFQUFvQyxVQUFDQyxJQUFEO0FBQUEsdUJBQVVzQyxRQUFRMUIsSUFBUixDQUFhWixJQUFiLENBQVY7QUFBQSxhQUFwQztBQUNBLG1CQUFPLElBQUljLE9BQUosQ0FBWTtBQUFBLHVCQUFXa0IsSUFBSVYsRUFBSixDQUFPLFFBQVAsRUFBaUJQLE9BQWpCLENBQVg7QUFBQSxhQUFaLEVBQ0ZTLElBREUsQ0FDRyxZQUFNO0FBQ1JqQyx1QkFBT21DLEtBQVAsQ0FBYVksUUFBUVgsTUFBckIsRUFBNkIsQ0FBN0I7QUFDQXBDLHVCQUFPbUMsS0FBUCxDQUFhWSxRQUFRLENBQVIsQ0FBYixFQUF5QnRDLElBQXpCO0FBQ0FULHVCQUFPbUMsS0FBUCxDQUFhWSxRQUFRLENBQVIsQ0FBYixFQUF5QnBDLEtBQXpCO0FBQ0gsYUFMRSxDQUFQO0FBTUg7QUFqQndCO0FBdklYLENBQXRCOztBQTRKQXlDLE9BQU9DLE9BQVAsR0FBaUJ0QyxhQUFqQiIsImZpbGUiOiJiZWdpbi1yZWFkeS5qcyIsInNvdXJjZXNDb250ZW50IjpbImNvbnN0IGFzc2VydCA9IHJlcXVpcmUoJ2Fzc2VydCcpXG5jb25zdCB7IFJlYWRhYmxlLCBXcml0YWJsZSB9ID0gcmVxdWlyZSgnc3RyZWFtJylcbmNvbnN0IHtcbiAgICBjcmVhdGVCZWdpblJlYWR5TWF0Y2hUcmFuc2Zvcm1TdHJlYW0sXG4gICAgY3JlYXRlUmVzb2x2ZXJXcml0ZVN0cmVhbSxcbiAgICBzZXR1cFJlc29sdmVXcml0ZVN0cmVhbVBpcGUsXG59ID0gcmVxdWlyZSgnLi4vLi4vc3JjL2JlZ2luLXJlYWR5JylcblxuLyoqXG4gKiBQaXBlIFJlYWRhYmxlIHN0cmVhbSBpbiBvYmplY3QgbW9kZSBpbnRvIHByb2Nlc3Muc3Rkb3V0LFxuICogdXNpbmcgSlNPTi5zdHJpbmdpZnkgdG8gcHJpbnQgZGF0YS4gVGhpcyBtaWdodCByZXN1bHRzIGluXG4gKiBNYXhMaXN0ZW5lcnNFeGNlZWRlZFdhcm5pbmcgaW4gdGVzdHMsIHdoZW4gcHJvY2Vzcy5zdGRvdXRcbiAqIGdldHMgYXNzaWduZWQgYSBsb3Qgb2Ygc3RyZWFtIGxpc3RlbmVycyBzdWNoIGFzIGVuZCwgZHJhaW4sXG4gKiBlcnJvciwgZmluaXNoLCB1bnBpcGUsIGNsb3NlLlxuICovXG4vLyBmdW5jdGlvbiBkZWJ1Z09iamVjdFJlYWRTdHJlYW0ocnMsIG5hbWUpIHtcbi8vICAgICBycy5waXBlKG5ldyBUcmFuc2Zvcm0oe1xuLy8gICAgICAgICBvYmplY3RNb2RlOiB0cnVlLFxuLy8gICAgICAgICB0cmFuc2Zvcm06IChjaHVuaywgZW5jLCBuZXh0KSA9PiB7XG4vLyAgICAgICAgICAgICBjb25zdCBzID0gSlNPTi5zdHJpbmdpZnkoY2h1bmssIG51bGwsIDIpXG4vLyAgICAgICAgICAgICBjb25zb2xlLmxvZyhgU29tZSBkYXRhIGZyb20gJHtuYW1lfSByczogYClcbi8vICAgICAgICAgICAgIG5leHQobnVsbCwgYCR7c31cXHJcXG5gKVxuLy8gICAgICAgICB9LFxuLy8gICAgIH0pKS5waXBlKHByb2Nlc3Muc3Rkb3V0KVxuLy8gfVxuXG5jb25zdCBjb21tYW5kTnVtYmVyID0gJzM3NjA4MCdcbmNvbnN0IGNvbW1hbmROdW1iZXIyID0gJzY1NzU0J1xuXG5jb25zdCBkYXRhID0gYFxuW3tcbiAgXCJTb3VyY2VGaWxlXCI6IFwidGVzdC9maXh0dXJlcy9DQU5PTi9JTUdfOTg1Ny5KUEdcIixcbiAgXCJFeGlmVG9vbFZlcnNpb25cIjogMTAuMjUsXG4gIFwiRmlsZU5hbWVcIjogXCJJTUdfOTg1Ny5KUEdcIixcbiAgXCJEaXJlY3RvcnlcIjogXCJ0ZXN0L2ZpeHR1cmVzL0NBTk9OXCIsXG4gIFwiRmlsZVNpemVcIjogXCI1MSBrQlwiLFxuICBcIkZpbGVNb2RpZnlEYXRlXCI6IFwiMjAxNjowNToxNiAwMDoyNTo0MCswMTowMFwiLFxuICBcIkZpbGVBY2Nlc3NEYXRlXCI6IFwiMjAxNjoxMToyNiAwMToyMDo0OCswMDowMFwiLFxuICBcIkZpbGVJbm9kZUNoYW5nZURhdGVcIjogXCIyMDE2OjA1OjE2IDAwOjI1OjQwKzAxOjAwXCIsXG4gIFwiRmlsZVBlcm1pc3Npb25zXCI6IFwicnctci0tci0tXCIsXG4gIFwiRmlsZVR5cGVcIjogXCJKUEVHXCIsXG4gIFwiRmlsZVR5cGVFeHRlbnNpb25cIjogXCJqcGdcIixcbiAgXCJNSU1FVHlwZVwiOiBcImltYWdlL2pwZWdcIixcbiAgXCJYTVBUb29sa2l0XCI6IFwiSW1hZ2U6OkV4aWZUb29sIDEwLjExXCIsXG4gIFwiQ3JlYXRvcldvcmtVUkxcIjogXCJodHRwczovL3NvYmVzZWRuaWsubWVkaWFcIixcbiAgXCJTY2VuZVwiOiBcIjAxMTIwMFwiLFxuICBcIkNyZWF0b3JcIjogXCJQaG90b2dyYXBoZXIgTmFtZVwiLFxuICBcIkltYWdlV2lkdGhcIjogNTAwLFxuICBcIkltYWdlSGVpZ2h0XCI6IDMzMyxcbiAgXCJFbmNvZGluZ1Byb2Nlc3NcIjogXCJCYXNlbGluZSBEQ1QsIEh1ZmZtYW4gY29kaW5nXCIsXG4gIFwiQml0c1BlclNhbXBsZVwiOiA4LFxuICBcIkNvbG9yQ29tcG9uZW50c1wiOiAzLFxuICBcIllDYkNyU3ViU2FtcGxpbmdcIjogXCJZQ2JDcjQ6MjowICgyIDIpXCIsXG4gIFwiSW1hZ2VTaXplXCI6IFwiNTAweDMzM1wiLFxuICBcIk1lZ2FwaXhlbHNcIjogMC4xNjdcbn1dXG5gXG4gICAgLnRyaW0oKVxuXG5jb25zdCBkYXRhMiA9ICdGaWxlIG5vdCBmb3VuZDogdGVzdC9maXh0dXJlcy9ub19zdWNoX2ZpbGUyLmpwZydcblxuY29uc3QgcyA9IGBcbntiZWdpbiR7Y29tbWFuZE51bWJlcn19XG4ke2RhdGF9XG57cmVhZHkke2NvbW1hbmROdW1iZXJ9fVxuYFxuICAgIC50cmltKClcblxuY29uc3QgczIgPSBgXG57YmVnaW4ke2NvbW1hbmROdW1iZXIyfX1cbiR7ZGF0YTJ9XG57cmVhZHkke2NvbW1hbmROdW1iZXIyfX1cbmBcbiAgICAudHJpbSgpXG5jb25zdCBleGlmdG9vbE91dHB1dCA9IGBcbiR7c31cbiR7czJ9XG5gXG4gICAgLnRyaW0oKVxuXG5jb25zdCBicnRzVGVzdFN1aXRlID0ge1xuICAgIGNyZWF0ZUJlZ2luUmVhZHlNYXRjaFRyYW5zZm9ybVN0cmVhbToge1xuICAgICAgICAnc2hvdWxkIHRyYW5zZm9ybSBtYXRjaCBkYXRhJzogKCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgcnMgPSBuZXcgUmVhZGFibGUoeyBvYmplY3RNb2RlOiB0cnVlIH0pXG4gICAgICAgICAgICBycy5fcmVhZCA9ICgpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBtYXRjaCA9IHtcbiAgICAgICAgICAgICAgICAgICAgMTogY29tbWFuZE51bWJlcixcbiAgICAgICAgICAgICAgICAgICAgMjogZGF0YSxcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY29uc3QgbWF0Y2gyID0ge1xuICAgICAgICAgICAgICAgICAgICAxOiBjb21tYW5kTnVtYmVyMixcbiAgICAgICAgICAgICAgICAgICAgMjogZGF0YTIsXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJzLnB1c2gobWF0Y2gpXG4gICAgICAgICAgICAgICAgcnMucHVzaChtYXRjaDIpXG4gICAgICAgICAgICAgICAgcnMucHVzaChudWxsKVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgYnJ0cyA9IGNyZWF0ZUJlZ2luUmVhZHlNYXRjaFRyYW5zZm9ybVN0cmVhbSgpXG5cbiAgICAgICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3Qgd3MgPSBuZXcgV3JpdGFibGUoeyBvYmplY3RNb2RlOiB0cnVlIH0pXG4gICAgICAgICAgICAgICAgY29uc3QgZGF0YSA9IFtdXG4gICAgICAgICAgICAgICAgd3MuX3dyaXRlID0gKGNodW5rLCBlbmMsIG5leHQpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgZGF0YS5wdXNoKGNodW5rKVxuICAgICAgICAgICAgICAgICAgICBuZXh0KClcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgd3Mub24oJ2ZpbmlzaCcsICgpID0+IHsgcmVzb2x2ZShkYXRhKSB9KVxuICAgICAgICAgICAgICAgIHdzLm9uKCdlcnJvcicsIHJlamVjdClcbiAgICAgICAgICAgICAgICBycy5waXBlKGJydHMpLnBpcGUod3MpXG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIC50aGVuKChyZXMpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHJlcy5sZW5ndGgsIDIpXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IFtvdXRwdXQsIG91dHB1dDJdID0gcmVzXG4gICAgICAgICAgICAgICAgICAgIGFzc2VydC5lcXVhbChvdXRwdXQuY24sIGNvbW1hbmROdW1iZXIpXG4gICAgICAgICAgICAgICAgICAgIGFzc2VydC5lcXVhbChvdXRwdXQuZCwgZGF0YSlcbiAgICAgICAgICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKG91dHB1dDIuY24sIGNvbW1hbmROdW1iZXIyKVxuICAgICAgICAgICAgICAgICAgICBhc3NlcnQuZXF1YWwob3V0cHV0Mi5kLCBkYXRhMilcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICB9LFxuICAgIH0sXG4gICAgY3JlYXRlUmVzb2x2ZXJXcml0ZVN0cmVhbToge1xuICAgICAgICAnc2hvdWxkIGhhdmUgX3Jlc29sdmVNYXAgcHJvcGVydHknOiAoKSA9PiB7XG4gICAgICAgICAgICBjb25zdCByd3MgPSBjcmVhdGVSZXNvbHZlcldyaXRlU3RyZWFtKClcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbCh0eXBlb2YgcndzLl9yZXNvbHZlTWFwLCAnb2JqZWN0JylcbiAgICAgICAgfSxcbiAgICAgICAgJ3Nob3VsZCBoYXZlIGFkZFRvUmVzb2x2ZU1hcCBmdW5jdGlvbic6ICgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHJ3cyA9IGNyZWF0ZVJlc29sdmVyV3JpdGVTdHJlYW0oKVxuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHR5cGVvZiByd3MuYWRkVG9SZXNvbHZlTWFwLCAnZnVuY3Rpb24nKVxuICAgICAgICB9LFxuICAgICAgICAnc2hvdWxkIGFkZCByZXNvbHZlIGZ1bmN0aW9uIHRvIHRoZSBtYXAnOiAoKSA9PiB7XG4gICAgICAgICAgICBjb25zdCByd3MgPSBjcmVhdGVSZXNvbHZlcldyaXRlU3RyZWFtKClcbiAgICAgICAgICAgIGNvbnN0IGhhbmRsZXIgPSAoKSA9PiB7fVxuICAgICAgICAgICAgcndzLmFkZFRvUmVzb2x2ZU1hcChjb21tYW5kTnVtYmVyLCBoYW5kbGVyKVxuICAgICAgICAgICAgYXNzZXJ0LnN0cmljdEVxdWFsKHJ3cy5fcmVzb2x2ZU1hcFtjb21tYW5kTnVtYmVyXSwgaGFuZGxlcilcbiAgICAgICAgfSxcbiAgICAgICAgJ3Nob3VsZCB0aHJvdyBhbiBlcnJvciB3aGVuIHJlc29sdmUgaXMgbm90IGEgZnVuY3Rpb24nOiAoKSA9PiB7XG4gICAgICAgICAgICBjb25zdCByd3MgPSBjcmVhdGVSZXNvbHZlcldyaXRlU3RyZWFtKClcbiAgICAgICAgICAgIGFzc2VydC50aHJvd3MoXG4gICAgICAgICAgICAgICAgKCkgPT4gcndzLmFkZFRvUmVzb2x2ZU1hcChjb21tYW5kTnVtYmVyKSxcbiAgICAgICAgICAgICAgICAvcmVzb2x2ZSBhcmd1bWVudCBtdXN0IGJlIGEgZnVuY3Rpb24vXG4gICAgICAgICAgICApXG4gICAgICAgIH0sXG4gICAgICAgICdzaG91bGQgdGhyb3cgYW4gZXJyb3Igd2hlbiBjb21tYW5kTnVtYmVyIGlzIG5vdCBhIHN0cmluZyc6ICgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHJ3cyA9IGNyZWF0ZVJlc29sdmVyV3JpdGVTdHJlYW0oKVxuICAgICAgICAgICAgYXNzZXJ0LnRocm93cyhcbiAgICAgICAgICAgICAgICAoKSA9PiByd3MuYWRkVG9SZXNvbHZlTWFwKCksXG4gICAgICAgICAgICAgICAgL2NvbW1hbmROdW1iZXIgYXJndW1lbnQgbXVzdCBiZSBhIHN0cmluZy9cbiAgICAgICAgICAgIClcbiAgICAgICAgfSxcbiAgICAgICAgJ3Nob3VsZCB0aHJvdyBhbiBlcnJvciB3aGVuIGtleSBhbHJlYWR5IGV4aXN0cyBpbiB0aGUgbWFwJzogKCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgcndzID0gY3JlYXRlUmVzb2x2ZXJXcml0ZVN0cmVhbSgpXG4gICAgICAgICAgICBjb25zdCBoYW5kbGVyID0gKCkgPT4ge31cbiAgICAgICAgICAgIHJ3cy5hZGRUb1Jlc29sdmVNYXAoY29tbWFuZE51bWJlciwgaGFuZGxlcilcbiAgICAgICAgICAgIGFzc2VydC50aHJvd3MoXG4gICAgICAgICAgICAgICAgKCkgPT4gcndzLmFkZFRvUmVzb2x2ZU1hcChjb21tYW5kTnVtYmVyLCBoYW5kbGVyKSxcbiAgICAgICAgICAgICAgICAvQ29tbWFuZCB3aXRoIHRoZSBzYW1lIG51bWJlciBpcyBhbHJlYWR5IGV4cGVjdGVkL1xuICAgICAgICAgICAgKVxuICAgICAgICB9LFxuICAgICAgICAnc2hvdWxkIGNhbGwgcmVzb2x2ZSBhbmQgZGVsZXRlIGVudHJ5IGZyb20gcmVzb2x2ZU1hcCBvbiBkYXRhJzogKCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgcnMgPSBuZXcgUmVhZGFibGUoeyBvYmplY3RNb2RlOiB0cnVlfSlcbiAgICAgICAgICAgIHJzLl9yZWFkID0gKCkgPT4ge1xuICAgICAgICAgICAgICAgIHJzLnB1c2goe1xuICAgICAgICAgICAgICAgICAgICBjbjogY29tbWFuZE51bWJlcixcbiAgICAgICAgICAgICAgICAgICAgZDogZGF0YSxcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIHJzLnB1c2goe1xuICAgICAgICAgICAgICAgICAgICBjbjogY29tbWFuZE51bWJlcjIsXG4gICAgICAgICAgICAgICAgICAgIGQ6IGRhdGEyLFxuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgcnMucHVzaChudWxsKVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgcmVzdWx0cyA9IFtdXG4gICAgICAgICAgICBjb25zdCBoYW5kbGVyID0gKGRhdGEpID0+IHJlc3VsdHMucHVzaChkYXRhKVxuICAgICAgICAgICAgY29uc3QgcndzID0gY3JlYXRlUmVzb2x2ZXJXcml0ZVN0cmVhbSgpXG4gICAgICAgICAgICByd3MuYWRkVG9SZXNvbHZlTWFwKGNvbW1hbmROdW1iZXIsIGhhbmRsZXIpXG4gICAgICAgICAgICByd3MuYWRkVG9SZXNvbHZlTWFwKGNvbW1hbmROdW1iZXIyLCBoYW5kbGVyKVxuXG4gICAgICAgICAgICBycy5waXBlKHJ3cylcblxuICAgICAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKHJlc29sdmUgPT4gcndzLm9uKCdmaW5pc2gnLCByZXNvbHZlKSlcbiAgICAgICAgICAgICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGFzc2VydC5lcXVhbChyZXN1bHRzLmxlbmd0aCwgMilcbiAgICAgICAgICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHJlc3VsdHNbMF0sIGRhdGEpXG4gICAgICAgICAgICAgICAgICAgIGFzc2VydC5lcXVhbChyZXN1bHRzWzFdLCBkYXRhMilcbiAgICAgICAgICAgICAgICAgICAgYXNzZXJ0KCFPYmplY3Qua2V5cyhyd3MuX3Jlc29sdmVNYXApLmxlbmd0aClcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICB9LFxuICAgICAgICAnc2hvdWxkIGNhbGwgbmV4dCB3aXRoIGFuIGVycm9yIHdoZW4gY29tbWFuZCBudW1iZXIgY2Fubm90IGJlIGZvdW5kJzogKCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgcnMgPSBuZXcgUmVhZGFibGUoeyBvYmplY3RNb2RlOiB0cnVlfSlcbiAgICAgICAgICAgIHJzLl9yZWFkID0gKCkgPT4ge1xuICAgICAgICAgICAgICAgIHJzLnB1c2goe1xuICAgICAgICAgICAgICAgICAgICBjbjogY29tbWFuZE51bWJlcixcbiAgICAgICAgICAgICAgICAgICAgZDogZGF0YSxcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIHJzLnB1c2goe1xuICAgICAgICAgICAgICAgICAgICBjbjogY29tbWFuZE51bWJlcjIsXG4gICAgICAgICAgICAgICAgICAgIGQ6IGRhdGEyLFxuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgcnMucHVzaChudWxsKVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgcmVzdWx0cyA9IFtdXG4gICAgICAgICAgICBjb25zdCBoYW5kbGVyID0gKGRhdGEpID0+IHJlc3VsdHMucHVzaChkYXRhKVxuICAgICAgICAgICAgY29uc3QgcndzID0gY3JlYXRlUmVzb2x2ZXJXcml0ZVN0cmVhbSgpXG4gICAgICAgICAgICByd3MuYWRkVG9SZXNvbHZlTWFwKGNvbW1hbmROdW1iZXIsIGhhbmRsZXIpXG5cbiAgICAgICAgICAgIHJzLnBpcGUocndzKVxuXG4gICAgICAgICAgICByZXR1cm4gbmV3IFByb21pc2UocmVzb2x2ZSA9PiByd3Mub24oJ2Vycm9yJywgcmVzb2x2ZSkpXG4gICAgICAgICAgICAgICAgLnRoZW4oKGVycikgPT4ge1xuICAgICAgICAgICAgICAgICAgICBhc3NlcnQuZXF1YWwoZXJyLm1lc3NhZ2UsIGBDb21tYW5kIHdpdGggaW5kZXggJHtjb21tYW5kTnVtYmVyMn0gbm90IGZvdW5kYClcbiAgICAgICAgICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHJlc3VsdHMubGVuZ3RoLCAxKVxuICAgICAgICAgICAgICAgICAgICBhc3NlcnQuZXF1YWwocmVzdWx0c1swXSwgZGF0YSlcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICB9LFxuICAgIH0sXG4gICAgc2V0dXBSZXNvbHZlV3JpdGVTdHJlYW1QaXBlOiB7XG4gICAgICAgICdzaG91bGQgcGlwZSBleGlmdG9vbCBkYXRhIGFuZCBjYWxsIHJlc29sdmUgZnVuY3Rpb25zJzogKCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgcnMgPSBuZXcgUmVhZGFibGVcbiAgICAgICAgICAgIHJzLl9yZWFkID0gKCkgPT4ge1xuICAgICAgICAgICAgICAgIHJzLnB1c2goZXhpZnRvb2xPdXRwdXQpXG4gICAgICAgICAgICAgICAgcnMucHVzaChudWxsKVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgcmVzdWx0cyA9IFtdXG4gICAgICAgICAgICBjb25zdCByd3MgPSBzZXR1cFJlc29sdmVXcml0ZVN0cmVhbVBpcGUocnMpXG4gICAgICAgICAgICByd3MuYWRkVG9SZXNvbHZlTWFwKGNvbW1hbmROdW1iZXIsIChkYXRhKSA9PiByZXN1bHRzLnB1c2goZGF0YSkpXG4gICAgICAgICAgICByd3MuYWRkVG9SZXNvbHZlTWFwKGNvbW1hbmROdW1iZXIyLCAoZGF0YSkgPT4gcmVzdWx0cy5wdXNoKGRhdGEpKVxuICAgICAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKHJlc29sdmUgPT4gcndzLm9uKCdmaW5pc2gnLCByZXNvbHZlKSlcbiAgICAgICAgICAgICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGFzc2VydC5lcXVhbChyZXN1bHRzLmxlbmd0aCwgMilcbiAgICAgICAgICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHJlc3VsdHNbMF0sIGRhdGEpXG4gICAgICAgICAgICAgICAgICAgIGFzc2VydC5lcXVhbChyZXN1bHRzWzFdLCBkYXRhMilcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICB9LFxuICAgIH0sXG59XG5cbm1vZHVsZS5leHBvcnRzID0gYnJ0c1Rlc3RTdWl0ZVxuIl19