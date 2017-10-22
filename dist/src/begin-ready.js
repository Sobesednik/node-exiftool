'use strict';

require('source-map-support/register');

var _require = require('stream'),
    Transform = _require.Transform,
    Writable = _require.Writable;

var restream = require('restream');

var BEGIN_READY_RE = /{begin(\d+)}([\s\S]*){ready\1}/g;

/**
 * A transform stream which will mutate data from regex stream into an object
 * with commandNumber and data.
 * @return {Transfrom} A transform stream into which exiftool process stdout and
 * stderr can be piped. It will push objects in form of { cn: commandNumber, d: data }
 */
function createBeginReadyMatchTransformStream() {
    var ts = new Transform({ objectMode: true });
    // expecting data from RegexTransformStream with BEGIN_READY_RE
    ts._transform = function (match, enc, next) {
        var data = {
            cn: match[1],
            d: match[2].trim()
        };
        next(null, data);
    };
    return ts;
}

/**
 * A write stream which will maintain a map of commands which are waiting
 * to be resolved, where keys are the corresponding resolve promise. The
 * stream will expect input from BeginReady Transform Stream.
 * @return {Writable} A write stream extended with `addToResolveMap` method.
 * @see createBeginReadyTransformStream
 */
function createResolverWriteStream() {
    var ws = new Writable({
        objectMode: true
    });
    ws._resolveMap = {};
    ws.addToResolveMap = function (commandNumber, resolve) {
        if (typeof commandNumber !== 'string') {
            throw new Error('commandNumber argument must be a string');
        }
        if (typeof resolve !== 'function') {
            throw new Error('resolve argument must be a function');
        }
        if (this._resolveMap[commandNumber]) {
            throw new Error('Command with the same number is already expected');
        }
        this._resolveMap[commandNumber] = resolve;
    };
    ws._write = function (obj, enc, next) {
        var commandNumber = obj.cn;
        var data = obj.d;
        var resolve = this._resolveMap[commandNumber];
        if (resolve) {
            resolve(data);
            delete this._resolveMap[commandNumber];
            next();
        } else {
            next(new Error('Command with index ' + commandNumber + ' not found'));
        }
    };
    return ws;
}

/**
 * Setup a pipe from process std stream into resolve write stream
 * through regex transform and begin-ready transform streams.
 * @param {Readable} rs Readable stream (from exiftool process)
 * @return {Writable} A Resolve transform stream.
 */
function setupResolveWriteStreamPipe(rs) {
    var rts = restream(BEGIN_READY_RE);
    var brmts = createBeginReadyMatchTransformStream();
    var rws = createResolverWriteStream();

    return rs.pipe(rts).pipe(brmts).pipe(rws);
}

module.exports = {
    createBeginReadyMatchTransformStream: createBeginReadyMatchTransformStream,
    createResolverWriteStream: createResolverWriteStream,
    BEGIN_READY_RE: BEGIN_READY_RE,
    setupResolveWriteStreamPipe: setupResolveWriteStreamPipe
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9iZWdpbi1yZWFkeS5qcyJdLCJuYW1lcyI6WyJyZXF1aXJlIiwiVHJhbnNmb3JtIiwiV3JpdGFibGUiLCJyZXN0cmVhbSIsIkJFR0lOX1JFQURZX1JFIiwiY3JlYXRlQmVnaW5SZWFkeU1hdGNoVHJhbnNmb3JtU3RyZWFtIiwidHMiLCJvYmplY3RNb2RlIiwiX3RyYW5zZm9ybSIsIm1hdGNoIiwiZW5jIiwibmV4dCIsImRhdGEiLCJjbiIsImQiLCJ0cmltIiwiY3JlYXRlUmVzb2x2ZXJXcml0ZVN0cmVhbSIsIndzIiwiX3Jlc29sdmVNYXAiLCJhZGRUb1Jlc29sdmVNYXAiLCJjb21tYW5kTnVtYmVyIiwicmVzb2x2ZSIsIkVycm9yIiwiX3dyaXRlIiwib2JqIiwic2V0dXBSZXNvbHZlV3JpdGVTdHJlYW1QaXBlIiwicnMiLCJydHMiLCJicm10cyIsInJ3cyIsInBpcGUiLCJtb2R1bGUiLCJleHBvcnRzIl0sIm1hcHBpbmdzIjoiOzs7O2VBQWlDQSxRQUFRLFFBQVIsQztJQUF6QkMsUyxZQUFBQSxTO0lBQVdDLFEsWUFBQUEsUTs7QUFDbkIsSUFBTUMsV0FBV0gsUUFBUSxVQUFSLENBQWpCOztBQUVBLElBQU1JLGlCQUFpQixpQ0FBdkI7O0FBR0E7Ozs7OztBQU1BLFNBQVNDLG9DQUFULEdBQWdEO0FBQzVDLFFBQU1DLEtBQUssSUFBSUwsU0FBSixDQUFjLEVBQUVNLFlBQVksSUFBZCxFQUFkLENBQVg7QUFDQTtBQUNBRCxPQUFHRSxVQUFILEdBQWdCLFVBQUNDLEtBQUQsRUFBUUMsR0FBUixFQUFhQyxJQUFiLEVBQXNCO0FBQ2xDLFlBQU1DLE9BQU87QUFDVEMsZ0JBQUlKLE1BQU0sQ0FBTixDQURLO0FBRVRLLGVBQUdMLE1BQU0sQ0FBTixFQUFTTSxJQUFUO0FBRk0sU0FBYjtBQUlBSixhQUFLLElBQUwsRUFBV0MsSUFBWDtBQUNILEtBTkQ7QUFPQSxXQUFPTixFQUFQO0FBQ0g7O0FBRUQ7Ozs7Ozs7QUFPQSxTQUFTVSx5QkFBVCxHQUFxQztBQUNqQyxRQUFNQyxLQUFLLElBQUlmLFFBQUosQ0FBYTtBQUNwQkssb0JBQVk7QUFEUSxLQUFiLENBQVg7QUFHQVUsT0FBR0MsV0FBSCxHQUFpQixFQUFqQjtBQUNBRCxPQUFHRSxlQUFILEdBQXFCLFVBQVNDLGFBQVQsRUFBd0JDLE9BQXhCLEVBQWlDO0FBQ2xELFlBQUksT0FBT0QsYUFBUCxLQUF5QixRQUE3QixFQUF1QztBQUNuQyxrQkFBTSxJQUFJRSxLQUFKLENBQVUseUNBQVYsQ0FBTjtBQUNIO0FBQ0QsWUFBSSxPQUFPRCxPQUFQLEtBQW1CLFVBQXZCLEVBQW1DO0FBQy9CLGtCQUFNLElBQUlDLEtBQUosQ0FBVSxxQ0FBVixDQUFOO0FBQ0g7QUFDRCxZQUFJLEtBQUtKLFdBQUwsQ0FBaUJFLGFBQWpCLENBQUosRUFBcUM7QUFDakMsa0JBQU0sSUFBSUUsS0FBSixDQUFVLGtEQUFWLENBQU47QUFDSDtBQUNELGFBQUtKLFdBQUwsQ0FBaUJFLGFBQWpCLElBQWtDQyxPQUFsQztBQUNILEtBWEQ7QUFZQUosT0FBR00sTUFBSCxHQUFZLFVBQVVDLEdBQVYsRUFBZWQsR0FBZixFQUFvQkMsSUFBcEIsRUFBMEI7QUFDbEMsWUFBTVMsZ0JBQWdCSSxJQUFJWCxFQUExQjtBQUNBLFlBQU1ELE9BQU9ZLElBQUlWLENBQWpCO0FBQ0EsWUFBTU8sVUFBVSxLQUFLSCxXQUFMLENBQWlCRSxhQUFqQixDQUFoQjtBQUNBLFlBQUlDLE9BQUosRUFBYTtBQUNUQSxvQkFBUVQsSUFBUjtBQUNBLG1CQUFPLEtBQUtNLFdBQUwsQ0FBaUJFLGFBQWpCLENBQVA7QUFDQVQ7QUFDSCxTQUpELE1BSU87QUFDSEEsaUJBQUssSUFBSVcsS0FBSix5QkFBZ0NGLGFBQWhDLGdCQUFMO0FBQ0g7QUFDSixLQVhEO0FBWUEsV0FBT0gsRUFBUDtBQUNIOztBQUVEOzs7Ozs7QUFNQSxTQUFTUSwyQkFBVCxDQUFxQ0MsRUFBckMsRUFBeUM7QUFDckMsUUFBTUMsTUFBTXhCLFNBQVNDLGNBQVQsQ0FBWjtBQUNBLFFBQU13QixRQUFRdkIsc0NBQWQ7QUFDQSxRQUFNd0IsTUFBTWIsMkJBQVo7O0FBRUEsV0FBT1UsR0FBR0ksSUFBSCxDQUFRSCxHQUFSLEVBQWFHLElBQWIsQ0FBa0JGLEtBQWxCLEVBQXlCRSxJQUF6QixDQUE4QkQsR0FBOUIsQ0FBUDtBQUNIOztBQUVERSxPQUFPQyxPQUFQLEdBQWlCO0FBQ2IzQiw4RUFEYTtBQUViVyx3REFGYTtBQUdiWixrQ0FIYTtBQUlicUI7QUFKYSxDQUFqQiIsImZpbGUiOiJiZWdpbi1yZWFkeS5qcyIsInNvdXJjZXNDb250ZW50IjpbImNvbnN0IHsgVHJhbnNmb3JtLCBXcml0YWJsZSB9ICA9IHJlcXVpcmUoJ3N0cmVhbScpXG5jb25zdCByZXN0cmVhbSA9IHJlcXVpcmUoJ3Jlc3RyZWFtJylcblxuY29uc3QgQkVHSU5fUkVBRFlfUkUgPSAve2JlZ2luKFxcZCspfShbXFxzXFxTXSope3JlYWR5XFwxfS9nXG5cblxuLyoqXG4gKiBBIHRyYW5zZm9ybSBzdHJlYW0gd2hpY2ggd2lsbCBtdXRhdGUgZGF0YSBmcm9tIHJlZ2V4IHN0cmVhbSBpbnRvIGFuIG9iamVjdFxuICogd2l0aCBjb21tYW5kTnVtYmVyIGFuZCBkYXRhLlxuICogQHJldHVybiB7VHJhbnNmcm9tfSBBIHRyYW5zZm9ybSBzdHJlYW0gaW50byB3aGljaCBleGlmdG9vbCBwcm9jZXNzIHN0ZG91dCBhbmRcbiAqIHN0ZGVyciBjYW4gYmUgcGlwZWQuIEl0IHdpbGwgcHVzaCBvYmplY3RzIGluIGZvcm0gb2YgeyBjbjogY29tbWFuZE51bWJlciwgZDogZGF0YSB9XG4gKi9cbmZ1bmN0aW9uIGNyZWF0ZUJlZ2luUmVhZHlNYXRjaFRyYW5zZm9ybVN0cmVhbSgpIHtcbiAgICBjb25zdCB0cyA9IG5ldyBUcmFuc2Zvcm0oeyBvYmplY3RNb2RlOiB0cnVlIH0pXG4gICAgLy8gZXhwZWN0aW5nIGRhdGEgZnJvbSBSZWdleFRyYW5zZm9ybVN0cmVhbSB3aXRoIEJFR0lOX1JFQURZX1JFXG4gICAgdHMuX3RyYW5zZm9ybSA9IChtYXRjaCwgZW5jLCBuZXh0KSA9PiB7XG4gICAgICAgIGNvbnN0IGRhdGEgPSB7XG4gICAgICAgICAgICBjbjogbWF0Y2hbMV0sXG4gICAgICAgICAgICBkOiBtYXRjaFsyXS50cmltKCksXG4gICAgICAgIH1cbiAgICAgICAgbmV4dChudWxsLCBkYXRhKVxuICAgIH1cbiAgICByZXR1cm4gdHNcbn1cblxuLyoqXG4gKiBBIHdyaXRlIHN0cmVhbSB3aGljaCB3aWxsIG1haW50YWluIGEgbWFwIG9mIGNvbW1hbmRzIHdoaWNoIGFyZSB3YWl0aW5nXG4gKiB0byBiZSByZXNvbHZlZCwgd2hlcmUga2V5cyBhcmUgdGhlIGNvcnJlc3BvbmRpbmcgcmVzb2x2ZSBwcm9taXNlLiBUaGVcbiAqIHN0cmVhbSB3aWxsIGV4cGVjdCBpbnB1dCBmcm9tIEJlZ2luUmVhZHkgVHJhbnNmb3JtIFN0cmVhbS5cbiAqIEByZXR1cm4ge1dyaXRhYmxlfSBBIHdyaXRlIHN0cmVhbSBleHRlbmRlZCB3aXRoIGBhZGRUb1Jlc29sdmVNYXBgIG1ldGhvZC5cbiAqIEBzZWUgY3JlYXRlQmVnaW5SZWFkeVRyYW5zZm9ybVN0cmVhbVxuICovXG5mdW5jdGlvbiBjcmVhdGVSZXNvbHZlcldyaXRlU3RyZWFtKCkge1xuICAgIGNvbnN0IHdzID0gbmV3IFdyaXRhYmxlKHtcbiAgICAgICAgb2JqZWN0TW9kZTogdHJ1ZSxcbiAgICB9KVxuICAgIHdzLl9yZXNvbHZlTWFwID0ge31cbiAgICB3cy5hZGRUb1Jlc29sdmVNYXAgPSBmdW5jdGlvbihjb21tYW5kTnVtYmVyLCByZXNvbHZlKSB7XG4gICAgICAgIGlmICh0eXBlb2YgY29tbWFuZE51bWJlciAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignY29tbWFuZE51bWJlciBhcmd1bWVudCBtdXN0IGJlIGEgc3RyaW5nJylcbiAgICAgICAgfVxuICAgICAgICBpZiAodHlwZW9mIHJlc29sdmUgIT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcigncmVzb2x2ZSBhcmd1bWVudCBtdXN0IGJlIGEgZnVuY3Rpb24nKVxuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLl9yZXNvbHZlTWFwW2NvbW1hbmROdW1iZXJdKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0NvbW1hbmQgd2l0aCB0aGUgc2FtZSBudW1iZXIgaXMgYWxyZWFkeSBleHBlY3RlZCcpXG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fcmVzb2x2ZU1hcFtjb21tYW5kTnVtYmVyXSA9IHJlc29sdmVcbiAgICB9XG4gICAgd3MuX3dyaXRlID0gZnVuY3Rpb24gKG9iaiwgZW5jLCBuZXh0KSB7XG4gICAgICAgIGNvbnN0IGNvbW1hbmROdW1iZXIgPSBvYmouY25cbiAgICAgICAgY29uc3QgZGF0YSA9IG9iai5kXG4gICAgICAgIGNvbnN0IHJlc29sdmUgPSB0aGlzLl9yZXNvbHZlTWFwW2NvbW1hbmROdW1iZXJdXG4gICAgICAgIGlmIChyZXNvbHZlKSB7XG4gICAgICAgICAgICByZXNvbHZlKGRhdGEpXG4gICAgICAgICAgICBkZWxldGUgdGhpcy5fcmVzb2x2ZU1hcFtjb21tYW5kTnVtYmVyXVxuICAgICAgICAgICAgbmV4dCgpXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBuZXh0KG5ldyBFcnJvcihgQ29tbWFuZCB3aXRoIGluZGV4ICR7Y29tbWFuZE51bWJlcn0gbm90IGZvdW5kYCkpXG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHdzXG59XG5cbi8qKlxuICogU2V0dXAgYSBwaXBlIGZyb20gcHJvY2VzcyBzdGQgc3RyZWFtIGludG8gcmVzb2x2ZSB3cml0ZSBzdHJlYW1cbiAqIHRocm91Z2ggcmVnZXggdHJhbnNmb3JtIGFuZCBiZWdpbi1yZWFkeSB0cmFuc2Zvcm0gc3RyZWFtcy5cbiAqIEBwYXJhbSB7UmVhZGFibGV9IHJzIFJlYWRhYmxlIHN0cmVhbSAoZnJvbSBleGlmdG9vbCBwcm9jZXNzKVxuICogQHJldHVybiB7V3JpdGFibGV9IEEgUmVzb2x2ZSB0cmFuc2Zvcm0gc3RyZWFtLlxuICovXG5mdW5jdGlvbiBzZXR1cFJlc29sdmVXcml0ZVN0cmVhbVBpcGUocnMpIHtcbiAgICBjb25zdCBydHMgPSByZXN0cmVhbShCRUdJTl9SRUFEWV9SRSlcbiAgICBjb25zdCBicm10cyA9IGNyZWF0ZUJlZ2luUmVhZHlNYXRjaFRyYW5zZm9ybVN0cmVhbSgpXG4gICAgY29uc3QgcndzID0gY3JlYXRlUmVzb2x2ZXJXcml0ZVN0cmVhbSgpXG5cbiAgICByZXR1cm4gcnMucGlwZShydHMpLnBpcGUoYnJtdHMpLnBpcGUocndzKVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBjcmVhdGVCZWdpblJlYWR5TWF0Y2hUcmFuc2Zvcm1TdHJlYW0sXG4gICAgY3JlYXRlUmVzb2x2ZXJXcml0ZVN0cmVhbSxcbiAgICBCRUdJTl9SRUFEWV9SRSxcbiAgICBzZXR1cFJlc29sdmVXcml0ZVN0cmVhbVBpcGUsXG59XG4iXX0=