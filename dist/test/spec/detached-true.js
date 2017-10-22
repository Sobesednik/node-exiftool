'use strict';

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

require('source-map-support/register');

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var makepromise = require('makepromise');
var ps = require('ps-node');
var assert = require('assert');
var killPid = require('../lib/kill-pid');

var exiftool = require('../../src/');
var context = require('../context/detached');
context.globalExiftoolConstructor = exiftool.ExiftoolProcess;

var isWindows = process.platform === 'win32';

var checkPid = function checkPid(pid) {
    return makepromise(ps.lookup, { pid: pid });
};
var checkPpid = function checkPpid(ppid) {
    return makepromise(ps.lookup, { ppid: ppid });
};

/**
 * @typedef {Object} PSRes
 * @property {string} pid
 * @property {string} command
 * @property {string[]} arguments
 * @property {string} ppid
 */

/**
 * @typedef {Object} CheckPidsRes
 * @property {PSRes} [fork]
 * @property {PSRes} [ep]
 * @property {PSRes} [epChild]
 * @property {PSRes} [conhost]
 */

/**
 * @typedef {function(): Promise.<CheckPidsRes>} CheckPidsFn
 */

/**
 * Create checkPids function.
 * @param {string|number} forkPid pid of Node fork
 * @param {string|number} epPid exiftool pid
 * @param {string|number} [epChildPid] on windows, child ep pid
 * @param {string|number} [conhostPid] on windows, child conhost pid
 * @returns {CheckPidsFn} Function to check pids with ps-node
 */
function createCheckPids(forkPid, epPid, epChildPid, conhostPid) {
    assert(forkPid);
    assert(epPid);
    var arr = [forkPid, epPid];
    if (epChildPid) arr.push(epChildPid);
    if (conhostPid) arr.push(conhostPid);
    var checkPids = function checkPids() {
        return checkPid(arr).then(function (res) {
            var fork = res.find(function (r) {
                return r.pid === '' + forkPid;
            });
            var ep = res.find(function (r) {
                return r.pid === '' + epPid;
            });
            var epChild = epChildPid ? res.find(function (r) {
                return r.pid === '' + epChildPid;
            }) : undefined;
            var conhost = conhostPid ? res.find(function (r) {
                return r.pid === '' + conhostPid;
            }) : undefined;
            var o = {
                fork: fork,
                ep: ep,
                epChild: epChild,
                conhost: conhost
                // filter out undefined
            };var fo = Object.keys(o).reduce(function (acc, key) {
                var value = o[key];
                if (value === undefined) {
                    return acc;
                }
                return Object.assign({}, acc, _defineProperty({}, key, value));
            }, {});
            return fo;
        });
    };
    return checkPids;
}

var findExiftoolChildAndConhost = function findExiftoolChildAndConhost(epPid, exiftoolDetached) {
    if (!isWindows) {
        return Promise.reject(new Error('This function is only available on Windows'));
    }
    return checkPpid(epPid).then(function (res) {
        // if not detached, conhost is child of parent exiftool,
        // which is already found above
        if (!exiftoolDetached) return res;
        // if detached, conhost is child of child exiftool,
        // which we are now finding

        var _res = _slicedToArray(res, 1),
            childExiftool = _res[0];

        assert(childExiftool);
        assert(/exiftool\.exe/.test(childExiftool.command));
        return checkPpid(childExiftool.pid).then(function (conhostRes) {
            var _conhostRes = _slicedToArray(conhostRes, 1),
                conhost = _conhostRes[0];

            assert(conhost);
            assert(/conhost.exe/.test(conhost.command));
            var all = [].concat(conhostRes, res);
            return all;
        });
    }).then(function (res) {
        assert.equal(res.length, 2);
        var conhost = res.find(function (p) {
            return (/conhost\.exe/.test(p.command)
            );
        });
        assert(conhost, 'conhost.exe should have been started as child of exiftool');
        var conhostPid = conhost.pid;
        var epChild = res.find(function (p) {
            return (/exiftool\.exe/.test(p.command)
            );
        });
        assert(epChild, 'exiftool.exe should have been started as child of exiftool');
        var epChildPid = epChild.pid;
        return { conhostPid: conhostPid, epChildPid: epChildPid };
    });
};

/**
 * Fork a node process with a module which will spawn exiftool. Because of the
 * way exiftool works on Windows, it will spawn an extra process itself.
 * @param {boolean} exiftoolDetached Whether to start exiftool in detached mode
 * @returns {CheckPidsFn} A scoped function to check pids
 */
var setup = function setup(exiftoolDetached, ctx) {
    var checkPids = void 0;

    return ctx.forkNode(exiftoolDetached).then(function (_ref) {
        var forkPid = _ref.forkPid,
            epPid = _ref.epPid;

        var res = { forkPid: forkPid, epPid: epPid };

        if (isWindows) {
            return findExiftoolChildAndConhost(epPid, exiftoolDetached).then(function (r) {
                return Object.assign(res, r);
            });
        }
        return res;
    }).then(function (res) {
        checkPids = createCheckPids(res.forkPid, res.epPid, res.epChildPid, res.conhostPid);
        return checkPids();
    }).then(function (res) {
        assert(res.fork);
        assert(res.ep);
        if (isWindows) {
            assert(res.epChild);
            assert(res.conhost);
        }
        return checkPids;
    });
};

var createTestWin = function createTestWin(detached) {
    var test = function test(ctx) {
        var checkPids = void 0;
        return setup(detached, ctx).then(function (res) {
            checkPids = res;
            return ctx.killFork().then(checkPids);
        }).then(function (res) {
            assert(!res.fork, 'Node fork should have quit');
            assert(res.epChild, 'Exiftool child should stay open');
            assert(res.conhost, 'conhost should stay open');

            if (detached) {
                assert(res.ep, 'Exiftool parent should stay open');
            } else {
                assert(!res.ep, 'Exiftool parent should have quit');
            }

            // cleanup by killing child exiftool, this should kill the whole tree
            return killPid(res.epChild.pid);
        });
    };
    return test;
};

var createTest = function createTest(detached) {
    var test = function test(ctx) {
        var checkPids = void 0;
        return setup(detached, ctx).then(function (res) {
            checkPids = res;
            return ctx.killFork(true).then(checkPids);
        }).then(function (res) {
            assert(!res.fork, 'Node fork should have quit');

            if (detached) {
                assert(res.ep, 'Exiftool parent should stay open');
                return killPid(res.ep.pid);
            } else {
                assert(!res.ep, 'Exiftool parent should have quit');
            }
        });
    };
    return test;
};

var DetachedTrueTestSuite = {};

if (isWindows) {
    Object.assign(DetachedTrueTestSuite, {
        context: context,
        'should quit child process when fork exits without detached option (win)': createTestWin(),
        'should not quit child process when fork exits with detached option (win)': createTestWin(true)
    });
} else {
    Object.assign(DetachedTrueTestSuite, {
        context: context,
        // Also note: on Linux, child processes of child processes will not be terminated when attempting to kill their parent.
        // kill detached fork by passing -pid (i.e., pgid)
        // https://nodejs.org/api/child_process.html#child_process_subprocess_kill_signal
        'should quit child process when fork exits without detached option': createTest(),
        'should not quit child process when fork exits with detached option': createTest(true)
    });
}

module.exports = DetachedTrueTestSuite;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3Rlc3Qvc3BlYy9kZXRhY2hlZC10cnVlLmpzIl0sIm5hbWVzIjpbIm1ha2Vwcm9taXNlIiwicmVxdWlyZSIsInBzIiwiYXNzZXJ0Iiwia2lsbFBpZCIsImV4aWZ0b29sIiwiY29udGV4dCIsImdsb2JhbEV4aWZ0b29sQ29uc3RydWN0b3IiLCJFeGlmdG9vbFByb2Nlc3MiLCJpc1dpbmRvd3MiLCJwcm9jZXNzIiwicGxhdGZvcm0iLCJjaGVja1BpZCIsImxvb2t1cCIsInBpZCIsImNoZWNrUHBpZCIsInBwaWQiLCJjcmVhdGVDaGVja1BpZHMiLCJmb3JrUGlkIiwiZXBQaWQiLCJlcENoaWxkUGlkIiwiY29uaG9zdFBpZCIsImFyciIsInB1c2giLCJjaGVja1BpZHMiLCJ0aGVuIiwicmVzIiwiZm9yayIsImZpbmQiLCJyIiwiZXAiLCJlcENoaWxkIiwidW5kZWZpbmVkIiwiY29uaG9zdCIsIm8iLCJmbyIsIk9iamVjdCIsImtleXMiLCJyZWR1Y2UiLCJhY2MiLCJrZXkiLCJ2YWx1ZSIsImFzc2lnbiIsImZpbmRFeGlmdG9vbENoaWxkQW5kQ29uaG9zdCIsImV4aWZ0b29sRGV0YWNoZWQiLCJQcm9taXNlIiwicmVqZWN0IiwiRXJyb3IiLCJjaGlsZEV4aWZ0b29sIiwidGVzdCIsImNvbW1hbmQiLCJjb25ob3N0UmVzIiwiYWxsIiwiY29uY2F0IiwiZXF1YWwiLCJsZW5ndGgiLCJwIiwic2V0dXAiLCJjdHgiLCJmb3JrTm9kZSIsImNyZWF0ZVRlc3RXaW4iLCJkZXRhY2hlZCIsImtpbGxGb3JrIiwiY3JlYXRlVGVzdCIsIkRldGFjaGVkVHJ1ZVRlc3RTdWl0ZSIsIm1vZHVsZSIsImV4cG9ydHMiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7O0FBQUEsSUFBTUEsY0FBY0MsUUFBUSxhQUFSLENBQXBCO0FBQ0EsSUFBTUMsS0FBS0QsUUFBUSxTQUFSLENBQVg7QUFDQSxJQUFNRSxTQUFTRixRQUFRLFFBQVIsQ0FBZjtBQUNBLElBQU1HLFVBQVVILFFBQVEs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O0FBQ0EsdUJBQU8xQixRQUFRc0IsSUFBSUksRUFBSixDQUFPaEIsR0FBZixDQUFQO0FBQ0gsYUFIRCxNQUdPO0FBQ0hYLHVCQUFPLENBQUN1QixJQUFJSSxFQUFaLEVBQWdCLGtDQUFoQjtBQUNIO0FBQ0osU0FkRSxDQUFQO0FBZUgsS0FqQkQ7QUFrQkEsV0FBT21CLElBQVA7QUFDSCxDQXBCRDs7QUFzQkEsSUFBTWUsd0JBQXdCLEVBQTlCOztBQUVBLElBQUl2RCxTQUFKLEVBQWU7QUFDWDJCLFdBQU9NLE1BQVAsQ0FBY3NCLHFCQUFkLEVBQXFDO0FBQ2pDMUQsd0JBRGlDO0FBRWpDLG1GQUEyRXNELGVBRjFDO0FBR2pDLG9GQUE0RUEsY0FBYyxJQUFkO0FBSDNDLEtBQXJDO0FBS0gsQ0FORCxNQU1PO0FBQ0h4QixXQUFPTSxNQUFQLENBQWNzQixxQkFBZCxFQUFxQztBQUNqQzFELHdCQURpQztBQUVqQztBQUNBO0FBQ0E7QUFDQSw2RUFBcUV5RCxZQUxwQztBQU1qQyw4RUFBc0VBLFdBQVcsSUFBWDtBQU5yQyxLQUFyQztBQVFIOztBQUdERSxPQUFPQyxPQUFQLEdBQWlCRixxQkFBakIiLCJmaWxlIjoiZGV0YWNoZWQtdHJ1ZS5qcyIsInNvdXJjZXNDb250ZW50IjpbImNvbnN0IG1ha2Vwcm9taXNlID0gcmVxdWlyZSgnbWFrZXByb21pc2UnKVxuY29uc3QgcHMgPSByZXF1aXJlKCdwcy1ub2RlJylcbmNvbnN0IGFzc2VydCA9IHJlcXVpcmUoJ2Fzc2VydCcpXG5jb25zdCBraWxsUGlkID0gcmVxdWlyZSgnLi4vbGliL2tpbGwtcGlkJylcblxuY29uc3QgZXhpZnRvb2wgPSByZXF1aXJlKCcuLi8uLi9zcmMvJylcbmNvbnN0IGNvbnRleHQgPSByZXF1aXJlKCcuLi9jb250ZXh0L2RldGFjaGVkJylcbmNvbnRleHQuZ2xvYmFsRXhpZnRvb2xDb25zdHJ1Y3RvciA9IGV4aWZ0b29sLkV4aWZ0b29sUHJvY2Vzc1xuXG5jb25zdCBpc1dpbmRvd3MgPSBwcm9jZXNzLnBsYXRmb3JtID09PSAnd2luMzInXG5cbmNvbnN0IGNoZWNrUGlkID0gcGlkID0+IG1ha2Vwcm9taXNlKHBzLmxvb2t1cCwgeyBwaWQgfSlcbmNvbnN0IGNoZWNrUHBpZCA9IHBwaWQgPT4gbWFrZXByb21pc2UocHMubG9va3VwLCB7IHBwaWQgfSlcblxuLyoqXG4gKiBAdHlwZWRlZiB7T2JqZWN0fSBQU1Jlc1xuICogQHByb3BlcnR5IHtzdHJpbmd9IHBpZFxuICogQHByb3BlcnR5IHtzdHJpbmd9IGNvbW1hbmRcbiAqIEBwcm9wZXJ0eSB7c3RyaW5nW119IGFyZ3VtZW50c1xuICogQHByb3BlcnR5IHtzdHJpbmd9IHBwaWRcbiAqL1xuXG4vKipcbiAqIEB0eXBlZGVmIHtPYmplY3R9IENoZWNrUGlkc1Jlc1xuICogQHByb3BlcnR5IHtQU1Jlc30gW2ZvcmtdXG4gKiBAcHJvcGVydHkge1BTUmVzfSBbZXBdXG4gKiBAcHJvcGVydHkge1BTUmVzfSBbZXBDaGlsZF1cbiAqIEBwcm9wZXJ0eSB7UFNSZXN9IFtjb25ob3N0XVxuICovXG5cbi8qKlxuICogQHR5cGVkZWYge2Z1bmN0aW9uKCk6IFByb21pc2UuPENoZWNrUGlkc1Jlcz59IENoZWNrUGlkc0ZuXG4gKi9cblxuLyoqXG4gKiBDcmVhdGUgY2hlY2tQaWRzIGZ1bmN0aW9uLlxuICogQHBhcmFtIHtzdHJpbmd8bnVtYmVyfSBmb3JrUGlkIHBpZCBvZiBOb2RlIGZvcmtcbiAqIEBwYXJhbSB7c3RyaW5nfG51bWJlcn0gZXBQaWQgZXhpZnRvb2wgcGlkXG4gKiBAcGFyYW0ge3N0cmluZ3xudW1iZXJ9IFtlcENoaWxkUGlkXSBvbiB3aW5kb3dzLCBjaGlsZCBlcCBwaWRcbiAqIEBwYXJhbSB7c3RyaW5nfG51bWJlcn0gW2Nvbmhvc3RQaWRdIG9uIHdpbmRvd3MsIGNoaWxkIGNvbmhvc3QgcGlkXG4gKiBAcmV0dXJucyB7Q2hlY2tQaWRzRm59IEZ1bmN0aW9uIHRvIGNoZWNrIHBpZHMgd2l0aCBwcy1ub2RlXG4gKi9cbmZ1bmN0aW9uIGNyZWF0ZUNoZWNrUGlkcyhmb3JrUGlkLCBlcFBpZCwgZXBDaGlsZFBpZCwgY29uaG9zdFBpZCkge1xuICAgIGFzc2VydChmb3JrUGlkKVxuICAgIGFzc2VydChlcFBpZClcbiAgICBjb25zdCBhcnIgPSBbZm9ya1BpZCwgZXBQaWRdXG4gICAgaWYgKGVwQ2hpbGRQaWQpIGFyci5wdXNoKGVwQ2hpbGRQaWQpXG4gICAgaWYgKGNvbmhvc3RQaWQpIGFyci5wdXNoKGNvbmhvc3RQaWQpXG4gICAgY29uc3QgY2hlY2tQaWRzID0gKCkgPT4gY2hlY2tQaWQoYXJyKVxuICAgICAgICAudGhlbigocmVzKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBmb3JrID0gcmVzLmZpbmQociA9PiByLnBpZCA9PT0gYCR7Zm9ya1BpZH1gKVxuICAgICAgICAgICAgY29uc3QgZXAgPSByZXMuZmluZChyID0+IHIucGlkID09PSBgJHtlcFBpZH1gKVxuICAgICAgICAgICAgY29uc3QgZXBDaGlsZCA9IGVwQ2hpbGRQaWQgPyByZXMuZmluZChyID0+IHIucGlkID09PSBgJHtlcENoaWxkUGlkfWApIDogdW5kZWZpbmVkXG4gICAgICAgICAgICBjb25zdCBjb25ob3N0ID0gY29uaG9zdFBpZCA/IHJlcy5maW5kKHIgPT4gci5waWQgPT09IGAke2Nvbmhvc3RQaWR9YCkgOiB1bmRlZmluZWRcbiAgICAgICAgICAgIGNvbnN0IG8gPSB7XG4gICAgICAgICAgICAgICAgZm9yayxcbiAgICAgICAgICAgICAgICBlcCxcbiAgICAgICAgICAgICAgICBlcENoaWxkLFxuICAgICAgICAgICAgICAgIGNvbmhvc3QsXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBmaWx0ZXIgb3V0IHVuZGVmaW5lZFxuICAgICAgICAgICAgY29uc3QgZm8gPSBPYmplY3Qua2V5cyhvKS5yZWR1Y2UoKGFjYywga2V5KSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgdmFsdWUgPSBvW2tleV1cbiAgICAgICAgICAgICAgICBpZiAodmFsdWUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gYWNjXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBPYmplY3QuYXNzaWduKHt9LCBhY2MsIHtcbiAgICAgICAgICAgICAgICAgICAgW2tleV06IHZhbHVlLFxuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICB9LCB7fSlcbiAgICAgICAgICAgIHJldHVybiBmb1xuICAgICAgICB9KVxuICAgIHJldHVybiBjaGVja1BpZHNcbn1cblxuY29uc3QgZmluZEV4aWZ0b29sQ2hpbGRBbmRDb25ob3N0ID0gKGVwUGlkLCBleGlmdG9vbERldGFjaGVkKSA9PiB7XG4gICAgaWYgKCFpc1dpbmRvd3MpIHtcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyBFcnJvcignVGhpcyBmdW5jdGlvbiBpcyBvbmx5IGF2YWlsYWJsZSBvbiBXaW5kb3dzJykpXG4gICAgfVxuICAgIHJldHVybiBjaGVja1BwaWQoZXBQaWQpXG4gICAgICAgIC50aGVuKChyZXMpID0+IHtcbiAgICAgICAgICAgIC8vIGlmIG5vdCBkZXRhY2hlZCwgY29uaG9zdCBpcyBjaGlsZCBvZiBwYXJlbnQgZXhpZnRvb2wsXG4gICAgICAgICAgICAvLyB3aGljaCBpcyBhbHJlYWR5IGZvdW5kIGFib3ZlXG4gICAgICAgICAgICBpZiAoIWV4aWZ0b29sRGV0YWNoZWQpIHJldHVybiByZXNcbiAgICAgICAgICAgIC8vIGlmIGRldGFjaGVkLCBjb25ob3N0IGlzIGNoaWxkIG9mIGNoaWxkIGV4aWZ0b29sLFxuICAgICAgICAgICAgLy8gd2hpY2ggd2UgYXJlIG5vdyBmaW5kaW5nXG4gICAgICAgICAgICBjb25zdCBbY2hpbGRFeGlmdG9vbF0gPSByZXNcbiAgICAgICAgICAgIGFzc2VydChjaGlsZEV4aWZ0b29sKVxuICAgICAgICAgICAgYXNzZXJ0KC9leGlmdG9vbFxcLmV4ZS8udGVzdChjaGlsZEV4aWZ0b29sLmNvbW1hbmQpKVxuICAgICAgICAgICAgcmV0dXJuIGNoZWNrUHBpZChjaGlsZEV4aWZ0b29sLnBpZCkudGhlbigoY29uaG9zdFJlcykgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IFtjb25ob3N0XSA9IGNvbmhvc3RSZXNcbiAgICAgICAgICAgICAgICBhc3NlcnQoY29uaG9zdClcbiAgICAgICAgICAgICAgICBhc3NlcnQoL2Nvbmhvc3QuZXhlLy50ZXN0KGNvbmhvc3QuY29tbWFuZCkpXG4gICAgICAgICAgICAgICAgY29uc3QgYWxsID0gW10uY29uY2F0KGNvbmhvc3RSZXMsIHJlcylcbiAgICAgICAgICAgICAgICByZXR1cm4gYWxsXG4gICAgICAgICAgICB9KVxuICAgICAgICB9KVxuICAgICAgICAudGhlbigocmVzKSA9PiB7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwocmVzLmxlbmd0aCwgMilcbiAgICAgICAgICAgIGNvbnN0IGNvbmhvc3QgPSByZXMuZmluZChwID0+IC9jb25ob3N0XFwuZXhlLy50ZXN0KHAuY29tbWFuZCkpXG4gICAgICAgICAgICBhc3NlcnQoY29uaG9zdCwgJ2Nvbmhvc3QuZXhlIHNob3VsZCBoYXZlIGJlZW4gc3RhcnRlZCBhcyBjaGlsZCBvZiBleGlmdG9vbCcpXG4gICAgICAgICAgICBjb25zdCBjb25ob3N0UGlkID0gY29uaG9zdC5waWRcbiAgICAgICAgICAgIGNvbnN0IGVwQ2hpbGQgPSByZXMuZmluZChwID0+IC9leGlmdG9vbFxcLmV4ZS8udGVzdChwLmNvbW1hbmQpKVxuICAgICAgICAgICAgYXNzZXJ0KGVwQ2hpbGQsICdleGlmdG9vbC5leGUgc2hvdWxkIGhhdmUgYmVlbiBzdGFydGVkIGFzIGNoaWxkIG9mIGV4aWZ0b29sJylcbiAgICAgICAgICAgIGNvbnN0IGVwQ2hpbGRQaWQgPSBlcENoaWxkLnBpZFxuICAgICAgICAgICAgcmV0dXJuIHsgY29uaG9zdFBpZCwgZXBDaGlsZFBpZCB9XG4gICAgICAgIH0pXG59XG5cbi8qKlxuICogRm9yayBhIG5vZGUgcHJvY2VzcyB3aXRoIGEgbW9kdWxlIHdoaWNoIHdpbGwgc3Bhd24gZXhpZnRvb2wuIEJlY2F1c2Ugb2YgdGhlXG4gKiB3YXkgZXhpZnRvb2wgd29ya3Mgb24gV2luZG93cywgaXQgd2lsbCBzcGF3biBhbiBleHRyYSBwcm9jZXNzIGl0c2VsZi5cbiAqIEBwYXJhbSB7Ym9vbGVhbn0gZXhpZnRvb2xEZXRhY2hlZCBXaGV0aGVyIHRvIHN0YXJ0IGV4aWZ0b29sIGluIGRldGFjaGVkIG1vZGVcbiAqIEByZXR1cm5zIHtDaGVja1BpZHNGbn0gQSBzY29wZWQgZnVuY3Rpb24gdG8gY2hlY2sgcGlkc1xuICovXG5jb25zdCBzZXR1cCA9IChleGlmdG9vbERldGFjaGVkLCBjdHgpID0+IHtcbiAgICBsZXQgY2hlY2tQaWRzXG5cbiAgICByZXR1cm4gY3R4LmZvcmtOb2RlKGV4aWZ0b29sRGV0YWNoZWQpXG4gICAgICAgIC50aGVuKCh7IGZvcmtQaWQsIGVwUGlkIH0pID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHJlcyA9IHsgZm9ya1BpZCwgZXBQaWQgfVxuXG4gICAgICAgICAgICBpZiAoaXNXaW5kb3dzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZpbmRFeGlmdG9vbENoaWxkQW5kQ29uaG9zdChlcFBpZCwgZXhpZnRvb2xEZXRhY2hlZClcbiAgICAgICAgICAgICAgICAgICAgLnRoZW4ociA9PiBPYmplY3QuYXNzaWduKHJlcywgcikpXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gcmVzXG4gICAgICAgIH0pXG4gICAgICAgIC50aGVuKChyZXMpID0+IHtcbiAgICAgICAgICAgIGNoZWNrUGlkcyA9IGNyZWF0ZUNoZWNrUGlkcyhyZXMuZm9ya1BpZCwgcmVzLmVwUGlkLCByZXMuZXBDaGlsZFBpZCwgcmVzLmNvbmhvc3RQaWQpXG4gICAgICAgICAgICByZXR1cm4gY2hlY2tQaWRzKClcbiAgICAgICAgfSlcbiAgICAgICAgLnRoZW4oKHJlcykgPT4ge1xuICAgICAgICAgICAgYXNzZXJ0KHJlcy5mb3JrKVxuICAgICAgICAgICAgYXNzZXJ0KHJlcy5lcClcbiAgICAgICAgICAgIGlmIChpc1dpbmRvd3MpIHtcbiAgICAgICAgICAgICAgICBhc3NlcnQocmVzLmVwQ2hpbGQpXG4gICAgICAgICAgICAgICAgYXNzZXJ0KHJlcy5jb25ob3N0KVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGNoZWNrUGlkc1xuICAgICAgICB9KVxufVxuXG5jb25zdCBjcmVhdGVUZXN0V2luID0gKGRldGFjaGVkKSA9PiB7XG4gICAgY29uc3QgdGVzdCA9IChjdHgpID0+IHtcbiAgICAgICAgbGV0IGNoZWNrUGlkc1xuICAgICAgICByZXR1cm4gc2V0dXAoZGV0YWNoZWQsIGN0eClcbiAgICAgICAgICAgIC50aGVuKChyZXMpID0+IHtcbiAgICAgICAgICAgICAgICBjaGVja1BpZHMgPSByZXNcbiAgICAgICAgICAgICAgICByZXR1cm4gY3R4LmtpbGxGb3JrKCkudGhlbihjaGVja1BpZHMpXG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLnRoZW4oKHJlcykgPT4ge1xuICAgICAgICAgICAgICAgIGFzc2VydCghcmVzLmZvcmssICdOb2RlIGZvcmsgc2hvdWxkIGhhdmUgcXVpdCcpXG4gICAgICAgICAgICAgICAgYXNzZXJ0KHJlcy5lcENoaWxkLCAnRXhpZnRvb2wgY2hpbGQgc2hvdWxkIHN0YXkgb3BlbicpXG4gICAgICAgICAgICAgICAgYXNzZXJ0KHJlcy5jb25ob3N0LCAnY29uaG9zdCBzaG91bGQgc3RheSBvcGVuJylcblxuICAgICAgICAgICAgICAgIGlmIChkZXRhY2hlZCkge1xuICAgICAgICAgICAgICAgICAgICBhc3NlcnQocmVzLmVwLCAnRXhpZnRvb2wgcGFyZW50IHNob3VsZCBzdGF5IG9wZW4nKVxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGFzc2VydCghcmVzLmVwLCAnRXhpZnRvb2wgcGFyZW50IHNob3VsZCBoYXZlIHF1aXQnKVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIGNsZWFudXAgYnkga2lsbGluZyBjaGlsZCBleGlmdG9vbCwgdGhpcyBzaG91bGQga2lsbCB0aGUgd2hvbGUgdHJlZVxuICAgICAgICAgICAgICAgIHJldHVybiBraWxsUGlkKHJlcy5lcENoaWxkLnBpZClcbiAgICAgICAgICAgIH0pXG4gICAgfVxuICAgIHJldHVybiB0ZXN0XG59XG5cbmNvbnN0IGNyZWF0ZVRlc3QgPSAoZGV0YWNoZWQpID0+IHtcbiAgICBjb25zdCB0ZXN0ID0gKGN0eCkgPT4ge1xuICAgICAgICBsZXQgY2hlY2tQaWRzXG4gICAgICAgIHJldHVybiBzZXR1cChkZXRhY2hlZCwgY3R4KVxuICAgICAgICAgICAgLnRoZW4oKHJlcykgPT4ge1xuICAgICAgICAgICAgICAgIGNoZWNrUGlkcyA9IHJlc1xuICAgICAgICAgICAgICAgIHJldHVybiBjdHgua2lsbEZvcmsodHJ1ZSkudGhlbihjaGVja1BpZHMpXG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLnRoZW4oKHJlcykgPT4ge1xuICAgICAgICAgICAgICAgIGFzc2VydCghcmVzLmZvcmssICdOb2RlIGZvcmsgc2hvdWxkIGhhdmUgcXVpdCcpXG5cbiAgICAgICAgICAgICAgICBpZiAoZGV0YWNoZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgYXNzZXJ0KHJlcy5lcCwgJ0V4aWZ0b29sIHBhcmVudCBzaG91bGQgc3RheSBvcGVuJylcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGtpbGxQaWQocmVzLmVwLnBpZClcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBhc3NlcnQoIXJlcy5lcCwgJ0V4aWZ0b29sIHBhcmVudCBzaG91bGQgaGF2ZSBxdWl0JylcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KVxuICAgIH1cbiAgICByZXR1cm4gdGVzdFxufVxuXG5jb25zdCBEZXRhY2hlZFRydWVUZXN0U3VpdGUgPSB7fVxuXG5pZiAoaXNXaW5kb3dzKSB7XG4gICAgT2JqZWN0LmFzc2lnbihEZXRhY2hlZFRydWVUZXN0U3VpdGUsIHtcbiAgICAgICAgY29udGV4dCxcbiAgICAgICAgJ3Nob3VsZCBxdWl0IGNoaWxkIHByb2Nlc3Mgd2hlbiBmb3JrIGV4aXRzIHdpdGhvdXQgZGV0YWNoZWQgb3B0aW9uICh3aW4pJzogY3JlYXRlVGVzdFdpbigpLFxuICAgICAgICAnc2hvdWxkIG5vdCBxdWl0IGNoaWxkIHByb2Nlc3Mgd2hlbiBmb3JrIGV4aXRzIHdpdGggZGV0YWNoZWQgb3B0aW9uICh3aW4pJzogY3JlYXRlVGVzdFdpbih0cnVlKSxcbiAgICB9KVxufSBlbHNlIHtcbiAgICBPYmplY3QuYXNzaWduKERldGFjaGVkVHJ1ZVRlc3RTdWl0ZSwge1xuICAgICAgICBjb250ZXh0LFxuICAgICAgICAvLyBBbHNvIG5vdGU6IG9uIExpbnV4LCBjaGlsZCBwcm9jZXNzZXMgb2YgY2hpbGQgcHJvY2Vzc2VzIHdpbGwgbm90IGJlIHRlcm1pbmF0ZWQgd2hlbiBhdHRlbXB0aW5nIHRvIGtpbGwgdGhlaXIgcGFyZW50LlxuICAgICAgICAvLyBraWxsIGRldGFjaGVkIGZvcmsgYnkgcGFzc2luZyAtcGlkIChpLmUuLCBwZ2lkKVxuICAgICAgICAvLyBodHRwczovL25vZGVqcy5vcmcvYXBpL2NoaWxkX3Byb2Nlc3MuaHRtbCNjaGlsZF9wcm9jZXNzX3N1YnByb2Nlc3Nfa2lsbF9zaWduYWxcbiAgICAgICAgJ3Nob3VsZCBxdWl0IGNoaWxkIHByb2Nlc3Mgd2hlbiBmb3JrIGV4aXRzIHdpdGhvdXQgZGV0YWNoZWQgb3B0aW9uJzogY3JlYXRlVGVzdCgpLFxuICAgICAgICAnc2hvdWxkIG5vdCBxdWl0IGNoaWxkIHByb2Nlc3Mgd2hlbiBmb3JrIGV4aXRzIHdpdGggZGV0YWNoZWQgb3B0aW9uJzogY3JlYXRlVGVzdCh0cnVlKSxcbiAgICB9KVxufVxuXG5cbm1vZHVsZS5leHBvcnRzID0gRGV0YWNoZWRUcnVlVGVzdFN1aXRlXG4iXX0=