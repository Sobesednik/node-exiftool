const assert = require('assert')
const lib = require('../../src/lib')

const libTestSuite = {
    'checkDataObject': {
        'should return true on object': () => {
            const data = {
                'comment': 'hello world',
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
    'mapDataToTagArray': {
        'should return an array with tags': () => {
            const data = {
                tagA: 'valueA',
                tagB: 'valueB',
            }
            const res = lib.mapDataToTagArray(data)
            assert(res[0] === 'tagA=valueA')
            assert(res[1] === 'tagB=valueB')
        },
        'should return multiple entries when value is an array': () => {
            const data = {
                'tag+': [ 'valueA', 'valueB' ],
            }
            const res = lib.mapDataToTagArray(data)
            assert(res[0] === 'tag+=valueA')
            assert(res[1] === 'tag+=valueB')
        },
        'should push values to existing array': () => {
            const array = [ 'json' ]
            const data = {
                tagA: 'valueA',
                tagB: 'valueB',
                'tagC+': [ 'valueC1', 'valueC2' ],

            }
            lib.mapDataToTagArray(data, array)
            assert(array[0] === 'json')
            assert(array[1] === 'tagA=valueA')
            assert(array[2] === 'tagB=valueB')
            assert(array[3] === 'tagC+=valueC1')
            assert(array[4] === 'tagC+=valueC2')
        },
    }
}

module.exports = libTestSuite
