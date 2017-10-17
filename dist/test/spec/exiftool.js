'use strict';

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

require('source-map-support/register');

var _require = require('os'),
    EOL = _require.EOL;

var assert = require('assert');
var child_process = require('child_process');
var context = require('exiftool-context');
var exiftool = require('../../src/');
context.globalExiftoolConstructor = exiftool.ExiftoolProcess;

var ChildProcess = child_process.ChildProcess;


var exiftoolTestSuite = {
    context: context,
    open: {
        'opens exiftool': function opensExiftool(ctx) {
            return ctx.createOpen().then(function (pid) {
                assert(ctx.ep._process instanceof ChildProcess);
                assert(ctx.ep._process.stdout.readable);
                assert(ctx.ep._process.stderr.readable);
                assert(ctx.ep._process.stdin.writable);
                assert(ctx.ep.isOpen);
                assert.equal(typeof pid === 'undefined' ? 'undefined' : _typeof(pid), 'number');
                assert.equal(pid, ctx.ep._process.pid);
            });
        },
        'returns rejected promise when exiftool executable not found': function returnsRejectedPromiseWhenExiftoolExecutableNotFound(ctx) {
            return ctx.createOpen('notexiftool').then(function () {
                throw new Error('open should have resulted in error');
            }, function (err) {
                assert.equal(err.message, 'spawn notexiftool ENOENT');
            });
        },
        'emits OPEN event with PID': function emitsOPENEventWithPID(ctx) {
            ctx.create();
            var eventPromise = new Promise(function (resolve) {
                return ctx.ep.on(exiftool.events.OPEN, resolve);
            });
            return ctx.open().then(function () {
                return eventPromise;
            }).then(function (pid) {
                return assert.equal(pid, ctx.ep._process.pid);
            });
        },
        'returns rejected promise when process is open already': function returnsRejectedPromiseWhenProcessIsOpenAlready(ctx) {
            return ctx.createOpen().then(function () {
                return ctx.open();
            }).then(function () {
                throw new Error('second open should have resulted in error');
            }, function (err) {
                assert.equal(err.message, 'Exiftool process is already open');
            });
        }
    },
    close: {
        'closes the process': function closesTheProcess(ctx) {
            return ctx.createOpen().then(function () {
                return ctx.close();
            }).then(function () {
                assert(ctx.ep._process instanceof ChildProcess);
                assert(!ctx.ep._process.stdout.readable);
                assert(!ctx.ep._process.stderr.readable);
                assert(!ctx.ep._process.stdin.writable);
                assert(!ctx.ep.isOpen);
            });
        },
        'updates resolve write streams to be finished': function updatesResolveWriteStreamsToBeFinished(ctx) {
            return ctx.createOpen().then(function () {
                return ctx.close();
            }).then(function () {
                assert(ctx.ep._stdoutResolveWs._writableState.finished);
                assert(ctx.ep._stderrResolveWs._writableState.finished);
            });
        },
        'completes remaining jobs': function completesRemainingJobs(ctx) {
            return ctx.createOpen().then(function () {
                var p = ctx.ep.readMetadata(ctx.jpegFile).then(function (res) {
                    assert(Array.isArray(res.data));
                    assert.equal(res.error, null);
                    res.data.forEach(ctx.assertJpegMetadata);
                });
                var p2 = ctx.ep.readMetadata(ctx.jpegFile2).then(function (res) {
                    assert(Array.isArray(res.data));
                    assert.equal(res.error, null);
                    res.data.forEach(ctx.assertJpegMetadata);
                });
                var readPromises = Promise.all([p, p2]);

                return ctx.close().then(function () {
                    assert(!Object.keys(ctx.ep._stdoutResolveWs._resolveMap).length);
                    assert(!Object.keys(ctx.ep._stderrResolveWs._resolveMap).length);
                }).then(function () {
                    return readPromises;
                });
            });
        },
        'emits EXIT event': function emitsEXITEvent(ctx) {
            ctx.create();
            var eventPromise = new Promise(function (resolve) {
                return ctx.ep.on(exiftool.events.EXIT, resolve);
            });
            return ctx.open().then(function () {
                return ctx.close();
            }).then(function () {
                return eventPromise;
            });
        },
        'sets open to false': function setsOpenToFalse(ctx) {
            return ctx.createOpen().then(function () {
                return ctx.close();
            }).then(function () {
                return assert(!ctx.ep.isOpen);
            });
        },
        'returns rejected promise when process not open': function returnsRejectedPromiseWhenProcessNotOpen(ctx) {
            return ctx.create().close().then(function () {
                throw new Error('close should have resulted in error');
            }, function (err) {
                assert.equal(err.message, 'Exiftool process is not open');
            });
        }
    },
    readMetadata: {
        'returns rejected promise when trying to execute when not open': function returnsRejectedPromiseWhenTryingToExecuteWhenNotOpen(ctx) {
            return ctx.create().readMetadata(ctx.jpegFile).then(function () {
                throw new Error('readMetadata should have resulted in error');
            }).catch(function (err) {
                return assert.equal(err.message, 'exiftool is not open');
            });
        },
        'reads metadata of files in a directory': function readsMetadataOfFilesInADirectory(ctx) {
            return ctx.initAndReadMetadata(ctx.folder).then(function (res) {
                assert(Array.isArray(res.data));
                assert.equal(res.data.length, 5);
                res.data.forEach(ctx.assertJpegMetadata);
                assert.equal(res.error, '1 directories scanned' + EOL + '    5 image files read');
            });
        },
        'returns null data for empty directory and info error': function returnsNullDataForEmptyDirectoryAndInfoError(ctx) {
            return ctx.initAndReadMetadata(ctx.emptyFolder).then(function (res) {
                assert.equal(res.data, null);
                assert.equal(res.error, '1 directories scanned' + EOL + '    0 image files read');
            });
        },
        'allows to specify arguments': function allowsToSpecifyArguments(ctx) {
            return ctx.initAndReadMetadata(ctx.jpegFile, ['Orientation', 'n']).then(function (res) {
                assert.equal(res.error, null);
                assert(Array.isArray(res.data));
                var expected = {
                    SourceFile: ctx.replaceSlashes(ctx.jpegFile),
                    Orientation: 6
                };
                assert.deepEqual(res.data[0], expected);
            });
        },
        'reads metadata of a file': function readsMetadataOfAFile(ctx) {
            return ctx.initAndReadMetadata(ctx.jpegFile).then(function (res) {
                assert.equal(res.error, null);
                assert(Array.isArray(res.data));

                var _res$data = _slicedToArray(res.data, 1),
                    metadata = _res$data[0];

                var expected = {
                    SourceFile: ctx.replaceSlashes(ctx.jpegFile),
                    Directory: ctx.replaceSlashes(ctx.folder),
                    FileName: 'IMG_9858.JPG',
                    FileSize: '52 kB',
                    FileType: 'JPEG',
                    FileTypeExtension: 'jpg',
                    MIMEType: 'image/jpeg',
                    ExifByteOrder: 'Big-endian (Motorola, MM)',
                    Orientation: 'Rotate 90 CW',
                    XResolution: 72,
                    YResolution: 72,
                    ResolutionUnit: 'inches',
                    YCbCrPositioning: 'Centered',
                    XMPToolkit: 'Image::ExifTool 10.40',
                    CreatorWorkURL: 'https://sobesednik.media',
                    Scene: '011200',
                    Creator: 'Photographer Name',
                    ImageWidth: 500,
                    ImageHeight: 334,
                    EncodingProcess: 'Baseline DCT, Huffman coding',
                    BitsPerSample: 8,
                    ColorComponents: 3,
                    YCbCrSubSampling: 'YCbCr4:2:0 (2 2)',
                    ImageSize: '500x334',
                    Megapixels: 0.167
                };
                Object.keys(expected).forEach(function (key) {
                    return assert.equal(metadata[key], expected[key]);
                });
            });
        },
        'returns promise with null data and error when file not found': function returnsPromiseWithNullDataAndErrorWhenFileNotFound(ctx) {
            return ctx.initAndReadMetadata(ctx.fileDoesNotExist).then(function (res) {
                assert.equal(res.data, null);
                assert.equal(res.error, 'File not found: ' + ctx.fileDoesNotExist);
            });
        },
        'works with simultaneous requests': function worksWithSimultaneousRequests(ctx) {
            return ctx.createOpen().then(function () {
                return Promise.all([ctx.ep.readMetadata(ctx.fileDoesNotExist), ctx.ep.readMetadata(ctx.fileDoesNotExist2), ctx.ep.readMetadata(ctx.jpegFile), ctx.ep.readMetadata(ctx.jpegFile2)]);
            }).then(function (res) {
                assert.equal(res[0].data, null);
                assert.equal(res[0].error, 'File not found: ' + ctx.fileDoesNotExist);

                assert.equal(res[1].data, null);
                assert.equal(res[1].error, 'File not found: ' + ctx.fileDoesNotExist2);

                assert(Array.isArray(res[2].data));
                assert.equal(res[2].error, null);
                res[2].data.forEach(ctx.assertJpegMetadata);

                assert(Array.isArray(res[3].data));
                assert.equal(res[3].error, null);
                res[3].data.forEach(ctx.assertJpegMetadata);
            });
        }
    },
    writeMetadata: {
        'returns rejected promise when trying to execute when not open': function returnsRejectedPromiseWhenTryingToExecuteWhenNotOpen(ctx) {
            return ctx.create().writeMetadata('/temp-file', { comment: 'test-comment' }, ['overwrite_original']).then(function () {
                throw new Error('writeMetadata should have resulted in error');
            }).catch(function (err) {
                return assert.equal(err.message, 'exiftool is not open');
            });
        },
        'should return rejected promise when data is not an object': function shouldReturnRejectedPromiseWhenDataIsNotAnObject(ctx) {
            return ctx.initAndWriteMetadata('file_path').then(function () {
                throw new Error('writeMetadata should have resulted in error');
            }, function (err) {
                assert.equal(err.message, 'Data argument is not an object');
            });
        },
        'should write metadata': function shouldWriteMetadata(ctx) {
            var keywords = ['keywordA', 'keywordB'];
            var comment = 'hello world';
            var data = {
                all: '',
                comment: comment, // has to come after all in order not to be removed
                'Keywords+': keywords
            };
            return ctx.createTempFile().then(function () {
                return ctx.initAndWriteMetadata(ctx.tempFile, data, ['overwrite_original']);
            }).then(function (res) {
                assert.equal(res.data, null);
                assert.equal(res.error, '1 image files updated');
            }).then(function () {
                return ctx.ep.readMetadata(ctx.tempFile);
            }).then(function (res) {
                assert(Array.isArray(res.data));
                assert.equal(res.error, null);

                var _res$data2 = _slicedToArray(res.data, 1),
                    metadata = _res$data2[0];

                assert.equal(metadata.Keywords.length, keywords.length);
                metadata.Keywords.forEach(function (keyword, index) {
                    assert.equal(keyword, keywords[index]);
                });
                assert.equal(metadata.Comment, comment);
                assert.equal(metadata.Scene, undefined); // should be removed with -all=
            });
        }
    }
};

module.exports = exiftoolTestSuite;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3Rlc3Qvc3BlYy9leGlmdG9vbC5qcyJdLCJuYW1lcyI6WyJyZXF1aXJlIiwiRU9MIiwiYXNzZXJ0IiwiY2hpbGRfcHJvY2VzcyIsImNvbnRleHQiLCJleGlmdG9vbCIsImdsb2JhbEV4aWZ0b29sQ29uc3RydWN0b3IiLCJFeGlmdG9vbFByb2Nlc3MiLCJDaGlsZFByb2Nlc3MiLCJleGlmdG9vbFRlc3RTdWl0ZSIsIm9wZW4iLCJjdHgiLCJjcmVhdGVPcGVuIiwidGhlbiIsInBpZCIsImVwIiwiX3Byb2Nlc3MiLCJzdGRvdXQiLCJyZWFkYWJsZSIsInN0ZGVyciIsInN0ZGluIiwid3JpdGFibGUiLCJpc09wZW4iLCJlcXVhbCIsIkVycm9yIiwiZXJyIiwibWVzc2FnZSIsImNyZWF0ZSIsImV2ZW50UHJvbWlzZSIsIlByb21pc2UiLCJvbiIsImV2ZW50cyIsIk9QRU4iLCJyZXNvbHZlIiwiY2xvc2UiLCJfc3Rkb3V0UmVzb2x2ZVdzIiwiX3dyaXRhYmxlU3RhdGUiLCJmaW5pc2hlZCIsIl9zdGRlcnJSZXNvbHZlV3MiLCJwIiwicmVhZE1ldGFkYXRhIiwianBlZ0ZpbGUiLCJyZXMiLCJBcnJheSIsImlzQXJyYXkiLCJkYXRhIiwiZXJyb3IiLCJmb3JFYWNoIiwiYXNzZXJ0SnBlZ01ldGFkYXRhIiwicDIiLCJqcGVnRmlsZTIiLCJyZWFkUHJvbWlzZXMiLCJhbGwiLCJPYmplY3QiLCJrZXlzIiwiX3Jlc29sdmVNYXAiLCJsZW5ndGgiLCJFWElUIiwiY2F0Y2giLCJpbml0QW5kUmVhZE1ldGFkYXRhIiwiZm9sZGVyIiwiZW1wdHlGb2xkZXIiLCJleHBlY3RlZCIsIlNvdXJjZUZpbGUiLCJyZXBsYWNlU2xhc2hlcyIsIk9yaWVudGF0aW9uIiwiZGVlcEVxdWFsIiwibWV0YWRhdGEiLCJEaXJlY3RvcnkiLCJGaWxlTmFtZSIsIkZpbGVTaXplIiwiRmlsZVR5cGUiLCJGaWxlVHlwZUV4dGVuc2lvbiIsIk1JTUVUeXBlIiwiRXhpZkJ5dGVPcmRlciIsIlhSZXNvbHV0aW9uIiwiWVJlc29sdXRpb24iLCJSZXNvbHV0aW9uVW5pdCIsIllDYkNyUG9zaXRpb25pbmciLCJYTVBUb29sa2l0IiwiQ3JlYXRvcldvcmtVUkwiLCJTY2VuZSIsIkNyZWF0b3IiLCJJbWFnZVdpZHRoIiwiSW1hZ2VIZWlnaHQiLCJFbmNvZGluZ1Byb2Nlc3MiLCJCaXRzUGVyU2FtcGxlIiwiQ29sb3JDb21wb25lbnRzIiwiWUNiQ3JTdWJTYW1wbGluZyIsIkltYWdlU2l6ZSIsIk1lZ2FwaXhlbHMiLCJrZXkiLCJmaWxlRG9lc05vdEV4aXN0IiwiZmlsZURvZXNOb3RFeGlzdDIiLCJ3cml0ZU1ldGFkYXRhIiwiY29tbWVudCIsImluaXRBbmRXcml0ZU1ldGFkYXRhIiwia2V5d29yZHMiLCJjcmVhdGVUZW1wRmlsZSIsInRlbXBGaWxlIiwiS2V5d29yZHMiLCJrZXl3b3JkIiwiaW5kZXgiLCJDb21tZW50IiwidW5kZWZpbmVkIiwibW9kdWxlIiwiZXhwb3J0cyJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7ZUFBZ0JBLFFBQVEsSUFBUixDO0lBQVJDLEcsWUFBQUEsRzs7QUFDUixJQUFNQyxTQUFTRixRQUFRLFFBQVIsQ0FBZjtBQUNBLElBQU1HLGdCQUFnQkgsUUFBUSxlQUFSLENBQXRCO0FBQ0EsSUFBTUksVUFBVUosUUFBUSxrQkFBUixDQUFoQjtBQUNBLElBQU1LLFdBQVdMLFFBQVEsWUFBUixDQUFqQjtBQUNBSSxRQUFRRSx5QkFBUixHQUFvQ0QsU0FBU0UsZUFBN0M7O0lBRVFDLFksR0FBaUJMLGEsQ0FBakJLLFk7OztBQUVSLElBQU1DLG9CQUFvQjtBQUN0Qkwsb0JBRHNCO0FBRXRCTSxVQUFNO0FBQ0YsMEJBQWtCLHVCQUFDQyxHQUFELEVBQVM7QUFDdkIsbUJBQU9BLElBQUlDLFVBQUosR0FDRkMsSUFERSxDQUNHLFVBQUNDLEdBQUQsRUFBUztBQUNYWix1QkFBT1MsSUFBSUksRUFBSixDQUFPQyxRQUFQLFlBQTJCUixZQUFsQztBQUNBTix1QkFBT1MsSUFBSUksRUFBSixDQUFP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aUJBQWpCIiwiZmlsZSI6ImV4aWZ0b29sLmpzIiwic291cmNlc0NvbnRlbnQiOlsiY29uc3QgeyBFT0wgfSA9IHJlcXVpcmUoJ29zJylcbmNvbnN0IGFzc2VydCA9IHJlcXVpcmUoJ2Fzc2VydCcpXG5jb25zdCBjaGlsZF9wcm9jZXNzID0gcmVxdWlyZSgnY2hpbGRfcHJvY2VzcycpXG5jb25zdCBjb250ZXh0ID0gcmVxdWlyZSgnZXhpZnRvb2wtY29udGV4dCcpXG5jb25zdCBleGlmdG9vbCA9IHJlcXVpcmUoJy4uLy4uL3NyYy8nKVxuY29udGV4dC5nbG9iYWxFeGlmdG9vbENvbnN0cnVjdG9yID0gZXhpZnRvb2wuRXhpZnRvb2xQcm9jZXNzXG5cbmNvbnN0IHsgQ2hpbGRQcm9jZXNzIH0gPSBjaGlsZF9wcm9jZXNzXG5cbmNvbnN0IGV4aWZ0b29sVGVzdFN1aXRlID0ge1xuICAgIGNvbnRleHQsXG4gICAgb3Blbjoge1xuICAgICAgICAnb3BlbnMgZXhpZnRvb2wnOiAoY3R4KSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gY3R4LmNyZWF0ZU9wZW4oKVxuICAgICAgICAgICAgICAgIC50aGVuKChwaWQpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgYXNzZXJ0KGN0eC5lcC5fcHJvY2VzcyBpbnN0YW5jZW9mIENoaWxkUHJvY2VzcylcbiAgICAgICAgICAgICAgICAgICAgYXNzZXJ0KGN0eC5lcC5fcHJvY2Vzcy5zdGRvdXQucmVhZGFibGUpXG4gICAgICAgICAgICAgICAgICAgIGFzc2VydChjdHguZXAuX3Byb2Nlc3Muc3RkZXJyLnJlYWRhYmxlKVxuICAgICAgICAgICAgICAgICAgICBhc3NlcnQoY3R4LmVwLl9wcm9jZXNzLnN0ZGluLndyaXRhYmxlKVxuICAgICAgICAgICAgICAgICAgICBhc3NlcnQoY3R4LmVwLmlzT3BlbilcbiAgICAgICAgICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHR5cGVvZiBwaWQsICdudW1iZXInKVxuICAgICAgICAgICAgICAgICAgICBhc3NlcnQuZXF1YWwocGlkLCBjdHguZXAuX3Byb2Nlc3MucGlkKVxuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgIH0sXG4gICAgICAgICdyZXR1cm5zIHJlamVjdGVkIHByb21pc2Ugd2hlbiBleGlmdG9vbCBleGVjdXRhYmxlIG5vdCBmb3VuZCc6IChjdHgpID0+IHtcbiAgICAgICAgICAgIHJldHVybiBjdHguY3JlYXRlT3Blbignbm90ZXhpZnRvb2wnKVxuICAgICAgICAgICAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdvcGVuIHNob3VsZCBoYXZlIHJlc3VsdGVkIGluIGVycm9yJylcbiAgICAgICAgICAgICAgICB9LCAoZXJyKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGFzc2VydC5lcXVhbChlcnIubWVzc2FnZSwgJ3NwYXduIG5vdGV4aWZ0b29sIEVOT0VOVCcpXG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgfSxcbiAgICAgICAgJ2VtaXRzIE9QRU4gZXZlbnQgd2l0aCBQSUQnOiAoY3R4KSA9PiB7XG4gICAgICAgICAgICBjdHguY3JlYXRlKClcbiAgICAgICAgICAgIGNvbnN0IGV2ZW50UHJvbWlzZSA9IG5ldyBQcm9taXNlKHJlc29sdmUgPT5cbiAgICAgICAgICAgICAgICBjdHguZXAub24oZXhpZnRvb2wuZXZlbnRzLk9QRU4sIHJlc29sdmUpXG4gICAgICAgICAgICApXG4gICAgICAgICAgICByZXR1cm4gY3R4Lm9wZW4oKVxuICAgICAgICAgICAgICAgIC50aGVuKCgpID0+IGV2ZW50UHJvbWlzZSlcbiAgICAgICAgICAgICAgICAudGhlbihwaWQgPT4gYXNzZXJ0LmVxdWFsKHBpZCwgY3R4LmVwLl9wcm9jZXNzLnBpZCkpXG4gICAgICAgIH0sXG4gICAgICAgICdyZXR1cm5zIHJlamVjdGVkIHByb21pc2Ugd2hlbiBwcm9jZXNzIGlzIG9wZW4gYWxyZWFkeSc6IChjdHgpID0+IHtcbiAgICAgICAgICAgIHJldHVybiBjdHguY3JlYXRlT3BlbigpXG4gICAgICAgICAgICAgICAgLnRoZW4oKCkgPT4gY3R4Lm9wZW4oKSlcbiAgICAgICAgICAgICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignc2Vjb25kIG9wZW4gc2hvdWxkIGhhdmUgcmVzdWx0ZWQgaW4gZXJyb3InKVxuICAgICAgICAgICAgICAgIH0sIChlcnIpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKGVyci5tZXNzYWdlLCAnRXhpZnRvb2wgcHJvY2VzcyBpcyBhbHJlYWR5IG9wZW4nKVxuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgIH0sXG4gICAgfSxcbiAgICBjbG9zZToge1xuICAgICAgICAnY2xvc2VzIHRoZSBwcm9jZXNzJzogKGN0eCkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIGN0eC5jcmVhdGVPcGVuKClcbiAgICAgICAgICAgICAgICAudGhlbigoKSA9PiBjdHguY2xvc2UoKSlcbiAgICAgICAgICAgICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGFzc2VydChjdHguZXAuX3Byb2Nlc3MgaW5zdGFuY2VvZiBDaGlsZFByb2Nlc3MpXG4gICAgICAgICAgICAgICAgICAgIGFzc2VydCghY3R4LmVwLl9wcm9jZXNzLnN0ZG91dC5yZWFkYWJsZSlcbiAgICAgICAgICAgICAgICAgICAgYXNzZXJ0KCFjdHguZXAuX3Byb2Nlc3Muc3RkZXJyLnJlYWRhYmxlKVxuICAgICAgICAgICAgICAgICAgICBhc3NlcnQoIWN0eC5lcC5fcHJvY2Vzcy5zdGRpbi53cml0YWJsZSlcbiAgICAgICAgICAgICAgICAgICAgYXNzZXJ0KCFjdHguZXAuaXNPcGVuKVxuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgIH0sXG4gICAgICAgICd1cGRhdGVzIHJlc29sdmUgd3JpdGUgc3RyZWFtcyB0byBiZSBmaW5pc2hlZCc6IChjdHgpID0+IHtcbiAgICAgICAgICAgIHJldHVybiBjdHguY3JlYXRlT3BlbigpXG4gICAgICAgICAgICAgICAgLnRoZW4oKCkgPT4gY3R4LmNsb3NlKCkpXG4gICAgICAgICAgICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBhc3NlcnQoY3R4LmVwLl9zdGRvdXRSZXNvbHZlV3MuX3dyaXRhYmxlU3RhdGUuZmluaXNoZWQpXG4gICAgICAgICAgICAgICAgICAgIGFzc2VydChjdHguZXAuX3N0ZGVyclJlc29sdmVXcy5fd3JpdGFibGVTdGF0ZS5maW5pc2hlZClcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICB9LFxuICAgICAgICAnY29tcGxldGVzIHJlbWFpbmluZyBqb2JzJzogKGN0eCkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIGN0eC5jcmVhdGVPcGVuKClcbiAgICAgICAgICAgICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHAgPSBjdHguZXBcbiAgICAgICAgICAgICAgICAgICAgICAgIC5yZWFkTWV0YWRhdGEoY3R4LmpwZWdGaWxlKVxuICAgICAgICAgICAgICAgICAgICAgICAgLnRoZW4oKHJlcykgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFzc2VydChBcnJheS5pc0FycmF5KHJlcy5kYXRhKSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhc3NlcnQuZXF1YWwocmVzLmVycm9yLCBudWxsKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlcy5kYXRhLmZvckVhY2goY3R4LmFzc2VydEpwZWdNZXRhZGF0YSlcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHAyID0gY3R4LmVwXG4gICAgICAgICAgICAgICAgICAgICAgICAucmVhZE1ldGFkYXRhKGN0eC5qcGVnRmlsZTIpXG4gICAgICAgICAgICAgICAgICAgICAgICAudGhlbigocmVzKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYXNzZXJ0KEFycmF5LmlzQXJyYXkocmVzLmRhdGEpKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFzc2VydC5lcXVhbChyZXMuZXJyb3IsIG51bGwpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzLmRhdGEuZm9yRWFjaChjdHguYXNzZXJ0SnBlZ01ldGFkYXRhKVxuICAgICAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcmVhZFByb21pc2VzID0gUHJvbWlzZS5hbGwoW3AsIHAyXSlcblxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gY3R4LmNsb3NlKClcbiAgICAgICAgICAgICAgICAgICAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhc3NlcnQoIU9iamVjdC5rZXlzKGN0eC5lcC5fc3Rkb3V0UmVzb2x2ZVdzLl9yZXNvbHZlTWFwKS5sZW5ndGgpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYXNzZXJ0KCFPYmplY3Qua2V5cyhjdHguZXAuX3N0ZGVyclJlc29sdmVXcy5fcmVzb2x2ZU1hcCkubGVuZ3RoKVxuICAgICAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAgICAgICAgIC50aGVuKCgpID0+IHJlYWRQcm9taXNlcylcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICB9LFxuICAgICAgICAnZW1pdHMgRVhJVCBldmVudCc6IChjdHgpID0+IHtcbiAgICAgICAgICAgIGN0eC5jcmVhdGUoKVxuICAgICAgICAgICAgY29uc3QgZXZlbnRQcm9taXNlID0gbmV3IFByb21pc2UocmVzb2x2ZSA9PlxuICAgICAgICAgICAgICAgIGN0eC5lcC5vbihleGlmdG9vbC5ldmVudHMuRVhJVCwgcmVzb2x2ZSlcbiAgICAgICAgICAgIClcbiAgICAgICAgICAgIHJldHVybiBjdHgub3BlbigpXG4gICAgICAgICAgICAgICAgLnRoZW4oKCkgPT4gY3R4LmNsb3NlKCkpXG4gICAgICAgICAgICAgICAgLnRoZW4oKCkgPT4gZXZlbnRQcm9taXNlKVxuICAgICAgICB9LFxuICAgICAgICAnc2V0cyBvcGVuIHRvIGZhbHNlJzogKGN0eCkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIGN0eC5jcmVhdGVPcGVuKClcbiAgICAgICAgICAgICAgICAudGhlbigoKSA9PiBjdHguY2xvc2UoKSlcbiAgICAgICAgICAgICAgICAudGhlbigoKSA9PiBhc3NlcnQoIWN0eC5lcC5pc09wZW4pKVxuICAgICAgICB9LFxuICAgICAgICAncmV0dXJucyByZWplY3RlZCBwcm9taXNlIHdoZW4gcHJvY2VzcyBub3Qgb3Blbic6IChjdHgpID0+IHtcbiAgICAgICAgICAgIHJldHVybiBjdHguY3JlYXRlKClcbiAgICAgICAgICAgICAgICAuY2xvc2UoKVxuICAgICAgICAgICAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdjbG9zZSBzaG91bGQgaGF2ZSByZXN1bHRlZCBpbiBlcnJvcicpXG4gICAgICAgICAgICAgICAgfSwgKGVycikgPT4ge1xuICAgICAgICAgICAgICAgICAgICBhc3NlcnQuZXF1YWwoZXJyLm1lc3NhZ2UsICdFeGlmdG9vbCBwcm9jZXNzIGlzIG5vdCBvcGVuJylcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICB9LFxuICAgIH0sXG4gICAgcmVhZE1ldGFkYXRhOiB7XG4gICAgICAgICdyZXR1cm5zIHJlamVjdGVkIHByb21pc2Ugd2hlbiB0cnlpbmcgdG8gZXhlY3V0ZSB3aGVuIG5vdCBvcGVuJzogKGN0eCkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIGN0eC5jcmVhdGUoKVxuICAgICAgICAgICAgICAgIC5yZWFkTWV0YWRhdGEoY3R4LmpwZWdGaWxlKVxuICAgICAgICAgICAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdyZWFkTWV0YWRhdGEgc2hvdWxkIGhhdmUgcmVzdWx0ZWQgaW4gZXJyb3InKVxuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgLmNhdGNoKGVyciA9PiBhc3NlcnQuZXF1YWwoZXJyLm1lc3NhZ2UsICdleGlmdG9vbCBpcyBub3Qgb3BlbicpKVxuICAgICAgICB9LFxuICAgICAgICAncmVhZHMgbWV0YWRhdGEgb2YgZmlsZXMgaW4gYSBkaXJlY3RvcnknOiAoY3R4KSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gY3R4LmluaXRBbmRSZWFkTWV0YWRhdGEoY3R4LmZvbGRlcilcbiAgICAgICAgICAgICAgICAudGhlbigocmVzKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGFzc2VydChBcnJheS5pc0FycmF5KHJlcy5kYXRhKSlcbiAgICAgICAgICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHJlcy5kYXRhLmxlbmd0aCwgNSlcbiAgICAgICAgICAgICAgICAgICAgcmVzLmRhdGEuZm9yRWFjaChjdHguYXNzZXJ0SnBlZ01ldGFkYXRhKVxuICAgICAgICAgICAgICAgICAgICBhc3NlcnQuZXF1YWwocmVzLmVycm9yLCBgMSBkaXJlY3RvcmllcyBzY2FubmVkJHtFT0x9ICAgIDUgaW1hZ2UgZmlsZXMgcmVhZGApXG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgfSxcbiAgICAgICAgJ3JldHVybnMgbnVsbCBkYXRhIGZvciBlbXB0eSBkaXJlY3RvcnkgYW5kIGluZm8gZXJyb3InOiAoY3R4KSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gY3R4LmluaXRBbmRSZWFkTWV0YWRhdGEoY3R4LmVtcHR5Rm9sZGVyKVxuICAgICAgICAgICAgICAgIC50aGVuKChyZXMpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHJlcy5kYXRhLCBudWxsKVxuICAgICAgICAgICAgICAgICAgICBhc3NlcnQuZXF1YWwocmVzLmVycm9yLCBgMSBkaXJlY3RvcmllcyBzY2FubmVkJHtFT0x9ICAgIDAgaW1hZ2UgZmlsZXMgcmVhZGApXG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgfSxcbiAgICAgICAgJ2FsbG93cyB0byBzcGVjaWZ5IGFyZ3VtZW50cyc6IChjdHgpID0+IHtcbiAgICAgICAgICAgIHJldHVybiBjdHguaW5pdEFuZFJlYWRNZXRhZGF0YShjdHguanBlZ0ZpbGUsIFsnT3JpZW50YXRpb24nLCAnbiddKVxuICAgICAgICAgICAgICAgIC50aGVuKChyZXMpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHJlcy5lcnJvciwgbnVsbClcbiAgICAgICAgICAgICAgICAgICAgYXNzZXJ0KEFycmF5LmlzQXJyYXkocmVzLmRhdGEpKVxuICAgICAgICAgICAgICAgICAgICBjb25zdCBleHBlY3RlZCA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIFNvdXJjZUZpbGU6IGN0eC5yZXBsYWNlU2xhc2hlcyhjdHguanBlZ0ZpbGUpLFxuICAgICAgICAgICAgICAgICAgICAgICAgT3JpZW50YXRpb246IDYsXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgYXNzZXJ0LmRlZXBFcXVhbChyZXMuZGF0YVswXSwgZXhwZWN0ZWQpXG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgfSxcbiAgICAgICAgJ3JlYWRzIG1ldGFkYXRhIG9mIGEgZmlsZSc6IChjdHgpID0+IHtcbiAgICAgICAgICAgIHJldHVybiBjdHguaW5pdEFuZFJlYWRNZXRhZGF0YShjdHguanBlZ0ZpbGUpXG4gICAgICAgICAgICAgICAgLnRoZW4oKHJlcykgPT4ge1xuICAgICAgICAgICAgICAgICAgICBhc3NlcnQuZXF1YWwocmVzLmVycm9yLCBudWxsKVxuICAgICAgICAgICAgICAgICAgICBhc3NlcnQoQXJyYXkuaXNBcnJheShyZXMuZGF0YSkpXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHsgZGF0YTogW21ldGFkYXRhXSB9ID0gcmVzXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGV4cGVjdGVkID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgU291cmNlRmlsZTogY3R4LnJlcGxhY2VTbGFzaGVzKGN0eC5qcGVnRmlsZSksXG4gICAgICAgICAgICAgICAgICAgICAgICBEaXJlY3Rvcnk6IGN0eC5yZXBsYWNlU2xhc2hlcyhjdHguZm9sZGVyKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIEZpbGVOYW1lOiAnSU1HXzk4NTguSlBHJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIEZpbGVTaXplOiAnNTIga0InLFxuICAgICAgICAgICAgICAgICAgICAgICAgRmlsZVR5cGU6ICdKUEVHJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIEZpbGVUeXBlRXh0ZW5zaW9uOiAnanBnJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIE1JTUVUeXBlOiAnaW1hZ2UvanBlZycsXG4gICAgICAgICAgICAgICAgICAgICAgICBFeGlmQnl0ZU9yZGVyOiAnQmlnLWVuZGlhbiAoTW90b3JvbGEsIE1NKScsXG4gICAgICAgICAgICAgICAgICAgICAgICBPcmllbnRhdGlvbjogJ1JvdGF0ZSA5MCBDVycsXG4gICAgICAgICAgICAgICAgICAgICAgICBYUmVzb2x1dGlvbjogNzIsXG4gICAgICAgICAgICAgICAgICAgICAgICBZUmVzb2x1dGlvbjogNzIsXG4gICAgICAgICAgICAgICAgICAgICAgICBSZXNvbHV0aW9uVW5pdDogJ2luY2hlcycsXG4gICAgICAgICAgICAgICAgICAgICAgICBZQ2JDclBvc2l0aW9uaW5nOiAnQ2VudGVyZWQnLFxuICAgICAgICAgICAgICAgICAgICAgICAgWE1QVG9vbGtpdDogJ0ltYWdlOjpFeGlmVG9vbCAxMC40MCcsXG4gICAgICAgICAgICAgICAgICAgICAgICBDcmVhdG9yV29ya1VSTDogJ2h0dHBzOi8vc29iZXNlZG5pay5tZWRpYScsXG4gICAgICAgICAgICAgICAgICAgICAgICBTY2VuZTogJzAxMTIwMCcsXG4gICAgICAgICAgICAgICAgICAgICAgICBDcmVhdG9yOiAnUGhvdG9ncmFwaGVyIE5hbWUnLFxuICAgICAgICAgICAgICAgICAgICAgICAgSW1hZ2VXaWR0aDogNTAwLFxuICAgICAgICAgICAgICAgICAgICAgICAgSW1hZ2VIZWlnaHQ6IDMzNCxcbiAgICAgICAgICAgICAgICAgICAgICAgIEVuY29kaW5nUHJvY2VzczogJ0Jhc2VsaW5lIERDVCwgSHVmZm1hbiBjb2RpbmcnLFxuICAgICAgICAgICAgICAgICAgICAgICAgQml0c1BlclNhbXBsZTogOCxcbiAgICAgICAgICAgICAgICAgICAgICAgIENvbG9yQ29tcG9uZW50czogMyxcbiAgICAgICAgICAgICAgICAgICAgICAgIFlDYkNyU3ViU2FtcGxpbmc6ICdZQ2JDcjQ6MjowICgyIDIpJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIEltYWdlU2l6ZTogJzUwMHgzMzQnLFxuICAgICAgICAgICAgICAgICAgICAgICAgTWVnYXBpeGVsczogMC4xNjcsXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgT2JqZWN0XG4gICAgICAgICAgICAgICAgICAgICAgICAua2V5cyhleHBlY3RlZClcbiAgICAgICAgICAgICAgICAgICAgICAgIC5mb3JFYWNoKGtleSA9PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFzc2VydC5lcXVhbChtZXRhZGF0YVtrZXldLCBleHBlY3RlZFtrZXldKVxuICAgICAgICAgICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgIH0sXG4gICAgICAgICdyZXR1cm5zIHByb21pc2Ugd2l0aCBudWxsIGRhdGEgYW5kIGVycm9yIHdoZW4gZmlsZSBub3QgZm91bmQnOiAoY3R4KSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gY3R4LmluaXRBbmRSZWFkTWV0YWRhdGEoY3R4LmZpbGVEb2VzTm90RXhpc3QpXG4gICAgICAgICAgICAgICAgLnRoZW4oKHJlcykgPT4ge1xuICAgICAgICAgICAgICAgICAgICBhc3NlcnQuZXF1YWwocmVzLmRhdGEsIG51bGwpXG4gICAgICAgICAgICAgICAgICAgIGFzc2VydC5lcXVhbChyZXMuZXJyb3IsIGBGaWxlIG5vdCBmb3VuZDogJHtjdHguZmlsZURvZXNOb3RFeGlzdH1gKVxuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgIH0sXG4gICAgICAgICd3b3JrcyB3aXRoIHNpbXVsdGFuZW91cyByZXF1ZXN0cyc6IChjdHgpID0+IHtcbiAgICAgICAgICAgIHJldHVybiBjdHguY3JlYXRlT3BlbigpXG4gICAgICAgICAgICAgICAgLnRoZW4oKCkgPT4gUHJvbWlzZS5hbGwoW1xuICAgICAgICAgICAgICAgICAgICBjdHguZXAucmVhZE1ldGFkYXRhKGN0eC5maWxlRG9lc05vdEV4aXN0KSxcbiAgICAgICAgICAgICAgICAgICAgY3R4LmVwLnJlYWRNZXRhZGF0YShjdHguZmlsZURvZXNOb3RFeGlzdDIpLFxuICAgICAgICAgICAgICAgICAgICBjdHguZXAucmVhZE1ldGFkYXRhKGN0eC5qcGVnRmlsZSksXG4gICAgICAgICAgICAgICAgICAgIGN0eC5lcC5yZWFkTWV0YWRhdGEoY3R4LmpwZWdGaWxlMiksXG4gICAgICAgICAgICAgICAgXSkpXG4gICAgICAgICAgICAgICAgLnRoZW4oKHJlcykgPT4ge1xuICAgICAgICAgICAgICAgICAgICBhc3NlcnQuZXF1YWwocmVzWzBdLmRhdGEsIG51bGwpXG4gICAgICAgICAgICAgICAgICAgIGFzc2VydC5lcXVhbChyZXNbMF0uZXJyb3IsIGBGaWxlIG5vdCBmb3VuZDogJHtjdHguZmlsZURvZXNOb3RFeGlzdH1gKVxuXG4gICAgICAgICAgICAgICAgICAgIGFzc2VydC5lcXVhbChyZXNbMV0uZGF0YSwgbnVsbClcbiAgICAgICAgICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHJlc1sxXS5lcnJvciwgYEZpbGUgbm90IGZvdW5kOiAke2N0eC5maWxlRG9lc05vdEV4aXN0Mn1gKVxuXG4gICAgICAgICAgICAgICAgICAgIGFzc2VydChBcnJheS5pc0FycmF5KHJlc1syXS5kYXRhKSlcbiAgICAgICAgICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHJlc1syXS5lcnJvciwgbnVsbClcbiAgICAgICAgICAgICAgICAgICAgcmVzWzJdLmRhdGEuZm9yRWFjaChjdHguYXNzZXJ0SnBlZ01ldGFkYXRhKVxuXG4gICAgICAgICAgICAgICAgICAgIGFzc2VydChBcnJheS5pc0FycmF5KHJlc1szXS5kYXRhKSlcbiAgICAgICAgICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHJlc1szXS5lcnJvciwgbnVsbClcbiAgICAgICAgICAgICAgICAgICAgcmVzWzNdLmRhdGEuZm9yRWFjaChjdHguYXNzZXJ0SnBlZ01ldGFkYXRhKVxuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgIH0sXG4gICAgfSxcbiAgICB3cml0ZU1ldGFkYXRhOiB7XG4gICAgICAgICdyZXR1cm5zIHJlamVjdGVkIHByb21pc2Ugd2hlbiB0cnlpbmcgdG8gZXhlY3V0ZSB3aGVuIG5vdCBvcGVuJzogKGN0eCkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIGN0eC5jcmVhdGUoKVxuICAgICAgICAgICAgICAgIC53cml0ZU1ldGFkYXRhKCcvdGVtcC1maWxlJywgeyBjb21tZW50OiAndGVzdC1jb21tZW50JyB9LCBbJ292ZXJ3cml0ZV9vcmlnaW5hbCddKVxuICAgICAgICAgICAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCd3cml0ZU1ldGFkYXRhIHNob3VsZCBoYXZlIHJlc3VsdGVkIGluIGVycm9yJylcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIC5jYXRjaChlcnIgPT4gYXNzZXJ0LmVxdWFsKGVyci5tZXNzYWdlLCAnZXhpZnRvb2wgaXMgbm90IG9wZW4nKSlcbiAgICAgICAgfSxcbiAgICAgICAgJ3Nob3VsZCByZXR1cm4gcmVqZWN0ZWQgcHJvbWlzZSB3aGVuIGRhdGEgaXMgbm90IGFuIG9iamVjdCc6IChjdHgpID0+IHtcbiAgICAgICAgICAgIHJldHVybiBjdHguaW5pdEFuZFdyaXRlTWV0YWRhdGEoJ2ZpbGVfcGF0aCcpXG4gICAgICAgICAgICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ3dyaXRlTWV0YWRhdGEgc2hvdWxkIGhhdmUgcmVzdWx0ZWQgaW4gZXJyb3InKVxuICAgICAgICAgICAgICAgIH0sIChlcnIpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKGVyci5tZXNzYWdlLCAnRGF0YSBhcmd1bWVudCBpcyBub3QgYW4gb2JqZWN0JylcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICB9LFxuICAgICAgICAnc2hvdWxkIHdyaXRlIG1ldGFkYXRhJzogKGN0eCkgPT4ge1xuICAgICAgICAgICAgY29uc3Qga2V5d29yZHMgPSBbICdrZXl3b3JkQScsICdrZXl3b3JkQicgXVxuICAgICAgICAgICAgY29uc3QgY29tbWVudCA9ICdoZWxsbyB3b3JsZCdcbiAgICAgICAgICAgIGNvbnN0IGRhdGEgPSB7XG4gICAgICAgICAgICAgICAgYWxsOiAnJyxcbiAgICAgICAgICAgICAgICBjb21tZW50LCAvLyBoYXMgdG8gY29tZSBhZnRlciBhbGwgaW4gb3JkZXIgbm90IHRvIGJlIHJlbW92ZWRcbiAgICAgICAgICAgICAgICAnS2V5d29yZHMrJzoga2V5d29yZHMsXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gY3R4LmNyZWF0ZVRlbXBGaWxlKClcbiAgICAgICAgICAgICAgICAudGhlbigoKSA9PiBjdHguaW5pdEFuZFdyaXRlTWV0YWRhdGEoY3R4LnRlbXBGaWxlLCBkYXRhLCBbJ292ZXJ3cml0ZV9vcmlnaW5hbCddKSlcbiAgICAgICAgICAgICAgICAudGhlbigocmVzKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGFzc2VydC5lcXVhbChyZXMuZGF0YSwgbnVsbClcbiAgICAgICAgICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHJlcy5lcnJvciwgJzEgaW1hZ2UgZmlsZXMgdXBkYXRlZCcpXG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAudGhlbigoKSA9PiBjdHguZXAucmVhZE1ldGFkYXRhKGN0eC50ZW1wRmlsZSkpXG4gICAgICAgICAgICAgICAgLnRoZW4oKHJlcykgPT4ge1xuICAgICAgICAgICAgICAgICAgICBhc3NlcnQoQXJyYXkuaXNBcnJheShyZXMuZGF0YSkpXG4gICAgICAgICAgICAgICAgICAgIGFzc2VydC5lcXVhbChyZXMuZXJyb3IsIG51bGwpXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHsgZGF0YTogW21ldGFkYXRhXSB9ID0gcmVzXG4gICAgICAgICAgICAgICAgICAgIGFzc2VydC5lcXVhbChtZXRhZGF0YS5LZXl3b3Jkcy5sZW5ndGgsIGtleXdvcmRzLmxlbmd0aClcbiAgICAgICAgICAgICAgICAgICAgbWV0YWRhdGEuS2V5d29yZHMuZm9yRWFjaCgoa2V5d29yZCwgaW5kZXgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFzc2VydC5lcXVhbChrZXl3b3JkLCBrZXl3b3Jkc1tpbmRleF0pXG4gICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgICAgIGFzc2VydC5lcXVhbChtZXRhZGF0YS5Db21tZW50LCBjb21tZW50KVxuICAgICAgICAgICAgICAgICAgICBhc3NlcnQuZXF1YWwobWV0YWRhdGEuU2NlbmUsIHVuZGVmaW5lZCkgLy8gc2hvdWxkIGJlIHJlbW92ZWQgd2l0aCAtYWxsPVxuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgIH0sXG4gICAgfSxcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBleGlmdG9vbFRlc3RTdWl0ZVxuIl19