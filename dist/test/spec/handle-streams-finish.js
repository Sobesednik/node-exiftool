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
    var _ref = _asyncToGenerator(function* (ctx, getOperationPromise, createTempFile) {
        ctx.create();
        if (createTempFile) yield ctx.createTempFile();
        yield ctx.ep.open();
        // stdin might throw "read ECONNRESET" on Linux for some reason
        ctx.ep._process.stdin.on('error', function () {});
        // patch stdout so that we never resolve read metadata promise
        ctx.ep._stdoutResolveWs._write = function (obj, enc, next) {
            next();
        };
        var operationPromise = getOperationPromise();

        var killPromise = kill(ctx.ep._process);

        try {
            yield operationPromise;
            throw new Error('Expected operation to be rejected');
        } catch (_ref2) {
            var message = _ref2.message;

            assert.equal(message, expected);
            yield killPromise;
        }
    });

    return function runTest(_x, _x2, _x3) {
        return _ref.apply(this, arguments);
    };
}();

var closeStreamsOnExitTestSuite = {
    context: context,
    'should return rejected promise when reading': function () {
        var _ref3 = _asyncToGenerator(function* (ctx) {
            var getOperationPromise = function getOperationPromise() {
                return ctx.ep.readMetadata(ctx.folder);
            };
            yield runTest(ctx, getOperationPromise);
        });

        function shouldReturnRejectedPromiseWhenReading(_x4) {
            return _ref3.apply(this, arguments);
        }

        return shouldReturnRejectedPromiseWhenReading;
    }(),
    'should return rejected promise when writing': function () {
        var _ref4 = _asyncToGenerator(function* (ctx) {
            var getOperationPromise = function getOperationPromise() {
                var keywords = ['keywordA', 'keywordB'];
                var comment = 'hello world';
                var data = {
                    all: '',
                    comment: comment, // has to come after all in order not to be removed
                    'Keywords+': keywords
                };
                return ctx.ep.writeMetadata(ctx.tempFile, data, ['overwrite_original']);
            };

            yield runTest(ctx, getOperationPromise, true);
        });

        function shouldReturnRejectedPromiseWhenWriting(_x5) {
            return _ref4.apply(this, arguments);
        }

        return shouldReturnRejectedPromiseWhenWriting;
    }()
};

module.exports = closeStreamsOnExitTestSuite;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3Rlc3Qvc3BlYy9oYW5kbGUtc3RyZWFtcy1maW5pc2guanMiXSwibmFtZXMiOlsiY29udGV4dCIsInJlcXVpcmUiLCJhc3NlcnQiLCJleGlmdG9vbCIsImtpbGxQaWQiLCJnbG9iYWxFeGlmdG9vbENvbnN0cnVjdG9yIiwiRXhpZnRvb2xQcm9jZXNzIiwia2lsbCIsInByb2MiLCJwcm9jZXNzIiwicGxhdGZvcm0iLCJQcm9taXNlIiwicmVzb2x2ZSIsInJlamVjdCIsIm9uY2UiLCJwaWQiLCJleHBlY3RlZCIsInJ1blRlc3QiLCJjdHgiLCJnZXRPcGVyYXRpb25Qcm9taXNlIiwiY3JlYXRlVGVtcEZpbGUiLCJjcmVhdGUiLCJlcCIsIm9wZW4iLCJfcHJvY2VzcyIsInN0ZGluIiwib24iLCJfc3Rkb3V0UmVzb2x2ZVdzIiwiX3dyaXRlIiwib2JqIiwiZW5jIiwibmV4dCIsIm9wZXJhdGlvblByb21pc2UiLCJraWxsUHJvbWlzZSIsIkVycm9yIiwibWVzc2FnZSIsImVxdWFsIiwiY2xvc2VTdHJlYW1zT25FeGl0VGVzdFN1aXRlIiwicmVhZE1ldGFkYXRhIiwiZm9sZGVyIiwia2V5d29yZHMiLCJjb21tZW50IiwiZGF0YSIsImFsbCIsIndyaXRlTWV0YWRhdGEiLCJ0ZW1wRmlsZSIsIm1vZHVsZSIsImV4cG9ydHMiXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBLElBQU1BLFVBQVVDLFFBQVEsa0JBQVIsQ0FBaEI7QUFDQSxJQUFNQyxTQUFTRCxRQUFRLFFBQVIsQ0FBZjtBQUNBLElBQU1FLFdBQVdGLFFBQVEsWUFBUixDQUFqQjtBQUNBLElBQU1HLFVBQVVILFFBQVEsaUJBQVIsQ0FBaEI7O0FBRUFELFFBQVFLLHlCQUFSLEdBQW9DRixTQUFTRyxlQUE3Qzs7QUFFQTtBQUNBO0FBQ0EsU0FBU0MsSUFBVCxDQUFjQyxJQUFkLEVBQW9CO0FBQ2hCLFFBQUlDLFFBQVFDLFFBQVIsS0FBcUIsT0FBekIsRUFBa0M7QUFDOUIsZUFBTyxJQUFJQyxPQUFKLENBQVksVUFBQ0MsT0FBRCxFQUFVQyxNQUFWLEVBQXFCO0FBQ3BDTCxpQkFBS00sSUFBTCxDQUFVLE9BQVYsRUFBbUJELE1BQW5CO0FBQ0FMLGlCQUFLTSxJQUFMLENBQVUsTUFBVixFQUFrQkYsT0FBbEI7QUFDQUgsb0JBQVFGLElBQVIsQ0FBYUMsS0FBS08sR0FBbEI7QUFDSCxTQUpNLENBQVA7QUFLSDtBQUNELFdBQU9YLFFBQVFJLEtBQUtPLEdBQWIsQ0FBUDtBQUNIOztBQUVELElBQU1DLFdBQVcsMERBQWpCOztBQUVBLElBQU1DO0FBQUEsaUNBQVUsV0FBT0MsR0FBUCxFQUFZQyxtQkFBWixFQUFpQ0MsY0FBakMsRUFBb0Q7QUFDaEVGLFlBQUlHLE1BQUo7QUFDQSxZQUFJRCxjQUFKLEVBQW9CLE1BQU1GLElBQUlFLGNBQUosRUFBTjtBQUNwQixjQUFNRixJQUFJSSxFQUFKLENBQU9DLElBQVAsRUFBTjtBQUNBO0FBQ0FMLFlBQUlJLEVBQUosQ0FBT0UsUUFBUCxDQUFnQkMsS0FBaEIsQ0FBc0JDLEVBQXRCLENBQXlCLE9BQXpCLEVBQWtDLFlBQU0sQ0FBRSxDQUExQztBQUNBO0FBQ0FSLFlBQUlJLEVBQUosQ0FBT0ssZ0JBQVAsQ0FBd0JDLE1BQXhCLEdBQWlDLFVBQUNDLEdBQUQsRUFBTUMsR0FBTixFQUFXQyxJQUFYLEVBQW9CO0FBQ2pEQTtBQUNILFNBRkQ7QUFHQSxZQUFNQyxtQkFBbUJiLHFCQUF6Qjs7QUFFQSxZQUFNYyxjQUFjMUIsS0FBS1csSUFBSUksRUFBSixDQUFPRSxRQUFaLENBQXBCOztBQUVBLFlBQUk7QUFDQSxrQkFBTVEsZ0JBQU47QUFDQSxrQkFBTSxJQUFJRSxLQUFKLENBQVUsbUNBQVYsQ0FBTjtBQUNILFNBSEQsQ0FHRSxjQUFvQjtBQUFBLGdCQUFYQyxPQUFXLFNBQVhBLE9BQVc7O0FBQ2xCakMsbUJBQU9rQyxLQUFQLENBQWFELE9BQWIsRUFBc0JuQixRQUF0QjtBQUNBLGtCQUFNaUIsV0FBTjtBQUNIO0FBQ0osS0FyQks7O0FBQUE7QUFBQTtBQUFBO0FBQUEsR0FBTjs7QUF1QkEsSUFBTUksOEJBQThCO0FBQ2hDckMsb0JBRGdDO0FBRWhDO0FBQUEsc0NBQStDLFdBQU9rQixHQUFQLEVBQWU7QUFDMUQsZ0JBQU1DLHNCQUFzQixTQUF0QkEsbUJBQXNCO0FBQUEsdUJBQU1ELElBQUlJLEVBQUosQ0FBT2dCLFlBQVAsQ0FBb0JwQixJQUFJcUIsTUFBeEIsQ0FBTjtBQUFBLGFBQTVCO0FBQ0Esa0JBQU10QixRQUFRQyxHQUFSLEVBQWFDLG1CQUFiLENBQU47QUFDSCxTQUhEOztBQUFBO0FBQUE7QUFBQTs7QUFBQTtBQUFBLE9BRmdDO0FBTWhDO0FBQUEsc0NBQStDLFdBQU9ELEdBQVAsRUFBZTtBQUMxRCxnQkFBTUMsc0JBQXNCLFNBQXRCQSxtQkFBc0IsR0FBTTtBQUM5QixvQkFBTXFCLFdBQVcsQ0FBRSxVQUFGLEVBQWMsVUFBZCxDQUFqQjtBQUNBLG9CQUFNQyxVQUFVLGFBQWhCO0FBQ0Esb0JBQU1DLE9BQU87QUFDVEMseUJBQUssRUFESTtBQUVURixvQ0FGUyxFQUVBO0FBQ1QsaUNBQWFEO0FBSEosaUJBQWI7QUFLQSx1QkFBT3RCLElBQUlJLEVBQUosQ0FBT3NCLGFBQVAsQ0FBcUIxQixJQUFJMkIsUUFBekIsRUFBbUNILElBQW5DLEVBQXlDLENBQUMsb0JBQUQsQ0FBekMsQ0FBUDtBQUNILGFBVEQ7O0FBV0Esa0JBQU16QixRQUFRQyxHQUFSLEVBQWFDLG1CQUFiLEVBQWtDLElBQWxDLENBQU47QUFDSCxTQWJEOztBQUFBO0FBQUE7QUFBQTs7QUFBQTtBQUFBO0FBTmdDLENBQXBDOztBQXNCQTJCLE9BQU9DLE9BQVAsR0FBaUJWLDJCQUFqQiIsImZpbGUiOiJoYW5kbGUtc3RyZWFtcy1maW5pc2guanMiLCJzb3VyY2VzQ29udGVudCI6WyJjb25zdCBjb250ZXh0ID0gcmVxdWlyZSgnZXhpZnRvb2wtY29udGV4dCcpXG5jb25zdCBhc3NlcnQgPSByZXF1aXJlKCdhc3NlcnQnKVxuY29uc3QgZXhpZnRvb2wgPSByZXF1aXJlKCcuLi8uLi9zcmMvJylcbmNvbnN0IGtpbGxQaWQgPSByZXF1aXJlKCcuLi9saWIva2lsbC1waWQnKVxuXG5jb250ZXh0Lmdsb2JhbEV4aWZ0b29sQ29uc3RydWN0b3IgPSBleGlmdG9vbC5FeGlmdG9vbFByb2Nlc3NcblxuLy8ga2lsbCB3aXRoIG9wZXJhdGluZyBzeXN0ZW0gbWV0aG9kcywgcmF0aGVyIHRoYW4gc2VuZGluZyBhIHNpZ25hbCxcbi8vIHdoaWNoIGRvZXMgbm90IHdvcmsgb24gV2luZG93c1xuZnVuY3Rpb24ga2lsbChwcm9jKSB7XG4gICAgaWYgKHByb2Nlc3MucGxhdGZvcm0gIT09ICd3aW4zMicpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIHByb2Mub25jZSgnZXJyb3InLCByZWplY3QpXG4gICAgICAgICAgICBwcm9jLm9uY2UoJ2V4aXQnLCByZXNvbHZlKVxuICAgICAgICAgICAgcHJvY2Vzcy5raWxsKHByb2MucGlkKVxuICAgICAgICB9KVxuICAgIH1cbiAgICByZXR1cm4ga2lsbFBpZChwcm9jLnBpZClcbn1cblxuY29uc3QgZXhwZWN0ZWQgPSAnc3Rkb3V0IGFuZCBzdGRlcnIgZmluaXNoZWQgYmVmb3JlIG9wZXJhdGlvbiB3YXMgY29tcGxldGUnXG5cbmNvbnN0IHJ1blRlc3QgPSBhc3luYyAoY3R4LCBnZXRPcGVyYXRpb25Qcm9taXNlLCBjcmVhdGVUZW1wRmlsZSkgPT4ge1xuICAgIGN0eC5jcmVhdGUoKVxuICAgIGlmIChjcmVhdGVUZW1wRmlsZSkgYXdhaXQgY3R4LmNyZWF0ZVRlbXBGaWxlKClcbiAgICBhd2FpdCBjdHguZXAub3BlbigpXG4gICAgLy8gc3RkaW4gbWlnaHQgdGhyb3cgXCJyZWFkIEVDT05OUkVTRVRcIiBvbiBMaW51eCBmb3Igc29tZSByZWFzb25cbiAgICBjdHguZXAuX3Byb2Nlc3Muc3RkaW4ub24oJ2Vycm9yJywgKCkgPT4ge30pXG4gICAgLy8gcGF0Y2ggc3Rkb3V0IHNvIHRoYXQgd2UgbmV2ZXIgcmVzb2x2ZSByZWFkIG1ldGFkYXRhIHByb21pc2VcbiAgICBjdHguZXAuX3N0ZG91dFJlc29sdmVXcy5fd3JpdGUgPSAob2JqLCBlbmMsIG5leHQpID0+IHtcbiAgICAgICAgbmV4dCgpXG4gICAgfVxuICAgIGNvbnN0IG9wZXJhdGlvblByb21pc2UgPSBnZXRPcGVyYXRpb25Qcm9taXNlKClcblxuICAgIGNvbnN0IGtpbGxQcm9taXNlID0ga2lsbChjdHguZXAuX3Byb2Nlc3MpXG5cbiAgICB0cnkge1xuICAgICAgICBhd2FpdCBvcGVyYXRpb25Qcm9taXNlXG4gICAgICAgIHRocm93IG5ldyBFcnJvcignRXhwZWN0ZWQgb3BlcmF0aW9uIHRvIGJlIHJlamVjdGVkJylcbiAgICB9IGNhdGNoICh7IG1lc3NhZ2UgfSkge1xuICAgICAgICBhc3NlcnQuZXF1YWwobWVzc2FnZSwgZXhwZWN0ZWQpXG4gICAgICAgIGF3YWl0IGtpbGxQcm9taXNlXG4gICAgfVxufVxuXG5jb25zdCBjbG9zZVN0cmVhbXNPbkV4aXRUZXN0U3VpdGUgPSB7XG4gICAgY29udGV4dCxcbiAgICAnc2hvdWxkIHJldHVybiByZWplY3RlZCBwcm9taXNlIHdoZW4gcmVhZGluZyc6IGFzeW5jIChjdHgpID0+IHtcbiAgICAgICAgY29uc3QgZ2V0T3BlcmF0aW9uUHJvbWlzZSA9ICgpID0+IGN0eC5lcC5yZWFkTWV0YWRhdGEoY3R4LmZvbGRlcilcbiAgICAgICAgYXdhaXQgcnVuVGVzdChjdHgsIGdldE9wZXJhdGlvblByb21pc2UpXG4gICAgfSxcbiAgICAnc2hvdWxkIHJldHVybiByZWplY3RlZCBwcm9taXNlIHdoZW4gd3JpdGluZyc6IGFzeW5jIChjdHgpID0+IHtcbiAgICAgICAgY29uc3QgZ2V0T3BlcmF0aW9uUHJvbWlzZSA9ICgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGtleXdvcmRzID0gWyAna2V5d29yZEEnLCAna2V5d29yZEInIF1cbiAgICAgICAgICAgIGNvbnN0IGNvbW1lbnQgPSAnaGVsbG8gd29ybGQnXG4gICAgICAgICAgICBjb25zdCBkYXRhID0ge1xuICAgICAgICAgICAgICAgIGFsbDogJycsXG4gICAgICAgICAgICAgICAgY29tbWVudCwgLy8gaGFzIHRvIGNvbWUgYWZ0ZXIgYWxsIGluIG9yZGVyIG5vdCB0byBiZSByZW1vdmVkXG4gICAgICAgICAgICAgICAgJ0tleXdvcmRzKyc6IGtleXdvcmRzLFxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGN0eC5lcC53cml0ZU1ldGFkYXRhKGN0eC50ZW1wRmlsZSwgZGF0YSwgWydvdmVyd3JpdGVfb3JpZ2luYWwnXSlcbiAgICAgICAgfVxuXG4gICAgICAgIGF3YWl0IHJ1blRlc3QoY3R4LCBnZXRPcGVyYXRpb25Qcm9taXNlLCB0cnVlKVxuICAgIH0sXG59XG5cbm1vZHVsZS5leHBvcnRzID0gY2xvc2VTdHJlYW1zT25FeGl0VGVzdFN1aXRlXG4iXX0=