const context = require('../context/ExiftoolContext')
const lib = require('../../src/lib')
const assert = require('assert')
const fs = require('fs')

const libTestSuite = {
    // spawn: () => {
    //     return lib.spawn('hello-world')
    //         .then(console.log, (err) => {
    //             assert.deepEqual(
    //                 err.spawnargs.filter((_value, i) => i !== 1),
    //                 [ '-echo2', '-stay_open', 'True', '-@', '-' ]
    //             )
    //         })
    // },
    // spawnFromFile: () => {
    //     return lib.spawn('hello-world', '/Users/test/temp.data')
    //         .then(console.log, (err) => {
    //             assert.deepEqual(
    //                 err.spawnargs.filter((_value, i) => i !== 1),
    //                 [ '-echo2', '-stay_open', 'True', '-@', '/Users/test/temp.data' ]
    //             )
    //         })
    // },
    Exiftool: {
        context,
        // 'should be able to quit': (ctx) => {
        //     ctx.create()
        //     return ctx.createDataFile(null, 'data')
        //         .then(file => ctx.open('utf8', file, true))
        //         .then(() => {
        //             assert(ctx.ep._process.stdin.writable)
        //             assert(ctx.ep._process.stdout.readable)
        //             assert(ctx.ep._process.stderr.readable)
        //             return ctx.close()
        //         })
        //         .then(() => {
        //             assert(!ctx.ep._process.stdin.writable)
        //             assert(!ctx.ep._process.stdout.readable)
        //             assert(!ctx.ep._process.stderr.readable)
        //         })
        // },
        // 'should close the process': (ctx) => {
        //     ctx.create()
        //     return ctx.createDataFile(null, 'data')
        //         .then(() => ctx.open('utf8', ctx.dataFile, true))
        //         .then(() => {
        //             // console.log('data file: %s', ctx.dataFile)
        //             const p = new Promise(resolve => ctx.ep._process.on('close', () => {
        //                 resolve()
        //             }))

        //             return ctx.close()
        //                 .then(() => p)
        //         })
        // },
        // 'should read metadata': (ctx) => {
        //     ctx.create()
        //     return ctx.createDataFile(null, 'data')
        //         .then(() => ctx.open('utf8', ctx.dataFile, true))
        //         .then(() => ctx.createTempFile())
        //         .then((file) => {
        //             console.log('data file: %s', ctx.dataFile)
        //             return ctx.readMetadata(file, [], true)
        //         })
        //         .then((res) => {
        //             assert(Array.isArray(res.data))
        //             assert.equal(res.error, null)
        //             res.data.forEach(ctx.assertJpegMetadata)
        //         })
        // },
        // 'should read metadata from a stream': (ctx) => {
        //     ctx.create()
        //     const rs = fs.createReadStream(ctx.jpegFile)
        //     return new Promise((resolve, reject) => {
        //         rs.once('open', resolve)
        //         rs.once('error', reject)
        //     })
        //         .then(() => ctx.createDataFile(null, 'data'))
        //         .then(() => ctx.open('utf8', ctx.dataFile, true))
        //         .then(() => {
        //             console.log('data file: %s', ctx.dataFile)
        //             lib.execute(process, '-', '123')
        //             lib.execute({
        //                 stdin: ctx.ep._ws,
        //             }, '-', '123')
        //             return new Promise(r => setTimeout(r, 200))
        //             // return ctx.readMetadata(ctx.jpegFile, [], true)
        //         })
        //         .then(() => {
        //             return new Promise((resolve) => {
        //                 // rs.pipe(ctx.ep._process.stdin)
        //                 // rs.on('close', resolve)
        //             })
        //         })
        //         .then(() => {
        //             return new Promise(r => setTimeout(r, 200))
        //         })
        // },
        'should read metadata from a stream': (ctx) => {
            ctx.create()
            const rs = fs.createReadStream(ctx.jpegFile)
            return new Promise((resolve, reject) => {
                rs.once('open', resolve)
                rs.once('error', reject)
            })
                // .then(() => ctx.createDataFile(null, 'data'))
                .then(() => ctx.open('utf8', null, true))
                .then(() => {
                    console.log('data file: %s', ctx.dataFile)
                    // lib.execute(process, '-', '123')
                    // lib.execute({
                    //     stdin: ctx.ep._ws,
                    // }, '-', '123')
                    // return new Promise(r => setTimeout(r, 200))
                    return ctx.ep.readMetadataFromStream(rs)
                })
                .then((res) => {
                    console.log(res)
                    // return new Promise((resolve) => {
                    //     // rs.pipe(ctx.ep._process.stdin)
                    //     // rs.on('close', resolve)
                    // })
                })
                .then(() => {
                    return new Promise(r => setTimeout(r, 200))
                })
        },
    },
}

module.exports = {
    lib: {
        libTestSuite,
    },
}
