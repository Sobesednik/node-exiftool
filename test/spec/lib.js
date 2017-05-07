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
            const expected = [ '-Creator', EOL, '-ext', EOL, 'dng', EOL, '-o', EOL, 'metadata.txt',
                EOL, '-comment=hello world', EOL, '-json', EOL, '-s', EOL, 'file.jpg', EOL,
                '-echo1', EOL, '{begin1}', EOL, '-echo2', EOL, '{begin1}', EOL, '-echo4', EOL,
                '{ready1}', EOL, '-execute1', EOL ]
            assert.equal(records.length, expected.length)
            records.forEach((arg, index) =>
                assert.equal(arg, expected[index])
            )
        },
    },
}

module.exports = libTestSuite
