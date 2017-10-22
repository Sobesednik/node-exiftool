'use strict';

require('source-map-support/register');

var wrote = require('wrote');

var _require = require('stream'),
    Readable = _require.Readable;

/**
 * Create temp file for rs, execute exiftool command, then erase file
 * @param {Readable} rs a read stream
 * @param {string[]} args Arguments
 * @param {function} executeCommand function which is responsible for executing the command
 */


function executeWithRs(rs, args, executeCommand) {
    if (!(rs instanceof Readable)) {
        return Promise.reject(new Error('Please pass a readable stream'));
    }
    if (typeof executeCommand !== 'function') {
        return Promise.reject(new Error('executeCommand must be a function'));
    }
    var ws = void 0;
    return wrote() // temp file will be created
    .then(function (res) {
        ws = res;
        rs.pipe(ws);
        return executeCommand(ws.path, args);
    }).then(function (res) {
        return wrote.erase(ws).then(function () {
            return res;
        });
    }, function (err) {
        return wrote.erase(ws).then(function () {
            throw err;
        });
    });
}

module.exports = executeWithRs;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9leGVjdXRlLXdpdGgtcnMuanMiXSwibmFtZXMiOlsid3JvdGUiLCJyZXF1aXJlIiwiUmVhZGFibGUiLCJleGVjdXRlV2l0aFJzIiwicnMiLCJhcmdzIiwiZXhlY3V0ZUNvbW1hbmQiLCJQcm9taXNlIiwicmVqZWN0IiwiRXJyb3IiLCJ3cyIsInRoZW4iLCJyZXMiLCJwaXBlIiwicGF0aCIsImVyYXNlIiwiZXJyIiwibW9kdWxlIiwiZXhwb3J0cyJdLCJtYXBwaW5ncyI6Ijs7OztBQUFBLElBQU1BLFFBQVFDLFFBQVEsT0FBUixDQUFkOztlQUNxQkEsUUFBUSxRQUFSLEM7SUFBYkMsUSxZQUFBQSxROztBQUVSOzs7Ozs7OztBQU1BLFNBQVNDLGFBQVQsQ0FBdUJDLEVBQXZCLEVBQTJCQyxJQUEzQixFQUFpQ0MsY0FBakMsRUFBaUQ7QUFDN0MsUUFBSSxFQUFFRixjQUFjRixRQUFoQixDQUFKLEVBQStCO0FBQzNCLGVBQU9LLFFBQVFDLE1BQVIsQ0FBZSxJQUFJQyxLQUFKLENBQVUsK0JBQVYsQ0FBZixDQUFQO0FBQ0g7QUFDRCxRQUFJLE9BQU9ILGNBQVAsS0FBMEIsVUFBOUIsRUFBMEM7QUFDdEMsZUFBT0MsUUFBUUMsTUFBUixDQUFlLElBQUlDLEtBQUosQ0FBVSxtQ0FBVixDQUFmLENBQVA7QUFDSDtBQUNELFFBQUlDLFdBQUo7QUFDQSxXQUFPVixRQUFRO0FBQVIsS0FDRlcsSUFERSxDQUNHLFVBQUNDLEdBQUQsRUFBUztBQUNYRixhQUFLRSxHQUFMO0FBQ0FSLFdBQUdTLElBQUgsQ0FBUUgsRUFBUjtBQUNBLGVBQU9KLGVBQWVJLEdBQUdJLElBQWxCLEVBQXdCVCxJQUF4QixDQUFQO0FBQ0gsS0FMRSxFQU1GTSxJQU5FLENBTUcsVUFBQ0MsR0FBRCxFQUFTO0FBQ1gsZUFBT1osTUFBTWUsS0FBTixDQUFZTCxFQUFaLEVBQ0ZDLElBREUsQ0FDRyxZQUFNO0FBQ1IsbUJBQU9DLEdBQVA7QUFDSCxTQUhFLENBQVA7QUFJSCxLQVhFLEVBV0EsVUFBQ0ksR0FBRCxFQUFTO0FBQ1IsZUFBT2hCLE1BQU1lLEtBQU4sQ0FBWUwsRUFBWixFQUNGQyxJQURFLENBQ0csWUFBTTtBQUNSLGtCQUFNSyxHQUFOO0FBQ0gsU0FIRSxDQUFQO0FBSUgsS0FoQkUsQ0FBUDtBQWlCSDs7QUFFREMsT0FBT0MsT0FBUCxHQUFpQmYsYUFBakIiLCJmaWxlIjoiZXhlY3V0ZS13aXRoLXJzLmpzIiwic291cmNlc0NvbnRlbnQiOlsiY29uc3Qgd3JvdGUgPSByZXF1aXJlKCd3cm90ZScpXG5jb25zdCB7IFJlYWRhYmxlIH0gPSByZXF1aXJlKCdzdHJlYW0nKVxuXG4vKipcbiAqIENyZWF0ZSB0ZW1wIGZpbGUgZm9yIHJzLCBleGVjdXRlIGV4aWZ0b29sIGNvbW1hbmQsIHRoZW4gZXJhc2UgZmlsZVxuICogQHBhcmFtIHtSZWFkYWJsZX0gcnMgYSByZWFkIHN0cmVhbVxuICogQHBhcmFtIHtzdHJpbmdbXX0gYXJncyBBcmd1bWVudHNcbiAqIEBwYXJhbSB7ZnVuY3Rpb259IGV4ZWN1dGVDb21tYW5kIGZ1bmN0aW9uIHdoaWNoIGlzIHJlc3BvbnNpYmxlIGZvciBleGVjdXRpbmcgdGhlIGNvbW1hbmRcbiAqL1xuZnVuY3Rpb24gZXhlY3V0ZVdpdGhScyhycywgYXJncywgZXhlY3V0ZUNvbW1hbmQpIHtcbiAgICBpZiAoIShycyBpbnN0YW5jZW9mIFJlYWRhYmxlKSkge1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IEVycm9yKCdQbGVhc2UgcGFzcyBhIHJlYWRhYmxlIHN0cmVhbScpKVxuICAgIH1cbiAgICBpZiAodHlwZW9mIGV4ZWN1dGVDb21tYW5kICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgRXJyb3IoJ2V4ZWN1dGVDb21tYW5kIG11c3QgYmUgYSBmdW5jdGlvbicpKVxuICAgIH1cbiAgICBsZXQgd3NcbiAgICByZXR1cm4gd3JvdGUoKSAvLyB0ZW1wIGZpbGUgd2lsbCBiZSBjcmVhdGVkXG4gICAgICAgIC50aGVuKChyZXMpID0+IHtcbiAgICAgICAgICAgIHdzID0gcmVzXG4gICAgICAgICAgICBycy5waXBlKHdzKVxuICAgICAgICAgICAgcmV0dXJuIGV4ZWN1dGVDb21tYW5kKHdzLnBhdGgsIGFyZ3MpXG4gICAgICAgIH0pXG4gICAgICAgIC50aGVuKChyZXMpID0+IHtcbiAgICAgICAgICAgIHJldHVybiB3cm90ZS5lcmFzZSh3cylcbiAgICAgICAgICAgICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByZXNcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICB9LCAoZXJyKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gd3JvdGUuZXJhc2Uod3MpXG4gICAgICAgICAgICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBlcnJcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICB9KVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGV4ZWN1dGVXaXRoUnNcbiJdfQ==