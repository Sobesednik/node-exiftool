'use strict';

require('source-map-support/register');

var cp = require('child_process');
var makepromise = require('makepromise');
var debuglog = require('util').debuglog('detached');
var path = require('path');

var FORK_PATH = path.join(__dirname, '../fixtures/detached');

var isWindows = process.platform === 'win32';

var createFork = function createFork(modulePath, detached, env) {
    return cp.spawn(process.argv[0], [modulePath], {
        detached: detached,
        // not doing this will not allow debugging, as fork will try to connect
        // to the same debug port as parent
        execArgv: [],
        env: Object.assign({}, process.env, env),
        stdio: ['pipe', 'pipe', 'pipe', 'ipc']
    });
};

function getGrep(include, exclude) {
    var grep = include.join('\\|');
    var vgrep = [].concat(exclude, 'grep').join('\\|');
    var com = ['ps xao pid,ppid,pgid,stat,sess,tt,tty,command'];
    if (grep) com.push('grep \'' + grep + '\'');
    com.push('grep -v \'' + vgrep + '\'');
    var s = com.join(' | ');
    return s;
}

function getWmic(include) {
    var procs = include.map(function (p) {
        return 'caption=\'' + p + '\'';
    }).join(' or ');
    return 'wmic process where "' + procs + '" get caption,processid,parentprocessid';
}

function ps(comment) {
    var psInclude = ['node', 'perl', 'npm'];
    var psExclude = ['Visual'];
    var wmicInclude = ['node.exe', 'exiftool.exe', 'conhost.exe'];
    var s = isWindows ? getWmic(wmicInclude) : getGrep(psInclude, psExclude);
    return makepromise(cp.exec, [s]).then(function (r) {
        debuglog(comment);
        debuglog('======\n' + r);
        debuglog('======');
    });
}

function killFork(proc, withGroup) {
    return new Promise(function (resolve, reject) {
        proc.once('exit', function () {
            debuglog('killed %s', proc.pid);
            resolve();
        });
        try {
            var p = withGroup ? -proc.pid : proc.pid;
            debuglog('going to kill %s', p);
            process.kill(p);
        } catch (err) {
            debuglog(err.message);
            reject(err);
        }
    });
}

/**
 * This context will allow to create and destroy Node fork.
 */
var context = function DetachedContext() {
    var _this = this;

    this.fork = null;
    this.epPid = null;

    this.forkNode = function (exiftoolDetached) {
        return ps('before starting fork').then(function () {
            var env = exiftoolDetached ? { EXIFTOOL_DETACHED: true } : {};
            _this.fork = createFork(FORK_PATH, true, env);
            debuglog('fork pid: %s', _this.fork.pid);
            return new Promise(function (resolve) {
                _this.fork.on('message', resolve);
            });
        }).then(function (res) {
            _this.epPid = res;
            debuglog('exiftool pid: %s', _this.epPid);
            _this.fork.on('disconnect', function () {
                debuglog('fork disconnected');
            });
            _this.fork.on('exit', function () {
                debuglog('fork exited');
            });
            return ps('after starting fork');
        }).then(function () {
            return { epPid: _this.epPid, forkPid: _this.fork.pid };
        });
    };
    this.killFork = function (withGroup) {
        if (!_this.fork) {
            return Promise.reject(new Error('fork has not started'));
        }
        return killFork(_this.fork, withGroup);
    };
    this._destroy = function () {
        return ps('after test');
    };
};

module.exports = context;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3Rlc3QvY29udGV4dC9kZXRhY2hlZC5qcyJdLCJuYW1lcyI6WyJjcCIsInJlcXVpcmUiLCJtYWtlcHJvbWlzZSIsImRlYnVnbG9nIiwicGF0aCIsIkZPUktfUEFUSCIsImpvaW4iLCJfX2Rpcm5hbWUiLCJpc1dpbmRvd3MiLCJwcm9jZXNzIiwicGxhdGZvcm0iLCJjcmVhdGVGb3JrIiwibW9kdWxlUGF0aCIsImRldGFjaGVkIiwiZW52Iiwic3Bhd24iLCJhcmd2IiwiZXhlY0FyZ3YiLCJPYmplY3QiLCJhc3NpZ24iLCJzdGRpbyIsImdldEdyZXAiLCJpbmNsdWRlIiwiZXhjbHVkZSIsImdyZXAiLCJ2Z3JlcCIsImNvbmNhdCIsImNvbSIsInB1c2giLCJzIiwiZ2V0V21pYyIsInByb2NzIiwibWFwIiwicCIsInBzIiwiY29tbWVudCIsInBzSW5jbHVkZSIsInBzRXhjbHVkZSIsIndtaWNJbmNsdWRlIiwiZXhlYyIsInRoZW4iLCJyIiwia2lsbEZvcmsiLCJwcm9jIiwid2l0aEdyb3VwIiwiUHJvbWlzZSIsInJlc29sdmUiLCJyZWplY3QiLCJvbmNlIiwicGlkIiwia2lsbCIsImVyciIsIm1lc3NhZ2UiLCJjb250ZXh0IiwiRGV0YWNoZWRDb250ZXh0IiwiZm9yayIsImVwUGlkIiwiZm9ya05vZGUiLCJleGlmdG9vbERldGFjaGVkIiwiRVhJRlRPT0xfREVUQUNIRUQiLCJvbiIsInJlcyIsImZvcmtQaWQiLCJFcnJvciIsIl9kZXN0cm95IiwibW9kdWxlIiwiZXhwb3J0cyJdLCJtYXBwaW5ncyI6Ijs7OztBQUFBLElBQU1BLEtBQUtDLFFBQVEsZUFBUixDQUFYO0FBQ0EsSUFBTUMsY0FBY0QsUUFBUSxhQUFSLENBQXBCO0FBQ0EsSUFBTUUsV0FBV0YsUUFBUSxNQUFSLEVBQWdCRSxRQUFoQixDQUF5QixVQUF6QixDQUFqQjtBQUNBLElBQU1DLE9BQU9ILFFBQVEsTUFBUixDQUFiOztBQUVBLElBQU1JLFlBQVlELEtBQUtFLElBQUwsQ0FBVUMs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LEVBQWU7QUFDM0IsWUFBSSxDQUFDLE1BQUtXLElBQVYsRUFBZ0I7QUFDWixtQkFBT1YsUUFBUUUsTUFBUixDQUFlLElBQUlnQixLQUFKLENBQVUsc0JBQVYsQ0FBZixDQUFQO0FBQ0g7QUFDRCxlQUFPckIsU0FBUyxNQUFLYSxJQUFkLEVBQW9CWCxTQUFwQixDQUFQO0FBQ0gsS0FMRDtBQU1BLFNBQUtvQixRQUFMLEdBQWdCO0FBQUEsZUFBTTlCLEdBQUcsWUFBSCxDQUFOO0FBQUEsS0FBaEI7QUFDSCxDQWxDRDs7QUFvQ0ErQixPQUFPQyxPQUFQLEdBQWlCYixPQUFqQiIsImZpbGUiOiJkZXRhY2hlZC5qcyIsInNvdXJjZXNDb250ZW50IjpbImNvbnN0IGNwID0gcmVxdWlyZSgnY2hpbGRfcHJvY2VzcycpXG5jb25zdCBtYWtlcHJvbWlzZSA9IHJlcXVpcmUoJ21ha2Vwcm9taXNlJylcbmNvbnN0IGRlYnVnbG9nID0gcmVxdWlyZSgndXRpbCcpLmRlYnVnbG9nKCdkZXRhY2hlZCcpXG5jb25zdCBwYXRoID0gcmVxdWlyZSgncGF0aCcpXG5cbmNvbnN0IEZPUktfUEFUSCA9IHBhdGguam9pbihfX2Rpcm5hbWUsICcuLi9maXh0dXJlcy9kZXRhY2hlZCcpXG5cbmNvbnN0IGlzV2luZG93cyA9IHByb2Nlc3MucGxhdGZvcm0gPT09ICd3aW4zMidcblxuY29uc3QgY3JlYXRlRm9yayA9IChtb2R1bGVQYXRoLCBkZXRhY2hlZCwgZW52KSA9PiBjcC5zcGF3bihcbiAgICBwcm9jZXNzLmFyZ3ZbMF0sXG4gICAgW21vZHVsZVBhdGhdLFxuICAgIHtcbiAgICAgICAgZGV0YWNoZWQsXG4gICAgICAgIC8vIG5vdCBkb2luZyB0aGlzIHdpbGwgbm90IGFsbG93IGRlYnVnZ2luZywgYXMgZm9yayB3aWxsIHRyeSB0byBjb25uZWN0XG4gICAgICAgIC8vIHRvIHRoZSBzYW1lIGRlYnVnIHBvcnQgYXMgcGFyZW50XG4gICAgICAgIGV4ZWNBcmd2OiBbXSxcbiAgICAgICAgZW52OiBPYmplY3QuYXNzaWduKHt9LCBwcm9jZXNzLmVudiwgZW52KSxcbiAgICAgICAgc3RkaW86IFsncGlwZScsICdwaXBlJywgJ3BpcGUnLCAnaXBjJ10sXG4gICAgfVxuKVxuXG5mdW5jdGlvbiBnZXRHcmVwKGluY2x1ZGUsIGV4Y2x1ZGUpIHtcbiAgICBjb25zdCBncmVwID0gaW5jbHVkZS5qb2luKCdcXFxcfCcpXG4gICAgY29uc3QgdmdyZXAgPSBbXS5jb25jYXQoZXhjbHVkZSwgJ2dyZXAnKS5qb2luKCdcXFxcfCcpXG4gICAgY29uc3QgY29tID0gWydwcyB4YW8gcGlkLHBwaWQscGdpZCxzdGF0LHNlc3MsdHQsdHR5LGNvbW1hbmQnXVxuICAgIGlmIChncmVwKSBjb20ucHVzaChgZ3JlcCAnJHtncmVwfSdgKVxuICAgIGNvbS5wdXNoKGBncmVwIC12ICcke3ZncmVwfSdgKVxuICAgIGNvbnN0IHMgPSBjb20uam9pbignIHwgJylcbiAgICByZXR1cm4gc1xufVxuXG5mdW5jdGlvbiBnZXRXbWljKGluY2x1ZGUpIHtcbiAgICBjb25zdCBwcm9jcyA9IGluY2x1ZGUubWFwKHAgPT4gYGNhcHRpb249JyR7cH0nYCkuam9pbignIG9yICcpXG4gICAgcmV0dXJuIGB3bWljIHByb2Nlc3Mgd2hlcmUgXCIke3Byb2NzfVwiIGdldCBjYXB0aW9uLHByb2Nlc3NpZCxwYXJlbnRwcm9jZXNzaWRgXG59XG5cbmZ1bmN0aW9uIHBzKGNvbW1lbnQpIHtcbiAgICBjb25zdCBwc0luY2x1ZGUgPSBbJ25vZGUnLCAncGVybCcsICducG0nXVxuICAgIGNvbnN0IHBzRXhjbHVkZSA9IFsnVmlzdWFsJ11cbiAgICBjb25zdCB3bWljSW5jbHVkZSA9IFsnbm9kZS5leGUnLCAnZXhpZnRvb2wuZXhlJywgJ2Nvbmhvc3QuZXhlJ11cbiAgICBjb25zdCBzID0gaXNXaW5kb3dzID8gZ2V0V21pYyh3bWljSW5jbHVkZSkgOiBnZXRHcmVwKHBzSW5jbHVkZSwgcHNFeGNsdWRlKVxuICAgIHJldHVybiBtYWtlcHJvbWlzZShjcC5leGVjLCBbc10pXG4gICAgICAgIC50aGVuKChyKSA9PiB7XG4gICAgICAgICAgICBkZWJ1Z2xvZyhjb21tZW50KVxuICAgICAgICAgICAgZGVidWdsb2coYD09PT09PVxcbiR7cn1gKVxuICAgICAgICAgICAgZGVidWdsb2coJz09PT09PScpXG4gICAgICAgIH0pXG59XG5cbmZ1bmN0aW9uIGtpbGxGb3JrKHByb2MsIHdpdGhHcm91cCkge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIHByb2Mub25jZSgnZXhpdCcsICgpID0+IHtcbiAgICAgICAgICAgIGRlYnVnbG9nKCdraWxsZWQgJXMnLCBwcm9jLnBpZClcbiAgICAgICAgICAgIHJlc29sdmUoKVxuICAgICAgICB9KVxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgcCA9IHdpdGhHcm91cCA/IC1wcm9jLnBpZCA6IHByb2MucGlkXG4gICAgICAgICAgICBkZWJ1Z2xvZygnZ29pbmcgdG8ga2lsbCAlcycsIHApXG4gICAgICAgICAgICBwcm9jZXNzLmtpbGwocClcbiAgICAgICAgfSBjYXRjaChlcnIpIHtcbiAgICAgICAgICAgIGRlYnVnbG9nKGVyci5tZXNzYWdlKVxuICAgICAgICAgICAgcmVqZWN0KGVycilcbiAgICAgICAgfVxuICAgIH0pXG59XG5cbi8qKlxuICogVGhpcyBjb250ZXh0IHdpbGwgYWxsb3cgdG8gY3JlYXRlIGFuZCBkZXN0cm95IE5vZGUgZm9yay5cbiAqL1xuY29uc3QgY29udGV4dCA9IGZ1bmN0aW9uIERldGFjaGVkQ29udGV4dCgpIHtcbiAgICB0aGlzLmZvcmsgPSBudWxsXG4gICAgdGhpcy5lcFBpZCA9IG51bGxcblxuICAgIHRoaXMuZm9ya05vZGUgPSAoZXhpZnRvb2xEZXRhY2hlZCkgPT4ge1xuICAgICAgICByZXR1cm4gcHMoJ2JlZm9yZSBzdGFydGluZyBmb3JrJylcbiAgICAgICAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBlbnYgPSBleGlmdG9vbERldGFjaGVkID8geyBFWElGVE9PTF9ERVRBQ0hFRDogdHJ1ZSB9IDoge31cbiAgICAgICAgICAgICAgICB0aGlzLmZvcmsgPSBjcmVhdGVGb3JrKEZPUktfUEFUSCwgdHJ1ZSwgZW52KVxuICAgICAgICAgICAgICAgIGRlYnVnbG9nKCdmb3JrIHBpZDogJXMnLCB0aGlzLmZvcmsucGlkKVxuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmZvcmsub24oJ21lc3NhZ2UnLCByZXNvbHZlKVxuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLnRoZW4oKHJlcykgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMuZXBQaWQgPSByZXNcbiAgICAgICAgICAgICAgICBkZWJ1Z2xvZygnZXhpZnRvb2wgcGlkOiAlcycsIHRoaXMuZXBQaWQpXG4gICAgICAgICAgICAgICAgdGhpcy5mb3JrLm9uKCdkaXNjb25uZWN0JywgKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBkZWJ1Z2xvZygnZm9yayBkaXNjb25uZWN0ZWQnKVxuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgdGhpcy5mb3JrLm9uKCdleGl0JywgKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBkZWJ1Z2xvZygnZm9yayBleGl0ZWQnKVxuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgcmV0dXJuIHBzKCdhZnRlciBzdGFydGluZyBmb3JrJylcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAudGhlbigoKSA9PiAoeyBlcFBpZDogdGhpcy5lcFBpZCwgZm9ya1BpZDogdGhpcy5mb3JrLnBpZCB9KSlcbiAgICB9XG4gICAgdGhpcy5raWxsRm9yayA9ICh3aXRoR3JvdXApID0+IHtcbiAgICAgICAgaWYgKCF0aGlzLmZvcmspIHtcbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgRXJyb3IoJ2ZvcmsgaGFzIG5vdCBzdGFydGVkJykpXG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGtpbGxGb3JrKHRoaXMuZm9yaywgd2l0aEdyb3VwKVxuICAgIH1cbiAgICB0aGlzLl9kZXN0cm95ID0gKCkgPT4gcHMoJ2FmdGVyIHRlc3QnKVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGNvbnRleHRcbiJdfQ==