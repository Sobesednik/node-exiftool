const assert = require('assert')
const EOL = require('os').EOL
const lib = require('../../src/lib')

const libTestSuite = {
    checkDataObject: {
        'should return true on object': () => {
            const data = {
                comment: 'hello world',
            }
            assert(lib.checkDataObject(data))
        },
        'should return true on Object': () => {
            const data = new Object('foo')
            assert(lib.checkDataObject(data))
        },
        'should return false on string': () => {
            assert(!lib.checkDataObject('hello world'))
        },
        'should return false on boolean': () => {
            assert(!lib.checkDataObject(true))
        },
        'should return false on array': () => {
            assert(!lib.checkDataObject(['hello world']))
        },
    },
    mapDataToTagArray: {
        'should return an array with tags': () => {
            const data = {
                tagA: 'valueA',
                tagB: 'valueB',
            }
            const res = lib.mapDataToTagArray(data)
            assert.equal(res[0], 'tagA=valueA')
            assert.equal(res[1], 'tagB=valueB')
        },
        'should return multiple entries when value is an array': () => {
            const data = {
                'tag+': [ 'valueA', 'valueB' ],
            }
            const res = lib.mapDataToTagArray(data)
            assert.equal(res[0], 'tag+=valueA')
            assert.equal(res[1], 'tag+=valueB')
        },
        'should push values to existing array': () => {
            const array = [ 'json' ]
            const data = {
                tagA: 'valueA',
                tagB: 'valueB',
                'tagC+': [ 'valueC1', 'valueC2' ],

            }
            lib.mapDataToTagArray(data, array)
            assert.equal(array[0], 'json')
            assert.equal(array[1], 'tagA=valueA')
            assert.equal(array[2], 'tagB=valueB')
            assert.equal(array[3], 'tagC+=valueC1')
            assert.equal(array[4], 'tagC+=valueC2')
        },
    },
    getArgs: {
        'should return empty array if argument is not array': () => {
            const res = lib.getArgs('non-array')
            assert.deepEqual(res, [])
        },
        'should return empty array if argument is empty array': () => {
            const res = lib.getArgs([])
            assert.deepEqual(res, [])
        },
        'should map args array to a string': () => {
            const args = ['Creator', 'CreatorWorkURL', 'Orientation']
            const res = lib.getArgs(args)
            const expected = ['-Creator', '-CreatorWorkURL', '-Orientation']
            assert.equal(res.length, expected.length)
            res.forEach((arg, index) =>
                assert.equal(arg, expected[index])
            )
        },
        'should exclude non-strings': () => {
            const args = ['Creator', 'CreatorWorkURL', 'Orientation', false, NaN, 1024]
            const res = lib.getArgs(args)
            const expected = ['-Creator', '-CreatorWorkURL', '-Orientation']
            assert.equal(res.length, expected.length)
            res.forEach((arg, index) =>
                assert.equal(arg, expected[index])
            )
        },
        'should split arguments': () => {
            const args = ['Creator', 'ext dng', 'o  metadata.txt']
            const res = lib.getArgs(args)
            const expected = ['-Creator', '-ext', 'dng', '-o', 'metadata.txt']
            assert.equal(res.length, expected.length)
            res.forEach((arg, index) =>
                assert.equal(arg, expected[index])
            )
        },
        'should not split arguments with noSplit': () => {
            const args = ['keywords+=keyword A', 'keywords+=keyword B', 'comment=hello world']
            const res = lib.getArgs(args, true)
            const expected = ['-keywords+=keyword A', '-keywords+=keyword B', '-comment=hello world']
            assert.equal(res.length, expected.length)
            res.forEach((arg, index) =>
                assert.equal(arg, expected[index])
            )
        },
    },
    execute: {
        'should write to process stdin': () => {
            const records = []
            const process = {
                stdin: {
                    write: record => records.push(record),
                },
            }
            const command = 'file.jpg'
            const commandNumber = 1
            const args = [ 'Creator', 'ext dng', 'o  metadata.txt', false, NaN ]
            const noSplitArgs = [ 'comment=hello world' ]
            lib.execute(process, command, commandNumber, args, noSplitArgs)
            const expected = [
                '-comment=hello world',
                '-Creator',
                '-ext',
                'dng',
                '-o',
                'metadata.txt',
                '-json',
                '-s',
                'file.jpg',
                '-echo1',
                '{begin1}',
                '-echo2',
                '{begin1}',
                '-echo4',
                '{ready1}',
                '-execute1',
            ].reduce((acc, arg) => {
                return [].concat(acc, [arg, EOL])
            }, [])
            assert.equal(records.length, expected.length)
            records.forEach((arg, index) =>
                assert.equal(arg, expected[index])
            )
        },
    },
}

module.exports = libTestSuite
