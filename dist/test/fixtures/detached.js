'use strict';

require('source-map-support/register');

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var _require = require('exiftool-context'),
    bin = _require.exiftoolBin;

var exiftool = require('../../src/');

if (typeof process.send !== 'function') {
    throw new Error('This module should be spawned with an IPC channel.');
}

var EXIFTOOL_DETACHED = process.env.EXIFTOOL_DETACHED;


var detached = EXIFTOOL_DETACHED === 'true';

_asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee() {
    var ep, pid;
    return regeneratorRuntime.wrap(function _callee$(_context) {
        while (1) {
            switch (_context.prev = _context.next) {
                case 0:
                    _context.prev = 0;
                    ep = new exiftool.ExiftoolProcess(bin);
                    _context.next = 4;
                    return ep.open({ detached: detached });

                case 4:
                    pid = _context.sent;

                    process.send(pid);
                    _context.next = 12;
                    break;

                case 8:
                    _context.prev = 8;
                    _context.t0 = _context['catch'](0);

                    console.log(_context.t0); // eslint-disable-line no-console
                    process.exit(1);

                case 12:
                case 'end':
                    return _context.stop();
            }
        }
    }, _callee, undefined, [[0, 8]]);
}))();
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3Rlc3QvZml4dHVyZXMvZGV0YWNoZWQuanMiXSwibmFtZXMiOlsicmVxdWlyZSIsImJpbiIsImV4aWZ0b29sQmluIiwiZXhpZnRvb2wiLCJwcm9jZXNzIiwic2VuZCIsIkVycm9yIiwiRVhJRlRPT0xfREVUQUNIRUQiLCJlbnYiLCJkZXRhY2hlZCIsImVwIiwiRXhpZnRvb2xQcm9jZXNzIiwib3BlbiIsInBpZCIsImNvbnNvbGUiLCJsb2ciLCJleGl0Il0sIm1hcHBpbmdzIjoiOzs7Ozs7ZUFBNkJBLFFBQVEsa0JBQVIsQztJQUFSQyxHLFlBQWJDLFc7O0FBQ1IsSUFBTUMsV0FBV0gsUUFBUSxZQUFSLENBQWpCOztBQUVBLElBQUksT0FBT0ksUUFBUUMsSUFBZixLQUF3QixVQUE1QixFQUF3QztBQUNwQyxVQUFNLElBQUlDLEtBQUosQ0FBVSxvREFBVixDQUFOO0FBQ0g7O0lBRU9DLGlCLEdBQXNCSCxRQUFRSSxHLENBQTlCRCxpQjs7O0FBRVIsSUFBTUUsV0FBV0Ysc0JBQXNCLE1BQXZDOztBQUVBLHdEQUFDO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBRWFHLHNCQUZiLEdBRWtCLElBQUlQLFNBQVNRLGVBQWIsQ0FBNkJWLEdBQTdCLENBRmxCO0FBQUE7QUFBQSwyQkFHeUJTLEdBQUdFLElBQUgsQ0FBUSxFQUFFSCxrQkFBRixFQUFSLENBSHpCOztBQUFBO0FBR2FJLHVCQUhiOztBQUlPVCw0QkFBUUMsSUFBUixDQUFhUSxHQUFiO0FBSlA7QUFBQTs7QUFBQTtBQUFBO0FBQUE7O0FBTU9DLDRCQUFRQyxHQUFSLGNBTlAsQ0FNd0I7QUFDakJYLDRCQUFRWSxJQUFSLENBQWEsQ0FBYjs7QUFQUDtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxDQUFEIiwiZmlsZSI6ImRldGFjaGVkLmpzIiwic291cmNlc0NvbnRlbnQiOlsiY29uc3QgeyBleGlmdG9vbEJpbjogYmluIH0gPSByZXF1aXJlKCdleGlmdG9vbC1jb250ZXh0JylcbmNvbnN0IGV4aWZ0b29sID0gcmVxdWlyZSgnLi4vLi4vc3JjLycpXG5cbmlmICh0eXBlb2YgcHJvY2Vzcy5zZW5kICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdUaGlzIG1vZHVsZSBzaG91bGQgYmUgc3Bhd25lZCB3aXRoIGFuIElQQyBjaGFubmVsLicpXG59XG5cbmNvbnN0IHsgRVhJRlRPT0xfREVUQUNIRUQgfSA9IHByb2Nlc3MuZW52XG5cbmNvbnN0IGRldGFjaGVkID0gRVhJRlRPT0xfREVUQUNIRUQgPT09ICd0cnVlJztcblxuKGFzeW5jICgpID0+IHtcbiAgICB0cnkge1xuICAgICAgICBjb25zdCBlcCA9IG5ldyBleGlmdG9vbC5FeGlmdG9vbFByb2Nlc3MoYmluKVxuICAgICAgICBjb25zdCBwaWQgPSBhd2FpdCBlcC5vcGVuKHsgZGV0YWNoZWQgfSlcbiAgICAgICAgcHJvY2Vzcy5zZW5kKHBpZClcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgY29uc29sZS5sb2coZXJyKSAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLWNvbnNvbGVcbiAgICAgICAgcHJvY2Vzcy5leGl0KDEpXG4gICAgfVxufSkoKVxuIl19