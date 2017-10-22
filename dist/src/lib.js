'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

require('source-map-support/register');

var cp = require('child_process');

var _require = require('os'),
    EOL = _require.EOL;

var isStream = require('is-stream');
var erotic = require('erotic');

function writeStdIn(proc, data, encoding) {
    // console.log('write stdin', data)
    proc.stdin.write(data, encoding);
    proc.stdin.write(EOL, encoding);
}

function close(proc) {
    var er = erotic();
    var errHandler = void 0;
    return new Promise(function (resolve, reject) {
        errHandler = function errHandler(_ref) {
            var message = _ref.message;

            var err = er(message);
            reject(err);
        };
        proc.once('close', resolve);
        proc.stdin.once('error', errHandler);
        writeStdIn(proc, '-stay_open');
        writeStdIn(proc, 'false');
    }).then(function () {
        proc.stdin.removeListener('error', errHandler);
    });
}

function isString(s) {
    return (typeof s === 'undefined' ? 'undefined' : _typeof(s)).toLowerCase() === 'string';
}

function isObject(o) {
    return (typeof o === 'undefined' ? 'undefined' : _typeof(o)).toLowerCase() === 'object' && o !== null;
}

/**
 * Get arguments. Split by new line to write to exiftool
 */
function getArgs(args, noSplit) {
    if (!(Array.isArray(args) && args.length)) {
        return [];
    }
    return args.filter(isString).map(function (arg) {
        return '-' + arg;
    }).reduce(function (acc, arg) {
        return [].concat(acc, noSplit ? [arg] : arg.split(/\s+/));
    }, []);
}

/**
 * Write command data to the exiftool's stdin.
 * @param {ChildProcess} process - exiftool process executed with -stay_open True -@ -
 * @param {string} command - which command to execute
 * @param {string} commandNumber - text which will be echoed before and after results
 * @param {string[]} args - any additional arguments
 * @param {string[]} noSplitArgs - arguments which should not be broken up like args
 * @param {string} encoding - which encoding to write in. default no encoding
 */
function execute(proc, command, commandNumber, args, noSplitArgs, encoding) {
    var extendedArgs = getArgs(args);
    var extendedArgsNoSplit = getArgs(noSplitArgs, true);

    command = command !== undefined ? command : '';

    var allArgs = [].concat(extendedArgsNoSplit, extendedArgs, ['-json', '-s'], [command, '-echo1', '{begin' + commandNumber + '}', '-echo2', '{begin' + commandNumber + '}', '-echo4', '{ready' + commandNumber + '}', '-execute' + commandNumber]);
    if (process.env.DEBUG) {
        // eslint-disable-next-line no-console
        console.log(JSON.stringify(allArgs, null, 2));
    }
    allArgs.forEach(function (arg) {
        return writeStdIn(proc, arg, encoding);
    });
}

var currentCommand = 0;
function genCommandNumber() {
    return String(++currentCommand);
}

function executeCommand(proc, stdoutRws, stderrRws, command, args, noSplitArgs, encoding) {
    var commandNumber = genCommandNumber();

    if (proc === process) {
        // debugging
        execute(proc, command, commandNumber, args, noSplitArgs, encoding);
        return Promise.resolve({ data: 'debug', error: null });
    }

    var dataFinishHandler = void 0;
    var errFinishHandler = void 0;
    var dataErr = void 0;
    var errErr = void 0;

    var dataPromise = new Promise(function (resolve, reject) {
        dataFinishHandler = function dataFinishHandler() {
            reject(new Error('stdout stream finished before operation was complete'));
        };
        stdoutRws.once('finish', dataFinishHandler);
        stdoutRws.addToResolveMap(commandNumber, resolve);
    }).catch(function (error) {
        dataErr = error;
    });
    var errPromise = new Promise(function (resolve, reject) {
        errFinishHandler = function errFinishHandler() {
            reject(new Error('stderr stream finished before operation was complete'));
        };
        stderrRws.once('finish', errFinishHandler);
        stderrRws.addToResolveMap(commandNumber, resolve);
    }).catch(function (error) {
        errErr = error;
    });

    execute(proc, command, commandNumber, args, noSplitArgs, encoding);

    return Promise.all([dataPromise, errPromise]).then(function (res) {
        stderrRws.removeListener('finish', errFinishHandler);
        stdoutRws.removeListener('finish', dataFinishHandler);
        if (dataErr && !errErr) {
            throw dataErr;
        } else if (errErr && !dataErr) {
            throw errErr;
        } else if (dataErr && errErr) {
            throw new Error('stdout and stderr finished before operation was complete');
        }
        return {
            data: res[0] ? JSON.parse(res[0]) : null,
            error: res[1] || null
        };
    });
}

function isReadable(stream) {
    return isStream.readable(stream);
}
function isWritable(stream) {
    return isStream.writable(stream);
}

/**
 * Spawn exiftool.
 * @param {string} bin Path to the binary
 * @param {object} [options] options to pass to child_process.spawn method
 * @returns {Promise.<ChildProcess>} A promise resolved with the process pointer, or rejected on error.
 */
function spawn(bin, options) {
    var echoString = Date.now().toString();
    var proc = cp.spawn(bin, ['-echo2', echoString, '-stay_open', 'True', '-@', '-'], options);
    if (!isReadable(proc.stderr)) {
        killProcess(proc);
        return Promise.reject(new Error('Process was not spawned with a readable stderr, check stdio options.'));
    }

    return new Promise(function (resolve, reject) {
        var echoHandler = function echoHandler(data) {
            var d = data.toString().trim();
            // listening for echo2 in stderr (echo and echo1 won't work)
            if (d === echoString) {
                resolve(proc);
            } else {
                reject(new Error('Unexpected string on start: ' + d));
            }
        };
        proc.stderr.once('data', echoHandler);
        proc.once('error', reject);
    });
}

function checkDataObject(data) {
    return data === Object(data) && !Array.isArray(data);
}

function mapDataToTagArray(data, array) {
    var res = Array.isArray(array) ? array : [];
    Object.keys(data).forEach(function (tag) {
        var value = data[tag];
        if (Array.isArray(value)) {
            value.forEach(function (v) {
                var arg = tag + '=' + v;
                res.push(arg);
            });
        } else {
            res.push(tag + '=' + value);
        }
    });
    return res;
}

/**
 * Use process.kill on POSIX or terminate process with taskkill on Windows.
 * @param {ChildProcess} proc Process to terminate
 */
function killProcess(proc) {
    if (process.platform === 'win32') {
        cp.exec('taskkill /t /F /PID ' + proc.pid);
    } else {
        proc.kill();
    }
}

module.exports = {
    spawn: spawn,
    close: close,
    executeCommand: executeCommand,
    checkDataObject: checkDataObject,
    mapDataToTagArray: mapDataToTagArray,
    getArgs: getArgs,
    execute: execute,
    isString: isString,
    isObject: isObject,
    isReadable: isReadable,
    isWritable: isWritable,
    killProcess: killProcess
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9saWIuanMiXSwibmFtZXMiOlsiY3AiLCJyZXF1aXJlIiwiRU9MIiwiaXNTdHJlYW0iLCJlcm90aWMiLCJ3cml0ZVN0ZEluIiwicHJvYyIsImRhdGEiLCJlbmNvZGluZyIsInN0ZGluIiwid3JpdGUiLCJjbG9zZSIsImVyIiwiZXJySGFuZGxlciIsIlByb21pc2UiLCJyZXNvbHZlIiwicmVqZWN0IiwibWVzc2FnZSIsImVyciIsIm9uY2UiLCJ0aGVuIiwicmVtb3ZlTGlzdGVuZXIiLCJpc1N0cmluZyIsInMiLCJ0b0xvd2VyQ2FzZSIsImlzT2JqZWN0IiwibyIsImdldEFyZ3MiLCJhcmdzIiwibm9TcGxpdCIsIkFycmF5IiwiaXNBcnJheSIsImxlbmd0aCIsImZpbHRlciIsIm1hcCIsImFyZyIsInJlZHVjZSIsImFjYyIsImNvbmNhdCIsInNwbGl0IiwiZXhlY3V0ZSIsImNvbW1hbmQiLCJjb21tYW5kTnVtYmVyIiwibm9TcGxpdEFyZ3MiLCJleHRlbmRlZEFyZ3MiLCJleHRlbmRlZEFyZ3NOb1NwbGl0IiwidW5kZWZpbmVkIiwiYWxsQXJncyIsInByb2Nlc3MiLCJlbnYiLCJERUJVRyIsImNvbnNvbGUiLCJsb2ciLCJKU09OIiwic3RyaW5naWZ5IiwiZm9yRWFjaCIsImN1cnJlbnRDb21tYW5kIiwiZ2VuQ29tbWFuZE51bWJlciIsIlN0cmluZyIsImV4ZWN1dGVDb21tYW5kIiwic3Rkb3V0UndzIiwic3RkZXJyUndzIiwiZXJyb3IiLCJkYXRhRmluaXNoSGFuZGxlciIsImVyckZpbmlzaEhhbmRsZXIiLCJkYXRhRXJyIiwiZXJyRXJyIiwiZGF0YVByb21pc2UiLCJFcnJvciIsImFkZFRvUmVzb2x2ZU1hcCIsImNhdGNoIiwiZXJyUHJvbWlzZSIsImFsbCIsInJlcyIsInBhcnNlIiwiaXNSZWFkYWJsZSIsInN0cmVhbSIsInJlYWRhYmxlIiwiaXNXcml0YWJsZSIsIndyaXRhYmxlIiwic3Bhd24iLCJiaW4iLCJvcHRpb25zIiwiZWNob1N0cmluZyIsIkRhdGUiLCJub3ciLCJ0b1N0cmluZyIsInN0ZGVyciIsImtpbGxQcm9jZXNzIiwiZWNob0hhbmRsZXIiLCJkIiwidHJpbSIsImNoZWNrRGF0YU9iamVjdCIsIk9iamVjdCIsIm1hcERhdGFUb1RhZ0FycmF5IiwiYXJyYXkiLCJrZXlzIiwidmFsdWUiLCJ0YWciLCJ2IiwicHVzaCIsInBsYXRmb3JtIiwiZXhlYyIsInBpZCIsImtpbGwiLCJtb2R1bGUiLCJleHBvcnRzIl0sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSxJQUFNQSxLQUFLQyxRQUFRLGVBQVIsQ0FBWDs7ZUFDZ0JBLFFBQVEsSUFBUixDO0lBQVJDLEcsWUFBQUEsRzs7QUFDUixJQUFNQyxXQUFXRixRQUFRLFdBQVIsQ0FBakI7QUFDQSxJQUFNRyxTQUFTSCxRQUFRLFFBQVIsQ0FBZjs7QUFFQSxTQUFTSSxVQUFULENBQW9CQyxJQUFwQixFQUEwQkMsSUFBMUIsRUFBZ0NDLFFBQWhDLEVBQTBDO0FBQ3RDO0FBQ0FGLFNBQUtHLEtBQUwsQ0FBV0MsS0FBWCxDQUFpQkgsSUFBakIsRUFBdUJDLFFBQXZCO0FBQ0FGLFNBQUtHLEtBQUwsQ0FBV0MsS0FBWCxDQUFpQlIsR0FBakIsRUFBc0JNLFFBQXRCO0FBQ0g7O0FBRUQsU0FBU0csS0FBVCxDQUFlTCxJQUFmLEVBQXFCO0FBQ2pCLFFBQU1NLEtBQUtSLFFBQVg7QUFDQSxRQUFJUyxtQkFBSjtBQUNBLFdBQU8sSUFBSUMsT0FBSixDQUFZLFVBQUNDLE9BQUQsRUFBVUMsTUFBVixFQUFxQjtBQUNwQ0gscUJBQWEsMEJBQWlCO0FBQUEsZ0JBQWRJLE9BQWMsUUFBZEEsT0FBYzs7QUFDMUIsZ0JBQU1DLE1BQU1OLEdBQUdLLE9BQUgsQ0FBWjtBQUNBRCxtQkFBT0UsR0FBUDtBQUNILFNBSEQ7QUFJQVosYUFBS2EsSUFBTCxDQUFVLE9BQVYsRUFBbUJKLE9BQW5CO0FBQ0FULGFBQUtHLEtBQUwsQ0FBV1UsSUFBWCxDQUFnQixPQUFoQixFQUF5Qk4sVUFBekI7QUFDQVIsbUJBQVdDLElBQVgsRUFBaUIsWUFBakI7QUFDQUQsbUJBQVdDLElBQVgsRUFBaUIsT0FBakI7QUFDSCxLQVRNLEVBU0pjLElBVEksQ0FTQyxZQUFNO0FBQ1ZkLGFBQUtHLEtBQUwsQ0FBV1ksY0FBWCxDQUEwQixPQUExQixFQUFtQ1IsVUFBbkM7QUFDSCxLQVhNLENBQVA7QUFZSDs7QUFFRCxTQUFTUyxRQUFULENBQWtCQyxDQUFsQixFQUFxQjtBQUNqQixXQUFPLFFBQVFBLENBQVIseUNBQVFBLENBQVIsR0FBV0MsV0FBWCxPQUE2QixRQUFwQztBQUNIOztBQUVELFNBQVNDLFFBQVQsQ0FBa0JDLENBQWxCLEVBQXFCO0FBQ2pCLFdBQU8sUUFBUUEsQ0FBUix5Q0FBUUEsQ0FBUixHQUFXRixXQUFYLE9BQTZCLFFBQTdCLElBQXlDRSxNQUFNLElBQXREO0FBQ0g7O0FBRUQ7OztBQUdBLFNBQVNDLE9BQVQsQ0FBaUJDLElBQWpCLEVBQXVCQyxPQUF2QixFQUFnQztBQUM1QixRQUFHLEVBQUVDLE1BQU1DLE9BQU4sQ0FBY0gsSUFBZCxLQUF1QkEsS0FBS0ksTUFBOUIsQ0FBSCxFQUEwQztBQUN0QyxlQUFPLEVBQVA7QUFDSDtBQUNELFdBQU9KLEtBQ0ZLLE1BREUsQ0FDS1gsUUFETCxFQUVGWSxHQUZFLENBRUU7QUFBQSxxQkFBV0MsR0FBWDtBQUFBLEtBRkYsRUFHRkMsTUFIRSxDQUdLLFVBQUNDLEdBQUQsRUFBTUYsR0FBTjtBQUFBLGVBQ0osR0FBR0csTUFBSCxDQUFVRCxHQUFWLEVBQWVSLFVBQVUsQ0FBQ00sR0FBRCxDQUFWLEdBQWtCQSxJQUFJSSxLQUFKLENBQVUsS0FBVixDQUFqQyxDQURJO0FBQUEsS0FITCxFQUtHLEVBTEgsQ0FBUDtBQU1IOztBQUVEOzs7Ozs7Ozs7QUFTQSxTQUFTQyxPQUFULENBQWlCbEMsSUFBakIsRUFBdUJtQyxPQUF2QixFQUFnQ0MsYUFBaEMsRUFBK0NkLElBQS9DLEVBQXFEZSxXQUFyRCxFQUFrRW5DLFFBQWxFLEVBQTRFO0FBQ3hFLFFBQU1vQyxlQUFlakIsUUFBUUMsSUFBUixDQUFyQjtBQUNBLFFBQU1pQixzQkFBc0JsQixRQUFRZ0IsV0FBUixFQUFxQixJQUFyQixDQUE1Qjs7QUFFQUYsY0FBVUEsWUFBWUssU0FBWixHQUF3QkwsT0FBeEIsR0FBa0MsRUFBNUM7O0FBRUEsUUFBTU0sVUFBVSxHQUFHVCxNQUFILENBQ1pPLG1CQURZLEVBRVpELFlBRlksRUFHWixDQUFDLE9BQUQsRUFBVSxJQUFWLENBSFksRUFJWixDQUNJSCxPQURKLEVBRUksUUFGSixhQUdhQyxhQUhiLFFBSUksUUFKSixhQUthQSxhQUxiLFFBTUksUUFOSixhQU9hQSxhQVBiLHFCQVFlQSxhQVJmLENBSlksQ0FBaEI7QUFlQSxRQUFJTSxRQUFRQyxHQUFSLENBQVlDLEtBQWhCLEVBQXVCO0FBQ25CO0FBQ0FDLGdCQUFRQyxHQUFSLENBQVlDLEtBQUtDLFNBQUwsQ0FBZVAsT0FBZixFQUF3QixJQUF4QixFQUE4QixDQUE5QixDQUFaO0FBQ0g7QUFDREEsWUFBUVEsT0FBUixDQUFnQjtBQUFBLGVBQU9sRCxXQUFXQyxJQUFYLEVBQWlCNkIsR0FBakIsRUFBc0IzQixRQUF0QixDQUFQO0FBQUEsS0FBaEI7QUFDSDs7QUFFRCxJQUFJZ0QsaUJBQWlCLENBQXJCO0FBQ0EsU0FBU0MsZ0JBQVQsR0FBNEI7QUFDeEIsV0FBT0MsT0FBTyxFQUFFRixjQUFULENBQVA7QUFDSDs7QUFFRCxTQUFTRyxjQUFULENBQXdCckQsSUFBeEIsRUFBOEJzRCxTQUE5QixFQUF5Q0MsU0FBekMsRUFBb0RwQixPQUFwRCxFQUE2RGIsSUFBN0QsRUFBbUVlLFdBQW5FLEVBQWdGbkMsUUFBaEYsRUFBMEY7QUFDdEYsUUFBTWtDLGdCQUFnQmUsa0JBQXRCOztBQUVBLFFBQUluRCxTQUFTMEMsT0FBYixFQUFzQjtBQUFFO0FBQ3BCUixnQkFBUWxDLElBQVIsRUFBY21DLE9BQWQsRUFBdUJDLGFBQXZCLEVBQXNDZCxJQUF0QyxFQUE0Q2UsV0FBNUMsRUFBeURuQyxRQUF6RDtBQUNBLGVBQU9NLFFBQVFDLE9BQVIsQ0FBZ0IsRUFBRVIsTUFBTSxPQUFSLEVBQWlCdUQsT0FBTyxJQUF4QixFQUFoQixDQUFQO0FBQ0g7O0FBRUQsUUFBSUMsMEJBQUo7QUFDQSxRQUFJQyx5QkFBSjtBQUNBLFFBQUlDLGdCQUFKO0FBQ0EsUUFBSUMsZUFBSjs7QUFFQSxRQUFNQyxjQUFjLElBQUlyRCxPQUFKLENBQVksVUFBQ0MsT0FBRCxFQUFVQyxNQUFWLEVBQXFCO0FBQ2pEK0MsNEJBQW9CLDZCQUFNO0FBQ3RCL0MsbUJBQU8sSUFBSW9ELEtBQUosQ0FBVSxzREFBVixDQUFQO0FBQ0gsU0FGRDtBQUdBUixrQkFBVXpDLElBQVYsQ0FBZSxRQUFmLEVBQXlCNEMsaUJBQXpCO0FBQ0FILGtCQUFVUyxlQUFWLENBQTBCM0IsYUFBMUIsRUFBeUMzQixPQUF6QztBQUNILEtBTm1CLEVBTWpCdUQsS0FOaUIsQ0FNWCxpQkFBUztBQUFFTCxrQkFBVUgsS0FBVjtBQUFpQixLQU5qQixDQUFwQjtBQU9BLFFBQU1TLGFBQWEsSUFBSXpELE9BQUosQ0FBWSxVQUFDQyxPQUFELEVBQVVDLE1BQVYsRUFBcUI7QUFDaERnRCwyQkFBbUIsNEJBQU07QUFDckJoRCxtQkFBTyxJQUFJb0QsS0FBSixDQUFVLHNEQUFWLENBQVA7QUFDSCxTQUZEO0FBR0FQLGtCQUFVMUMsSUFBVixDQUFlLFFBQWYsRUFBeUI2QyxnQkFBekI7QUFDQUgsa0JBQVVRLGVBQVYsQ0FBMEIzQixhQUExQixFQUF5QzNCLE9BQXpDO0FBQ0gsS0FOa0IsRUFNaEJ1RCxLQU5nQixDQU1WLGlCQUFTO0FBQUVKLGlCQUFTSixLQUFUO0FBQWdCLEtBTmpCLENBQW5COztBQVFBdEIsWUFBUWxDLElBQVIsRUFBY21DLE9BQWQsRUFBdUJDLGFBQXZCLEVBQXNDZCxJQUF0QyxFQUE0Q2UsV0FBNUMsRUFBeURuQyxRQUF6RDs7QUFFQSxXQUFPTSxRQUFRMEQsR0FBUixDQUFZLENBQ2ZMLFdBRGUsRUFFZkksVUFGZSxDQUFaLEVBSUZuRCxJQUpFLENBSUcsVUFBQ3FELEdBQUQsRUFBUztBQUNYWixrQkFBVXhDLGNBQVYsQ0FBeUIsUUFBekIsRUFBbUMyQyxnQkFBbkM7QUFDQUosa0JBQVV2QyxjQUFWLENBQXlCLFFBQXpCLEVBQW1DMEMsaUJBQW5DO0FBQ0EsWUFBSUUsV0FBVyxDQUFDQyxNQUFoQixFQUF3QjtBQUNwQixrQkFBTUQsT0FBTjtBQUNILFNBRkQsTUFFTyxJQUFJQyxVQUFVLENBQUNELE9BQWYsRUFBd0I7QUFDM0Isa0JBQU1DLE1BQU47QUFDSCxTQUZNLE1BRUEsSUFBSUQsV0FBV0MsTUFBZixFQUF1QjtBQUMxQixrQkFBTSxJQUFJRSxLQUFKLENBQVUsMERBQVYsQ0FBTjtBQUNIO0FBQ0QsZUFBTztBQUNIN0Qsa0JBQU1rRSxJQUFJLENBQUosSUFBU3BCLEtBQUtxQixLQUFMLENBQVdELElBQUksQ0FBSixDQUFYLENBQVQsR0FBOEIsSUFEakM7QUFFSFgsbUJBQU9XLElBQUksQ0FBSixLQUFVO0FBRmQsU0FBUDtBQUlILEtBbEJFLENBQVA7QUFtQkg7O0FBRUQsU0FBU0UsVUFBVCxDQUFvQkMsTUFBcEIsRUFBNEI7QUFDeEIsV0FBT3pFLFNBQVMwRSxRQUFULENBQWtCRCxNQUFsQixDQUFQO0FBQ0g7QUFDRCxTQUFTRSxVQUFULENBQW9CRixNQUFwQixFQUE0QjtBQUN4QixXQUFPekUsU0FBUzRFLFFBQVQsQ0FBa0JILE1BQWxCLENBQVA7QUFDSDs7QUFFRDs7Ozs7O0FBTUEsU0FBU0ksS0FBVCxDQUFlQyxHQUFmLEVBQW9CQyxPQUFwQixFQUE2QjtBQUN6QixRQUFNQyxhQUFhQyxLQUFLQyxHQUFMLEdBQVdDLFFBQVgsRUFBbkI7QUFDQSxRQUFNaEYsT0FBT04sR0FBR2dGLEtBQUgsQ0FBU0MsR0FBVCxFQUFjLENBQUMsUUFBRCxFQUFXRSxVQUFYLEVBQXVCLFlBQXZCLEVBQXFDLE1BQXJDLEVBQTZDLElBQTdDLEVBQW1ELEdBQW5ELENBQWQsRUFBdUVELE9BQXZFLENBQWI7QUFDQSxRQUFJLENBQUNQLFdBQVdyRSxLQUFLaUYsTUFBaEIsQ0FBTCxFQUE4QjtBQUMxQkMsb0JBQVlsRixJQUFaO0FBQ0EsZUFBT1EsUUFBUUUsTUFBUixDQUFlLElBQUlvRCxLQUFKLENBQVUsc0VBQVYsQ0FBZixDQUFQO0FBQ0g7O0FBRUQsV0FBTyxJQUFJdEQsT0FBSixDQUFZLFVBQUNDLE9BQUQsRUFBVUMsTUFBVixFQUFxQjtBQUNwQyxZQUFNeUUsY0FBYyxTQUFkQSxXQUFjLENBQUNsRixJQUFELEVBQVU7QUFDMUIsZ0JBQU1tRixJQUFJbkYsS0FBSytFLFFBQUwsR0FBZ0JLLElBQWhCLEVBQVY7QUFDQTtBQUNBLGdCQUFJRCxNQUFNUCxVQUFWLEVBQXNCO0FBQ2xCcEUsd0JBQVFULElBQVI7QUFDSCxhQUZELE1BRU87QUFDSFUsdUJBQU8sSUFBSW9ELEtBQUosa0NBQXlDc0IsQ0FBekMsQ0FBUDtBQUNIO0FBQ0osU0FSRDtBQVNBcEYsYUFBS2lGLE1BQUwsQ0FBWXBFLElBQVosQ0FBaUIsTUFBakIsRUFBeUJzRSxXQUF6QjtBQUNBbkYsYUFBS2EsSUFBTCxDQUFVLE9BQVYsRUFBbUJILE1BQW5CO0FBQ0gsS0FaTSxDQUFQO0FBYUg7O0FBRUQsU0FBUzRFLGVBQVQsQ0FBeUJyRixJQUF6QixFQUErQjtBQUMzQixXQUFPQSxTQUFTc0YsT0FBT3RGLElBQVAsQ0FBVCxJQUF5QixDQUFDdUIsTUFBTUMsT0FBTixDQUFjeEIsSUFBZCxDQUFqQztBQUNIOztBQUVELFNBQVN1RixpQkFBVCxDQUEyQnZGLElBQTNCLEVBQWlDd0YsS0FBakMsRUFBd0M7QUFDcEMsUUFBTXRCLE1BQU0zQyxNQUFNQyxPQUFOLENBQWNnRSxLQUFkLElBQXVCQSxLQUF2QixHQUErQixFQUEzQztBQUNBRixXQUNLRyxJQURMLENBQ1V6RixJQURWLEVBRUtnRCxPQUZMLENBRWEsZUFBTztBQUNaLFlBQU0wQyxRQUFRMUYsS0FBSzJGLEdBQUwsQ0FBZDtBQUNBLFlBQUlwRSxNQUFNQyxPQUFOLENBQWNrRSxLQUFkLENBQUosRUFBMEI7QUFDdEJBLGtCQUFNMUMsT0FBTixDQUFjLFVBQUM0QyxDQUFELEVBQU87QUFDakIsb0JBQU1oRSxNQUFTK0QsR0FBVCxTQUFnQkMsQ0FBdEI7QUFDQTFCLG9CQUFJMkIsSUFBSixDQUFTakUsR0FBVDtBQUNILGFBSEQ7QUFJSCxTQUxELE1BS087QUFDSHNDLGdCQUFJMkIsSUFBSixDQUFZRixHQUFaLFNBQW1CRCxLQUFuQjtBQUNIO0FBQ0osS0FaTDtBQWFBLFdBQU94QixHQUFQO0FBQ0g7O0FBRUQ7Ozs7QUFJQSxTQUFTZSxXQUFULENBQXFCbEYsSUFBckIsRUFBMkI7QUFDdkIsUUFBSTBDLFFBQVFxRCxRQUFSLEtBQXFCLE9BQXpCLEVBQWtDO0FBQzlCckcsV0FBR3NHLElBQUgsMEJBQStCaEcsS0FBS2lHLEdBQXBDO0FBQ0gsS0FGRCxNQUVPO0FBQ0hqRyxhQUFLa0csSUFBTDtBQUNIO0FBQ0o7O0FBRURDLE9BQU9DLE9BQVAsR0FBaUI7QUFDYjFCLGdCQURhO0FBRWJyRSxnQkFGYTtBQUdiZ0Qsa0NBSGE7QUFJYmlDLG9DQUphO0FBS2JFLHdDQUxhO0FBTWJuRSxvQkFOYTtBQU9iYSxvQkFQYTtBQVFibEIsc0JBUmE7QUFTYkcsc0JBVGE7QUFVYmtELDBCQVZhO0FBV2JHLDBCQVhhO0FBWWJVO0FBWmEsQ0FBakIiLCJmaWxlIjoibGliLmpzIiwic291cmNlc0NvbnRlbnQiOlsiY29uc3QgY3AgPSByZXF1aXJlKCdjaGlsZF9wcm9jZXNzJylcbmNvbnN0IHsgRU9MIH0gPSByZXF1aXJlKCdvcycpXG5jb25zdCBpc1N0cmVhbSA9IHJlcXVpcmUoJ2lzLXN0cmVhbScpXG5jb25zdCBlcm90aWMgPSByZXF1aXJlKCdlcm90aWMnKVxuXG5mdW5jdGlvbiB3cml0ZVN0ZEluKHByb2MsIGRhdGEsIGVuY29kaW5nKSB7XG4gICAgLy8gY29uc29sZS5sb2coJ3dyaXRlIHN0ZGluJywgZGF0YSlcbiAgICBwcm9jLnN0ZGluLndyaXRlKGRhdGEsIGVuY29kaW5nKVxuICAgIHByb2Muc3RkaW4ud3JpdGUoRU9MLCBlbmNvZGluZylcbn1cblxuZnVuY3Rpb24gY2xvc2UocHJvYykge1xuICAgIGNvbnN0IGVyID0gZXJvdGljKClcbiAgICBsZXQgZXJySGFuZGxlclxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIGVyckhhbmRsZXIgPSAoeyBtZXNzYWdlIH0pID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGVyciA9IGVyKG1lc3NhZ2UpXG4gICAgICAgICAgICByZWplY3QoZXJyKVxuICAgICAgICB9XG4gICAgICAgIHByb2Mub25jZSgnY2xvc2UnLCByZXNvbHZlKVxuICAgICAgICBwcm9jLnN0ZGluLm9uY2UoJ2Vycm9yJywgZXJySGFuZGxlcilcbiAgICAgICAgd3JpdGVTdGRJbihwcm9jLCAnLXN0YXlfb3BlbicpXG4gICAgICAgIHdyaXRlU3RkSW4ocHJvYywgJ2ZhbHNlJylcbiAgICB9KS50aGVuKCgpID0+IHtcbiAgICAgICAgcHJvYy5zdGRpbi5yZW1vdmVMaXN0ZW5lcignZXJyb3InLCBlcnJIYW5kbGVyKVxuICAgIH0pXG59XG5cbmZ1bmN0aW9uIGlzU3RyaW5nKHMpIHtcbiAgICByZXR1cm4gKHR5cGVvZiBzKS50b0xvd2VyQ2FzZSgpID09PSAnc3RyaW5nJ1xufVxuXG5mdW5jdGlvbiBpc09iamVjdChvKSB7XG4gICAgcmV0dXJuICh0eXBlb2YgbykudG9Mb3dlckNhc2UoKSA9PT0gJ29iamVjdCcgJiYgbyAhPT0gbnVsbFxufVxuXG4vKipcbiAqIEdldCBhcmd1bWVudHMuIFNwbGl0IGJ5IG5ldyBsaW5lIHRvIHdyaXRlIHRvIGV4aWZ0b29sXG4gKi9cbmZ1bmN0aW9uIGdldEFyZ3MoYXJncywgbm9TcGxpdCkge1xuICAgIGlmKCEoQXJyYXkuaXNBcnJheShhcmdzKSAmJiBhcmdzLmxlbmd0aCkpIHtcbiAgICAgICAgcmV0dXJuIFtdXG4gICAgfVxuICAgIHJldHVybiBhcmdzXG4gICAgICAgIC5maWx0ZXIoaXNTdHJpbmcpXG4gICAgICAgIC5tYXAoYXJnID0+IGAtJHthcmd9YClcbiAgICAgICAgLnJlZHVjZSgoYWNjLCBhcmcpID0+XG4gICAgICAgICAgICBbXS5jb25jYXQoYWNjLCBub1NwbGl0ID8gW2FyZ10gOiBhcmcuc3BsaXQoL1xccysvKSlcbiAgICAgICAgICAgICwgW10pXG59XG5cbi8qKlxuICogV3JpdGUgY29tbWFuZCBkYXRhIHRvIHRoZSBleGlmdG9vbCdzIHN0ZGluLlxuICogQHBhcmFtIHtDaGlsZFByb2Nlc3N9IHByb2Nlc3MgLSBleGlmdG9vbCBwcm9jZXNzIGV4ZWN1dGVkIHdpdGggLXN0YXlfb3BlbiBUcnVlIC1AIC1cbiAqIEBwYXJhbSB7c3RyaW5nfSBjb21tYW5kIC0gd2hpY2ggY29tbWFuZCB0byBleGVjdXRlXG4gKiBAcGFyYW0ge3N0cmluZ30gY29tbWFuZE51bWJlciAtIHRleHQgd2hpY2ggd2lsbCBiZSBlY2hvZWQgYmVmb3JlIGFuZCBhZnRlciByZXN1bHRzXG4gKiBAcGFyYW0ge3N0cmluZ1tdfSBhcmdzIC0gYW55IGFkZGl0aW9uYWwgYXJndW1lbnRzXG4gKiBAcGFyYW0ge3N0cmluZ1tdfSBub1NwbGl0QXJncyAtIGFyZ3VtZW50cyB3aGljaCBzaG91bGQgbm90IGJlIGJyb2tlbiB1cCBsaWtlIGFyZ3NcbiAqIEBwYXJhbSB7c3RyaW5nfSBlbmNvZGluZyAtIHdoaWNoIGVuY29kaW5nIHRvIHdyaXRlIGluLiBkZWZhdWx0IG5vIGVuY29kaW5nXG4gKi9cbmZ1bmN0aW9uIGV4ZWN1dGUocHJvYywgY29tbWFuZCwgY29tbWFuZE51bWJlciwgYXJncywgbm9TcGxpdEFyZ3MsIGVuY29kaW5nKSB7XG4gICAgY29uc3QgZXh0ZW5kZWRBcmdzID0gZ2V0QXJncyhhcmdzKVxuICAgIGNvbnN0IGV4dGVuZGVkQXJnc05vU3BsaXQgPSBnZXRBcmdzKG5vU3BsaXRBcmdzLCB0cnVlKVxuXG4gICAgY29tbWFuZCA9IGNvbW1hbmQgIT09IHVuZGVmaW5lZCA/IGNvbW1hbmQgOiAnJ1xuXG4gICAgY29uc3QgYWxsQXJncyA9IFtdLmNvbmNhdChcbiAgICAgICAgZXh0ZW5kZWRBcmdzTm9TcGxpdCxcbiAgICAgICAgZXh0ZW5kZWRBcmdzLFxuICAgICAgICBbJy1qc29uJywgJy1zJ10sXG4gICAgICAgIFtcbiAgICAgICAgICAgIGNvbW1hbmQsXG4gICAgICAgICAgICAnLWVjaG8xJyxcbiAgICAgICAgICAgIGB7YmVnaW4ke2NvbW1hbmROdW1iZXJ9fWAsXG4gICAgICAgICAgICAnLWVjaG8yJyxcbiAgICAgICAgICAgIGB7YmVnaW4ke2NvbW1hbmROdW1iZXJ9fWAsXG4gICAgICAgICAgICAnLWVjaG80JyxcbiAgICAgICAgICAgIGB7cmVhZHkke2NvbW1hbmROdW1iZXJ9fWAsXG4gICAgICAgICAgICBgLWV4ZWN1dGUke2NvbW1hbmROdW1iZXJ9YCxcbiAgICAgICAgXVxuICAgIClcbiAgICBpZiAocHJvY2Vzcy5lbnYuREVCVUcpIHtcbiAgICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLWNvbnNvbGVcbiAgICAgICAgY29uc29sZS5sb2coSlNPTi5zdHJpbmdpZnkoYWxsQXJncywgbnVsbCwgMikpXG4gICAgfVxuICAgIGFsbEFyZ3MuZm9yRWFjaChhcmcgPT4gd3JpdGVTdGRJbihwcm9jLCBhcmcsIGVuY29kaW5nKSlcbn1cblxubGV0IGN1cnJlbnRDb21tYW5kID0gMFxuZnVuY3Rpb24gZ2VuQ29tbWFuZE51bWJlcigpIHtcbiAgICByZXR1cm4gU3RyaW5nKCsrY3VycmVudENvbW1hbmQpXG59XG5cbmZ1bmN0aW9uIGV4ZWN1dGVDb21tYW5kKHByb2MsIHN0ZG91dFJ3cywgc3RkZXJyUndzLCBjb21tYW5kLCBhcmdzLCBub1NwbGl0QXJncywgZW5jb2RpbmcpIHtcbiAgICBjb25zdCBjb21tYW5kTnVtYmVyID0gZ2VuQ29tbWFuZE51bWJlcigpXG5cbiAgICBpZiAocHJvYyA9PT0gcHJvY2VzcykgeyAvLyBkZWJ1Z2dpbmdcbiAgICAgICAgZXhlY3V0ZShwcm9jLCBjb21tYW5kLCBjb21tYW5kTnVtYmVyLCBhcmdzLCBub1NwbGl0QXJncywgZW5jb2RpbmcpXG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoeyBkYXRhOiAnZGVidWcnLCBlcnJvcjogbnVsbCB9KVxuICAgIH1cblxuICAgIGxldCBkYXRhRmluaXNoSGFuZGxlclxuICAgIGxldCBlcnJGaW5pc2hIYW5kbGVyXG4gICAgbGV0IGRhdGFFcnJcbiAgICBsZXQgZXJyRXJyXG5cbiAgICBjb25zdCBkYXRhUHJvbWlzZSA9IG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgZGF0YUZpbmlzaEhhbmRsZXIgPSAoKSA9PiB7XG4gICAgICAgICAgICByZWplY3QobmV3IEVycm9yKCdzdGRvdXQgc3RyZWFtIGZpbmlzaGVkIGJlZm9yZSBvcGVyYXRpb24gd2FzIGNvbXBsZXRlJykpXG4gICAgICAgIH1cbiAgICAgICAgc3Rkb3V0UndzLm9uY2UoJ2ZpbmlzaCcsIGRhdGFGaW5pc2hIYW5kbGVyKVxuICAgICAgICBzdGRvdXRSd3MuYWRkVG9SZXNvbHZlTWFwKGNvbW1hbmROdW1iZXIsIHJlc29sdmUpXG4gICAgfSkuY2F0Y2goZXJyb3IgPT4geyBkYXRhRXJyID0gZXJyb3IgfSlcbiAgICBjb25zdCBlcnJQcm9taXNlID0gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICBlcnJGaW5pc2hIYW5kbGVyID0gKCkgPT4ge1xuICAgICAgICAgICAgcmVqZWN0KG5ldyBFcnJvcignc3RkZXJyIHN0cmVhbSBmaW5pc2hlZCBiZWZvcmUgb3BlcmF0aW9uIHdhcyBjb21wbGV0ZScpKVxuICAgICAgICB9XG4gICAgICAgIHN0ZGVyclJ3cy5vbmNlKCdmaW5pc2gnLCBlcnJGaW5pc2hIYW5kbGVyKVxuICAgICAgICBzdGRlcnJSd3MuYWRkVG9SZXNvbHZlTWFwKGNvbW1hbmROdW1iZXIsIHJlc29sdmUpXG4gICAgfSkuY2F0Y2goZXJyb3IgPT4geyBlcnJFcnIgPSBlcnJvciB9KVxuXG4gICAgZXhlY3V0ZShwcm9jLCBjb21tYW5kLCBjb21tYW5kTnVtYmVyLCBhcmdzLCBub1NwbGl0QXJncywgZW5jb2RpbmcpXG5cbiAgICByZXR1cm4gUHJvbWlzZS5hbGwoW1xuICAgICAgICBkYXRhUHJvbWlzZSxcbiAgICAgICAgZXJyUHJvbWlzZSxcbiAgICBdKVxuICAgICAgICAudGhlbigocmVzKSA9PiB7XG4gICAgICAgICAgICBzdGRlcnJSd3MucmVtb3ZlTGlzdGVuZXIoJ2ZpbmlzaCcsIGVyckZpbmlzaEhhbmRsZXIpXG4gICAgICAgICAgICBzdGRvdXRSd3MucmVtb3ZlTGlzdGVuZXIoJ2ZpbmlzaCcsIGRhdGFGaW5pc2hIYW5kbGVyKVxuICAgICAgICAgICAgaWYgKGRhdGFFcnIgJiYgIWVyckVycikge1xuICAgICAgICAgICAgICAgIHRocm93IGRhdGFFcnJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZXJyRXJyICYmICFkYXRhRXJyKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgZXJyRXJyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKGRhdGFFcnIgJiYgZXJyRXJyKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdzdGRvdXQgYW5kIHN0ZGVyciBmaW5pc2hlZCBiZWZvcmUgb3BlcmF0aW9uIHdhcyBjb21wbGV0ZScpXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIGRhdGE6IHJlc1swXSA/IEpTT04ucGFyc2UocmVzWzBdKSA6IG51bGwsXG4gICAgICAgICAgICAgICAgZXJyb3I6IHJlc1sxXSB8fCBudWxsLFxuICAgICAgICAgICAgfVxuICAgICAgICB9KVxufVxuXG5mdW5jdGlvbiBpc1JlYWRhYmxlKHN0cmVhbSkge1xuICAgIHJldHVybiBpc1N0cmVhbS5yZWFkYWJsZShzdHJlYW0pXG59XG5mdW5jdGlvbiBpc1dyaXRhYmxlKHN0cmVhbSkge1xuICAgIHJldHVybiBpc1N0cmVhbS53cml0YWJsZShzdHJlYW0pXG59XG5cbi8qKlxuICogU3Bhd24gZXhpZnRvb2wuXG4gKiBAcGFyYW0ge3N0cmluZ30gYmluIFBhdGggdG8gdGhlIGJpbmFyeVxuICogQHBhcmFtIHtvYmplY3R9IFtvcHRpb25zXSBvcHRpb25zIHRvIHBhc3MgdG8gY2hpbGRfcHJvY2Vzcy5zcGF3biBtZXRob2RcbiAqIEByZXR1cm5zIHtQcm9taXNlLjxDaGlsZFByb2Nlc3M+fSBBIHByb21pc2UgcmVzb2x2ZWQgd2l0aCB0aGUgcHJvY2VzcyBwb2ludGVyLCBvciByZWplY3RlZCBvbiBlcnJvci5cbiAqL1xuZnVuY3Rpb24gc3Bhd24oYmluLCBvcHRpb25zKSB7XG4gICAgY29uc3QgZWNob1N0cmluZyA9IERhdGUubm93KCkudG9TdHJpbmcoKVxuICAgIGNvbnN0IHByb2MgPSBjcC5zcGF3bihiaW4sIFsnLWVjaG8yJywgZWNob1N0cmluZywgJy1zdGF5X29wZW4nLCAnVHJ1ZScsICctQCcsICctJ10sIG9wdGlvbnMpXG4gICAgaWYgKCFpc1JlYWRhYmxlKHByb2Muc3RkZXJyKSkge1xuICAgICAgICBraWxsUHJvY2Vzcyhwcm9jKVxuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IEVycm9yKCdQcm9jZXNzIHdhcyBub3Qgc3Bhd25lZCB3aXRoIGEgcmVhZGFibGUgc3RkZXJyLCBjaGVjayBzdGRpbyBvcHRpb25zLicpKVxuICAgIH1cblxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIGNvbnN0IGVjaG9IYW5kbGVyID0gKGRhdGEpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGQgPSBkYXRhLnRvU3RyaW5nKCkudHJpbSgpXG4gICAgICAgICAgICAvLyBsaXN0ZW5pbmcgZm9yIGVjaG8yIGluIHN0ZGVyciAoZWNobyBhbmQgZWNobzEgd29uJ3Qgd29yaylcbiAgICAgICAgICAgIGlmIChkID09PSBlY2hvU3RyaW5nKSB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZShwcm9jKVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZWplY3QobmV3IEVycm9yKGBVbmV4cGVjdGVkIHN0cmluZyBvbiBzdGFydDogJHtkfWApKVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHByb2Muc3RkZXJyLm9uY2UoJ2RhdGEnLCBlY2hvSGFuZGxlcilcbiAgICAgICAgcHJvYy5vbmNlKCdlcnJvcicsIHJlamVjdClcbiAgICB9KVxufVxuXG5mdW5jdGlvbiBjaGVja0RhdGFPYmplY3QoZGF0YSkge1xuICAgIHJldHVybiBkYXRhID09PSBPYmplY3QoZGF0YSkgJiYgIUFycmF5LmlzQXJyYXkoZGF0YSlcbn1cblxuZnVuY3Rpb24gbWFwRGF0YVRvVGFnQXJyYXkoZGF0YSwgYXJyYXkpIHtcbiAgICBjb25zdCByZXMgPSBBcnJheS5pc0FycmF5KGFycmF5KSA/IGFycmF5IDogW11cbiAgICBPYmplY3RcbiAgICAgICAgLmtleXMoZGF0YSlcbiAgICAgICAgLmZvckVhY2godGFnID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHZhbHVlID0gZGF0YVt0YWddXG4gICAgICAgICAgICBpZiAoQXJyYXkuaXNBcnJheSh2YWx1ZSkpIHtcbiAgICAgICAgICAgICAgICB2YWx1ZS5mb3JFYWNoKCh2KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGFyZyA9IGAke3RhZ309JHt2fWBcbiAgICAgICAgICAgICAgICAgICAgcmVzLnB1c2goYXJnKVxuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJlcy5wdXNoKGAke3RhZ309JHt2YWx1ZX1gKVxuICAgICAgICAgICAgfVxuICAgICAgICB9KVxuICAgIHJldHVybiByZXNcbn1cblxuLyoqXG4gKiBVc2UgcHJvY2Vzcy5raWxsIG9uIFBPU0lYIG9yIHRlcm1pbmF0ZSBwcm9jZXNzIHdpdGggdGFza2tpbGwgb24gV2luZG93cy5cbiAqIEBwYXJhbSB7Q2hpbGRQcm9jZXNzfSBwcm9jIFByb2Nlc3MgdG8gdGVybWluYXRlXG4gKi9cbmZ1bmN0aW9uIGtpbGxQcm9jZXNzKHByb2MpIHtcbiAgICBpZiAocHJvY2Vzcy5wbGF0Zm9ybSA9PT0gJ3dpbjMyJykge1xuICAgICAgICBjcC5leGVjKGB0YXNra2lsbCAvdCAvRiAvUElEICR7cHJvYy5waWR9YClcbiAgICB9IGVsc2Uge1xuICAgICAgICBwcm9jLmtpbGwoKVxuICAgIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgc3Bhd24sXG4gICAgY2xvc2UsXG4gICAgZXhlY3V0ZUNvbW1hbmQsXG4gICAgY2hlY2tEYXRhT2JqZWN0LFxuICAgIG1hcERhdGFUb1RhZ0FycmF5LFxuICAgIGdldEFyZ3MsXG4gICAgZXhlY3V0ZSxcbiAgICBpc1N0cmluZyxcbiAgICBpc09iamVjdCxcbiAgICBpc1JlYWRhYmxlLFxuICAgIGlzV3JpdGFibGUsXG4gICAga2lsbFByb2Nlc3MsXG59XG4iXX0=