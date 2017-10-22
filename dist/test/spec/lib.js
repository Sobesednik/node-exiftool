'use strict';

require('source-map-support/register');

var assert = require('assert');

var _require = require('os'),
    EOL = _require.EOL;

var lib = require('../../src/lib');

var libTestSuite = {
    checkDataObject: {
        'should return true on object': function shouldReturnTrueOnObject() {
            var data = {
                comment: 'hello world'
            };
            assert(lib.checkDataObject(data));
        },
        'should return true on Object': function shouldReturnTrueOnObject() {
            var data = new Object('foo');
            assert(lib.checkDataObject(data));
        },
        'should return false on string': function shouldReturnFalseOnString() {
            assert(!lib.checkDataObject('hello world'));
        },
        'should return false on boolean': function shouldReturnFalseOnBoolean() {
            assert(!lib.checkDataObject(true));
        },
        'should return false on array': function shouldReturnFalseOnArray() {
            assert(!lib.checkDataObject(['hello world']));
        }
    },
    mapDataToTagArray: {
        'should return an array with tags': function shouldReturnAnArrayWithTags() {
            var data = {
                tagA: 'valueA',
                tagB: 'valueB'
            };
            var res = lib.mapDataToTagArray(data);
            assert.equal(res[0], 'tagA=valueA');
            assert.equal(res[1], 'tagB=valueB');
        },
        'should return multiple entries when value is an array': function shouldReturnMultipleEntriesWhenValueIsAnArray() {
            var data = {
                'tag+': ['valueA', 'valueB']
            };
            var res = lib.mapDataToTagArray(data);
            assert.equal(res[0], 'tag+=valueA');
            assert.equal(res[1], 'tag+=valueB');
        },
        'should push values to existing array': function shouldPushValuesToExistingArray() {
            var array = ['json'];
            var data = {
                tagA: 'valueA',
                tagB: 'valueB',
                'tagC+': ['valueC1', 'valueC2']

            };
            lib.mapDataToTagArray(data, array);
            assert.equal(array[0], 'json');
            assert.equal(array[1], 'tagA=valueA');
            assert.equal(array[2], 'tagB=valueB');
            assert.equal(array[3], 'tagC+=valueC1');
            assert.equal(array[4], 'tagC+=valueC2');
        }
    },
    getArgs: {
        'should return empty array if argument is not array': function shouldReturnEmptyArrayIfArgumentIsNotArray() {
            var res = lib.getArgs('non-array');
            assert.deepEqual(res, []);
        },
        'should return empty array if argument is empty array': function shouldReturnEmptyArrayIfArgumentIsEmptyArray() {
            var res = lib.getArgs([]);
            assert.deepEqual(res, []);
        },
        'should map args array to a string': function shouldMapArgsArrayToAString() {
            var args = ['Creator', 'CreatorWorkURL', 'Orientation'];
            var res = lib.getArgs(args);
            var expected = ['-Creator', '-CreatorWorkURL', '-Orientation'];
            assert.equal(res.length, expected.length);
            res.forEach(function (arg, index) {
                return assert.equal(arg, expected[index]);
            });
        },
        'should exclude non-strings': function shouldExcludeNonStrings() {
            var args = ['Creator', 'CreatorWorkURL', 'Orientation', false, NaN, 1024];
            var res = lib.getArgs(args);
            var expected = ['-Creator', '-CreatorWorkURL', '-Orientation'];
            assert.equal(res.length, expected.length);
            res.forEach(function (arg, index) {
                return assert.equal(arg, expected[index]);
            });
        },
        'should split arguments': function shouldSplitArguments() {
            var args = ['Creator', 'ext dng', 'o  metadata.txt'];
            var res = lib.getArgs(args);
            var expected = ['-Creator', '-ext', 'dng', '-o', 'metadata.txt'];
            assert.equal(res.length, expected.length);
            res.forEach(function (arg, index) {
                return assert.equal(arg, expected[index]);
            });
        },
        'should not split arguments with noSplit': function shouldNotSplitArgumentsWithNoSplit() {
            var args = ['keywords+=keyword A', 'keywords+=keyword B', 'comment=hello world'];
            var res = lib.getArgs(args, true);
            var expected = ['-keywords+=keyword A', '-keywords+=keyword B', '-comment=hello world'];
            assert.equal(res.length, expected.length);
            res.forEach(function (arg, index) {
                return assert.equal(arg, expected[index]);
            });
        }
    },
    execute: {
        'should write to process stdin': function shouldWriteToProcessStdin() {
            var records = [];
            var process = {
                stdin: {
                    write: function write(record) {
                        return records.push(record);
                    }
                }
            };
            var command = 'file.jpg';
            var commandNumber = 1;
            var args = ['Creator', 'ext dng', 'o  metadata.txt', false, NaN];
            var noSplitArgs = ['comment=hello world'];
            lib.execute(process, command, commandNumber, args, noSplitArgs);
            var expected = ['-comment=hello world', '-Creator', '-ext', 'dng', '-o', 'metadata.txt', '-json', '-s', 'file.jpg', '-echo1', '{begin1}', '-echo2', '{begin1}', '-echo4', '{ready1}', '-execute1'].reduce(function (acc, arg) {
                return [].concat(acc, [arg, EOL]);
            }, []);
            assert.equal(records.length, expected.length);
            records.forEach(function (arg, index) {
                return assert.equal(arg, expected[index]);
            });
        }
    }
};

module.exports = libTestSuite;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3Rlc3Qvc3BlYy9saWIuanMiXSwibmFtZXMiOlsiYXNzZXJ0IiwicmVxdWlyZSIsIkVPTCIsImxpYiIsImxpYlRlc3RTdWl0ZSIsImNoZWNrRGF0YU9iamVjdCIsImRhdGEiLCJjb21tZW50IiwiT2JqZWN0IiwibWFwRGF0YVRvVGFnQXJyYXkiLCJ0YWdBIiwidGFnQiIsInJlcyIsImVxdWFsIiwiYXJyYXkiLCJnZXRBcmdzIiwiZGVlcEVxdWFsIiwiYXJncyIsImV4cGVjdGVkIiwibGVuZ3RoIiwiZm9yRWFjaCIsImFyZyIsImluZGV4IiwiTmFOIiwiZXhlY3V0ZSIsInJlY29yZHMiLCJwcm9jZXNzIiwic3RkaW4iLCJ3cml0ZSIsInB1c2giLCJyZWNvcmQiLCJjb21tYW5kIiwiY29tbWFuZE51bWJlciIsIm5vU3BsaXRBcmdzIiwicmVkdWNlIiwiYWNjIiwiY29uY2F0IiwibW9kdWxlIiwiZXhwb3J0cyJdLCJtYXBwaW5ncyI6Ijs7OztBQUFBLElBQU1BLFNBQVNDLFFBQVEsUUFBUixDQUFmOztlQUNnQkEsUUFBUSxJQUFSLEM7SUFBUkMsRyxZQUFBQSxHOztBQUNSLElBQU1DLE1BQU1GLFFBQVEsZUFBUixDQUFaOztBQUVBLElBQU1HLGVBQWU7QUFDakJDLHFCQUFpQjtBQUNiLHdDQUFnQyxvQ0FBTTtBQUNsQyxnQkFBTUMsT0FBTztBQUNUQyx5QkFBUztBQURBLGFBQWI7QUFHQVAsbUJBQU9HLElBQUlFLGVBQUosQ0FBb0JDLElBQXBCLENBQVA7QUFDSCxTQU5ZO0FBT2Isd0NBQWdDLG9DQUFNO0FBQ2xDLGdCQUFNQSxPQUFPLElBQUlFLE1BQUosQ0FBVyxLQUFYLENBQWI7QUFDQVIsbUJBQU9HLElBQUlFLGVBQUosQ0FBb0JDLElBQXBCLENBQVA7QUFDSCxTQVZZO0FBV2IseUNBQWlDLHFDQUFNO0FBQ25DTixtQkFBTyxDQUFDRyxJQUFJRSxlQUFKLENBQW9CLGFBQXBCLENBQVI7QUFDSCxTQWJZO0FBY2IsMENBQWtDLHNDQUFNO0FB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QmMsQ0FBakI7QUFvQkFGLG1CQUFPYSxLQUFQLENBQWFZLFFBQVFOLE1BQXJCLEVBQTZCRCxTQUFTQyxNQUF0QztBQUNBTSxvQkFBUUwsT0FBUixDQUFnQixVQUFDQyxHQUFELEVBQU1DLEtBQU47QUFBQSx1QkFDWnRCLE9BQU9hLEtBQVAsQ0FBYVEsR0FBYixFQUFrQkgsU0FBU0ksS0FBVCxDQUFsQixDQURZO0FBQUEsYUFBaEI7QUFHSDtBQXJDSTtBQXRHUSxDQUFyQjs7QUErSUFlLE9BQU9DLE9BQVAsR0FBaUJsQyxZQUFqQiIsImZpbGUiOiJsaWIuanMiLCJzb3VyY2VzQ29udGVudCI6WyJjb25zdCBhc3NlcnQgPSByZXF1aXJlKCdhc3NlcnQnKVxuY29uc3QgeyBFT0wgfSA9IHJlcXVpcmUoJ29zJylcbmNvbnN0IGxpYiA9IHJlcXVpcmUoJy4uLy4uL3NyYy9saWInKVxuXG5jb25zdCBsaWJUZXN0U3VpdGUgPSB7XG4gICAgY2hlY2tEYXRhT2JqZWN0OiB7XG4gICAgICAgICdzaG91bGQgcmV0dXJuIHRydWUgb24gb2JqZWN0JzogKCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgZGF0YSA9IHtcbiAgICAgICAgICAgICAgICBjb21tZW50OiAnaGVsbG8gd29ybGQnLFxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYXNzZXJ0KGxpYi5jaGVja0RhdGFPYmplY3QoZGF0YSkpXG4gICAgICAgIH0sXG4gICAgICAgICdzaG91bGQgcmV0dXJuIHRydWUgb24gT2JqZWN0JzogKCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgZGF0YSA9IG5ldyBPYmplY3QoJ2ZvbycpXG4gICAgICAgICAgICBhc3NlcnQobGliLmNoZWNrRGF0YU9iamVjdChkYXRhKSlcbiAgICAgICAgfSxcbiAgICAgICAgJ3Nob3VsZCByZXR1cm4gZmFsc2Ugb24gc3RyaW5nJzogKCkgPT4ge1xuICAgICAgICAgICAgYXNzZXJ0KCFsaWIuY2hlY2tEYXRhT2JqZWN0KCdoZWxsbyB3b3JsZCcpKVxuICAgICAgICB9LFxuICAgICAgICAnc2hvdWxkIHJldHVybiBmYWxzZSBvbiBib29sZWFuJzogKCkgPT4ge1xuICAgICAgICAgICAgYXNzZXJ0KCFsaWIuY2hlY2tEYXRhT2JqZWN0KHRydWUpKVxuICAgICAgICB9LFxuICAgICAgICAnc2hvdWxkIHJldHVybiBmYWxzZSBvbiBhcnJheSc6ICgpID0+IHtcbiAgICAgICAgICAgIGFzc2VydCghbGliLmNoZWNrRGF0YU9iamVjdChbJ2hlbGxvIHdvcmxkJ10pKVxuICAgICAgICB9LFxuICAgIH0sXG4gICAgbWFwRGF0YVRvVGFnQXJyYXk6IHtcbiAgICAgICAgJ3Nob3VsZCByZXR1cm4gYW4gYXJyYXkgd2l0aCB0YWdzJzogKCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgZGF0YSA9IHtcbiAgICAgICAgICAgICAgICB0YWdBOiAndmFsdWVBJyxcbiAgICAgICAgICAgICAgICB0YWdCOiAndmFsdWVCJyxcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IHJlcyA9IGxpYi5tYXBEYXRhVG9UYWdBcnJheShkYXRhKVxuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHJlc1swXSwgJ3RhZ0E9dmFsdWVBJylcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChyZXNbMV0sICd0YWdCPXZhbHVlQicpXG4gICAgICAgIH0sXG4gICAgICAgICdzaG91bGQgcmV0dXJuIG11bHRpcGxlIGVudHJpZXMgd2hlbiB2YWx1ZSBpcyBhbiBhcnJheSc6ICgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGRhdGEgPSB7XG4gICAgICAgICAgICAgICAgJ3RhZysnOiBbICd2YWx1ZUEnLCAndmFsdWVCJyBdLFxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgcmVzID0gbGliLm1hcERhdGFUb1RhZ0FycmF5KGRhdGEpXG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwocmVzWzBdLCAndGFnKz12YWx1ZUEnKVxuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHJlc1sxXSwgJ3RhZys9dmFsdWVCJylcbiAgICAgICAgfSxcbiAgICAgICAgJ3Nob3VsZCBwdXNoIHZhbHVlcyB0byBleGlzdGluZyBhcnJheSc6ICgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGFycmF5ID0gWyAnanNvbicgXVxuICAgICAgICAgICAgY29uc3QgZGF0YSA9IHtcbiAgICAgICAgICAgICAgICB0YWdBOiAndmFsdWVBJyxcbiAgICAgICAgICAgICAgICB0YWdCOiAndmFsdWVCJyxcbiAgICAgICAgICAgICAgICAndGFnQysnOiBbICd2YWx1ZUMxJywgJ3ZhbHVlQzInIF0sXG5cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGxpYi5tYXBEYXRhVG9UYWdBcnJheShkYXRhLCBhcnJheSlcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChhcnJheVswXSwgJ2pzb24nKVxuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKGFycmF5WzFdLCAndGFnQT12YWx1ZUEnKVxuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKGFycmF5WzJdLCAndGFnQj12YWx1ZUInKVxuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKGFycmF5WzNdLCAndGFnQys9dmFsdWVDMScpXG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwoYXJyYXlbNF0sICd0YWdDKz12YWx1ZUMyJylcbiAgICAgICAgfSxcbiAgICB9LFxuICAgIGdldEFyZ3M6IHtcbiAgICAgICAgJ3Nob3VsZCByZXR1cm4gZW1wdHkgYXJyYXkgaWYgYXJndW1lbnQgaXMgbm90IGFycmF5JzogKCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgcmVzID0gbGliLmdldEFyZ3MoJ25vbi1hcnJheScpXG4gICAgICAgICAgICBhc3NlcnQuZGVlcEVxdWFsKHJlcywgW10pXG4gICAgICAgIH0sXG4gICAgICAgICdzaG91bGQgcmV0dXJuIGVtcHR5IGFycmF5IGlmIGFyZ3VtZW50IGlzIGVtcHR5IGFycmF5JzogKCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgcmVzID0gbGliLmdldEFyZ3MoW10pXG4gICAgICAgICAgICBhc3NlcnQuZGVlcEVxdWFsKHJlcywgW10pXG4gICAgICAgIH0sXG4gICAgICAgICdzaG91bGQgbWFwIGFyZ3MgYXJyYXkgdG8gYSBzdHJpbmcnOiAoKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBhcmdzID0gWydDcmVhdG9yJywgJ0NyZWF0b3JXb3JrVVJMJywgJ09yaWVudGF0aW9uJ11cbiAgICAgICAgICAgIGNvbnN0IHJlcyA9IGxpYi5nZXRBcmdzKGFyZ3MpXG4gICAgICAgICAgICBjb25zdCBleHBlY3RlZCA9IFsnLUNyZWF0b3InLCAnLUNyZWF0b3JXb3JrVVJMJywgJy1PcmllbnRhdGlvbiddXG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwocmVzLmxlbmd0aCwgZXhwZWN0ZWQubGVuZ3RoKVxuICAgICAgICAgICAgcmVzLmZvckVhY2goKGFyZywgaW5kZXgpID0+XG4gICAgICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKGFyZywgZXhwZWN0ZWRbaW5kZXhdKVxuICAgICAgICAgICAgKVxuICAgICAgICB9LFxuICAgICAgICAnc2hvdWxkIGV4Y2x1ZGUgbm9uLXN0cmluZ3MnOiAoKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBhcmdzID0gWydDcmVhdG9yJywgJ0NyZWF0b3JXb3JrVVJMJywgJ09yaWVudGF0aW9uJywgZmFsc2UsIE5hTiwgMTAyNF1cbiAgICAgICAgICAgIGNvbnN0IHJlcyA9IGxpYi5nZXRBcmdzKGFyZ3MpXG4gICAgICAgICAgICBjb25zdCBleHBlY3RlZCA9IFsnLUNyZWF0b3InLCAnLUNyZWF0b3JXb3JrVVJMJywgJy1PcmllbnRhdGlvbiddXG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwocmVzLmxlbmd0aCwgZXhwZWN0ZWQubGVuZ3RoKVxuICAgICAgICAgICAgcmVzLmZvckVhY2goKGFyZywgaW5kZXgpID0+XG4gICAgICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKGFyZywgZXhwZWN0ZWRbaW5kZXhdKVxuICAgICAgICAgICAgKVxuICAgICAgICB9LFxuICAgICAgICAnc2hvdWxkIHNwbGl0IGFyZ3VtZW50cyc6ICgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGFyZ3MgPSBbJ0NyZWF0b3InLCAnZXh0IGRuZycsICdvICBtZXRhZGF0YS50eHQnXVxuICAgICAgICAgICAgY29uc3QgcmVzID0gbGliLmdldEFyZ3MoYXJncylcbiAgICAgICAgICAgIGNvbnN0IGV4cGVjdGVkID0gWyctQ3JlYXRvcicsICctZXh0JywgJ2RuZycsICctbycsICdtZXRhZGF0YS50eHQnXVxuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHJlcy5sZW5ndGgsIGV4cGVjdGVkLmxlbmd0aClcbiAgICAgICAgICAgIHJlcy5mb3JFYWNoKChhcmcsIGluZGV4KSA9PlxuICAgICAgICAgICAgICAgIGFzc2VydC5lcXVhbChhcmcsIGV4cGVjdGVkW2luZGV4XSlcbiAgICAgICAgICAgIClcbiAgICAgICAgfSxcbiAgICAgICAgJ3Nob3VsZCBub3Qgc3BsaXQgYXJndW1lbnRzIHdpdGggbm9TcGxpdCc6ICgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGFyZ3MgPSBbJ2tleXdvcmRzKz1rZXl3b3JkIEEnLCAna2V5d29yZHMrPWtleXdvcmQgQicsICdjb21tZW50PWhlbGxvIHdvcmxkJ11cbiAgICAgICAgICAgIGNvbnN0IHJlcyA9IGxpYi5nZXRBcmdzKGFyZ3MsIHRydWUpXG4gICAgICAgICAgICBjb25zdCBleHBlY3RlZCA9IFsnLWtleXdvcmRzKz1rZXl3b3JkIEEnLCAnLWtleXdvcmRzKz1rZXl3b3JkIEInLCAnLWNvbW1lbnQ9aGVsbG8gd29ybGQnXVxuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHJlcy5sZW5ndGgsIGV4cGVjdGVkLmxlbmd0aClcbiAgICAgICAgICAgIHJlcy5mb3JFYWNoKChhcmcsIGluZGV4KSA9PlxuICAgICAgICAgICAgICAgIGFzc2VydC5lcXVhbChhcmcsIGV4cGVjdGVkW2luZGV4XSlcbiAgICAgICAgICAgIClcbiAgICAgICAgfSxcbiAgICB9LFxuICAgIGV4ZWN1dGU6IHtcbiAgICAgICAgJ3Nob3VsZCB3cml0ZSB0byBwcm9jZXNzIHN0ZGluJzogKCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgcmVjb3JkcyA9IFtdXG4gICAgICAgICAgICBjb25zdCBwcm9jZXNzID0ge1xuICAgICAgICAgICAgICAgIHN0ZGluOiB7XG4gICAgICAgICAgICAgICAgICAgIHdyaXRlOiByZWNvcmQgPT4gcmVjb3Jkcy5wdXNoKHJlY29yZCksXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IGNvbW1hbmQgPSAnZmlsZS5qcGcnXG4gICAgICAgICAgICBjb25zdCBjb21tYW5kTnVtYmVyID0gMVxuICAgICAgICAgICAgY29uc3QgYXJncyA9IFsgJ0NyZWF0b3InLCAnZXh0IGRuZycsICdvICBtZXRhZGF0YS50eHQnLCBmYWxzZSwgTmFOIF1cbiAgICAgICAgICAgIGNvbnN0IG5vU3BsaXRBcmdzID0gWyAnY29tbWVudD1oZWxsbyB3b3JsZCcgXVxuICAgICAgICAgICAgbGliLmV4ZWN1dGUocHJvY2VzcywgY29tbWFuZCwgY29tbWFuZE51bWJlciwgYXJncywgbm9TcGxpdEFyZ3MpXG4gICAgICAgICAgICBjb25zdCBleHBlY3RlZCA9IFtcbiAgICAgICAgICAgICAgICAnLWNvbW1lbnQ9aGVsbG8gd29ybGQnLFxuICAgICAgICAgICAgICAgICctQ3JlYXRvcicsXG4gICAgICAgICAgICAgICAgJy1leHQnLFxuICAgICAgICAgICAgICAgICdkbmcnLFxuICAgICAgICAgICAgICAgICctbycsXG4gICAgICAgICAgICAgICAgJ21ldGFkYXRhLnR4dCcsXG4gICAgICAgICAgICAgICAgJy1qc29uJyxcbiAgICAgICAgICAgICAgICAnLXMnLFxuICAgICAgICAgICAgICAgICdmaWxlLmpwZycsXG4gICAgICAgICAgICAgICAgJy1lY2hvMScsXG4gICAgICAgICAgICAgICAgJ3tiZWdpbjF9JyxcbiAgICAgICAgICAgICAgICAnLWVjaG8yJyxcbiAgICAgICAgICAgICAgICAne2JlZ2luMX0nLFxuICAgICAgICAgICAgICAgICctZWNobzQnLFxuICAgICAgICAgICAgICAgICd7cmVhZHkxfScsXG4gICAgICAgICAgICAgICAgJy1leGVjdXRlMScsXG4gICAgICAgICAgICBdLnJlZHVjZSgoYWNjLCBhcmcpID0+IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gW10uY29uY2F0KGFjYywgW2FyZywgRU9MXSlcbiAgICAgICAgICAgIH0sIFtdKVxuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHJlY29yZHMubGVuZ3RoLCBleHBlY3RlZC5sZW5ndGgpXG4gICAgICAgICAgICByZWNvcmRzLmZvckVhY2goKGFyZywgaW5kZXgpID0+XG4gICAgICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKGFyZywgZXhwZWN0ZWRbaW5kZXhdKVxuICAgICAgICAgICAgKVxuICAgICAgICB9LFxuICAgIH0sXG59XG5cbm1vZHVsZS5leHBvcnRzID0gbGliVGVzdFN1aXRlXG4iXX0=