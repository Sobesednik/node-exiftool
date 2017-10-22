'use strict';

require('source-map-support/register');

var cp = require('child_process');
var ps = require('ps-node');

var isWindows = process.platform === 'win32';
// use this function when we only have a pid, but not process, i.e.,
// we can't assign on('exit') listener
function killUnixPid(pid) {
    if (isWindows) {
        return Promise.reject(new Error('This function is not available on win'));
    }
    return new Promise(function (resolve, reject) {
        ps.kill(pid, function (err) {
            if (err) return reject(err);
            return resolve(pid);
        });
    });
}

function killWinPid(pid) {
    if (!isWindows) {
        return Promise.reject(new Error('This function is only available on win'));
    }
    return new Promise(function (resolve, reject) {
        cp.exec('taskkill /t /F /PID ' + pid, function (err, stdout) {
            if (err) return reject(err);
            if (!/SUCCESS/.test(stdout)) return reject(new Error(stdout.trim()));
            resolve(pid);
        });
    });
}

/**
 * Kill a process by pid, if pointer is not available.
 * @param {number|string} pid Process ID
 * @returns {Promise.<string|number>} Promise resolved with the pid.
 */
function killPid(pid) {
    return isWindows ? killWinPid(pid) : killUnixPid(pid);
}

module.exports = killPid;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3Rlc3QvbGliL2tpbGwtcGlkLmpzIl0sIm5hbWVzIjpbImNwIiwicmVxdWlyZSIsInBzIiwiaXNXaW5kb3dzIiwicHJvY2VzcyIsInBsYXRmb3JtIiwia2lsbFVuaXhQaWQiLCJwaWQiLCJQcm9taXNlIiwicmVqZWN0IiwiRXJyb3IiLCJyZXNvbHZlIiwia2lsbCIsImVyciIsImtpbGxXaW5QaWQiLCJleGVjIiwic3Rkb3V0IiwidGVzdCIsInRyaW0iLCJraWxsUGlkIiwibW9kdWxlIiwiZXhwb3J0cyJdLCJtYXBwaW5ncyI6Ijs7OztBQUFBLElBQU1BLEtBQUtDLFFBQVEsZUFBUixDQUFYO0FBQ0EsSUFBTUMsS0FBS0QsUUFBUSxTQUFSLENBQVg7O0FBRUEsSUFBTUUsWUFBWUMsUUFBUUMsUUFBUixLQUFxQixPQUF2QztBQUNBO0FBQ0E7QUFDQSxTQUFTQyxXQUFULENBQXFCQyxHQUFyQixFQUEwQjtBQUN0QixRQUFJSixTQUFKLEVBQWU7QUFDWCxlQUFPSyxRQUFRQyxNQUFSLENBQWUsSUFBSUMsS0FBSixDQUFVLHVDQUFWLENBQWYsQ0FBUDtBQUNIO0FBQ0QsV0FBTyxJQUFJRixPQUFKLENBQVksVUFBQ0csT0FBRCxFQUFVRixNQUFWLEVBQXFCO0FBQ3BDUCxXQUFHVSxJQUFILENBQVFMLEdBQVIsRUFBYSxVQUFDTSxHQUFELEVBQVM7QUFDbEIsZ0JBQUlBLEdBQUosRUFBUyxPQUFPSixPQUFPSSxHQUFQLENBQVA7QUFDVCxtQkFBT0YsUUFBUUosR0FBUixDQUFQO0FBQ0gsU0FIRDtBQUlILEtBTE0sQ0FBUDtBQU1IOztBQUVELFNBQVNPLFVBQVQsQ0FBb0JQLEdBQXBCLEVBQXlCO0FBQ3JCLFFBQUksQ0FBQ0osU0FBTCxFQUFnQjtBQUNaLGVBQU9LLFFBQVFDLE1BQVIsQ0FBZSxJQUFJQyxLQUFKLENBQVUsd0NBQVYsQ0FBZixDQUFQO0FBQ0g7QUFDRCxXQUFPLElBQUlGLE9BQUosQ0FBWSxVQUFDRyxPQUFELEVBQVVGLE1BQVYsRUFBcUI7QUFDcENULFdBQUdlLElBQUgsMEJBQStCUixHQUEvQixFQUFzQyxVQUFDTSxHQUFELEVBQU1HLE1BQU4sRUFBaUI7QUFDbkQsZ0JBQUlILEdBQUosRUFBUyxPQUFPSixPQUFPSSxHQUFQLENBQVA7QUFDVCxnQkFBSSxDQUFDLFVBQVVJLElBQVYsQ0FBZUQsTUFBZixDQUFMLEVBQTZCLE9BQU9QLE9BQU8sSUFBSUMsS0FBSixDQUFVTSxPQUFPRSxJQUFQLEVBQVYsQ0FBUCxDQUFQO0FBQzdCUCxvQkFBUUosR0FBUjtBQUNILFNBSkQ7QUFLSCxLQU5NLENBQVA7QUFPSDs7QUFFRDs7Ozs7QUFLQSxTQUFTWSxPQUFULENBQWlCWixHQUFqQixFQUFzQjtBQUNsQixXQUFPSixZQUFZVyxXQUFXUCxHQUFYLENBQVosR0FBOEJELFlBQVlDLEdBQVosQ0FBckM7QUFDSDs7QUFFRGEsT0FBT0MsT0FBUCxHQUFpQkYsT0FBakIiLCJmaWxlIjoia2lsbC1waWQuanMiLCJzb3VyY2VzQ29udGVudCI6WyJjb25zdCBjcCA9IHJlcXVpcmUoJ2NoaWxkX3Byb2Nlc3MnKVxuY29uc3QgcHMgPSByZXF1aXJlKCdwcy1ub2RlJylcblxuY29uc3QgaXNXaW5kb3dzID0gcHJvY2Vzcy5wbGF0Zm9ybSA9PT0gJ3dpbjMyJ1xuLy8gdXNlIHRoaXMgZnVuY3Rpb24gd2hlbiB3ZSBvbmx5IGhhdmUgYSBwaWQsIGJ1dCBub3QgcHJvY2VzcywgaS5lLixcbi8vIHdlIGNhbid0IGFzc2lnbiBvbignZXhpdCcpIGxpc3RlbmVyXG5mdW5jdGlvbiBraWxsVW5peFBpZChwaWQpIHtcbiAgICBpZiAoaXNXaW5kb3dzKSB7XG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgRXJyb3IoJ1RoaXMgZnVuY3Rpb24gaXMgbm90IGF2YWlsYWJsZSBvbiB3aW4nKSlcbiAgICB9XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgcHMua2lsbChwaWQsIChlcnIpID0+IHtcbiAgICAgICAgICAgIGlmIChlcnIpIHJldHVybiByZWplY3QoZXJyKVxuICAgICAgICAgICAgcmV0dXJuIHJlc29sdmUocGlkKVxuICAgICAgICB9KVxuICAgIH0pXG59XG5cbmZ1bmN0aW9uIGtpbGxXaW5QaWQocGlkKSB7XG4gICAgaWYgKCFpc1dpbmRvd3MpIHtcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyBFcnJvcignVGhpcyBmdW5jdGlvbiBpcyBvbmx5IGF2YWlsYWJsZSBvbiB3aW4nKSlcbiAgICB9XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgY3AuZXhlYyhgdGFza2tpbGwgL3QgL0YgL1BJRCAke3BpZH1gLCAoZXJyLCBzdGRvdXQpID0+IHtcbiAgICAgICAgICAgIGlmIChlcnIpIHJldHVybiByZWplY3QoZXJyKVxuICAgICAgICAgICAgaWYgKCEvU1VDQ0VTUy8udGVzdChzdGRvdXQpKSByZXR1cm4gcmVqZWN0KG5ldyBFcnJvcihzdGRvdXQudHJpbSgpKSlcbiAgICAgICAgICAgIHJlc29sdmUocGlkKVxuICAgICAgICB9KVxuICAgIH0pXG59XG5cbi8qKlxuICogS2lsbCBhIHByb2Nlc3MgYnkgcGlkLCBpZiBwb2ludGVyIGlzIG5vdCBhdmFpbGFibGUuXG4gKiBAcGFyYW0ge251bWJlcnxzdHJpbmd9IHBpZCBQcm9jZXNzIElEXG4gKiBAcmV0dXJucyB7UHJvbWlzZS48c3RyaW5nfG51bWJlcj59IFByb21pc2UgcmVzb2x2ZWQgd2l0aCB0aGUgcGlkLlxuICovXG5mdW5jdGlvbiBraWxsUGlkKHBpZCkge1xuICAgIHJldHVybiBpc1dpbmRvd3MgPyBraWxsV2luUGlkKHBpZCkgOiBraWxsVW5peFBpZChwaWQpXG59XG5cbm1vZHVsZS5leHBvcnRzID0ga2lsbFBpZFxuIl19