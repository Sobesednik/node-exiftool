'use strict'

const Transform = require('stream').Transform
const Writable = require('stream').Writable
const restream = require('restream')

const BEGIN_READY_RE = /{begin(\d+)}([\s\S]*){ready\1}/g


/**
 * A transform stream which will mutate data from regex stream into an object
 * with commandNumber and data.
 * @return {Transfrom} A transform stream into which exiftool process stdout and
 * stderr can be piped. It will push objects in form of { cn: commandNumber, d: data }
 */
function createBeginReadyMatchTransformStream() {
    const ts = new Transform({ objectMode: true })
    // expecting data from RegexTransformStream with BEGIN_READY_RE
    ts._transform = (match, enc, next) => {
        const data = {
            cn: match[1],
            d: match[2].trim(),
        }
        next(null, data)
    }
    return ts
}

/**
 * A write stream which will maintain a map of commands which are waiting
 * to be resolved, where keys are the corresponding resolve promise. The
 * stream will expect input from BeginReady Transform Stream.
 * @return {Writable} A write stream extended with `addToResolveMap` method.
 * @see createBeginReadyTransformStream
 */
function createResolverWriteStream() {
    const ws = new Writable({
        objectMode: true,
    })
    ws._resolveMap = {}
    ws.addToResolveMap = function(commandNumber, resolve) {
        if (typeof commandNumber !== 'string') {
            throw new Error('commandNumber argument must be a string')
        }
        if (typeof resolve !== 'function') {
            throw new Error('resolve argument must be a function')
        }
        if (this._resolveMap[commandNumber]) {
            throw new Error('Command with the same number is already expected')
        }
        this._resolveMap[commandNumber] = resolve
    }
    ws._write = function (obj, enc, next) {
        const commandNumber = obj.cn
        const data = obj.d
        const resolve = this._resolveMap[commandNumber]
        if (resolve) {
            resolve(data)
            delete this._resolveMap[commandNumber]
            next()
        } else {
            next(new Error(`Command with index ${commandNumber} not found`))
        }
    }
    return ws
}

/**
 * Setup a pipe from process std stream into resolve write stream
 * through regex transform and begin-ready transform streams.
 * @param {Readable} rs Readable stream (from exiftool process)
 * @return {Writable} A Resolve transform stream.
 */
function setupResolveWriteStreamPipe(rs) {
    const rts = restream(BEGIN_READY_RE)
    const brmts = createBeginReadyMatchTransformStream()
    const rws = createResolverWriteStream()

    return rs.pipe(rts).pipe(brmts).pipe(rws)
}

module.exports = {
    createBeginReadyMatchTransformStream,
    createResolverWriteStream,
    BEGIN_READY_RE,
    setupResolveWriteStreamPipe,
}
