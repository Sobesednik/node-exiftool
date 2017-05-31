const exiftoolBin = require('dist-exiftool')
const exiftoolContext = require('exiftool-context')
const fs = require('fs')
const path = require('path')
const lib = require('./lib')
const exiftool = require('../src/index')

const context = {}
exiftoolContext.call(context)
const CANON = context.folder

const photosDirPath = path.join(__dirname, 'photos')
const testFixturesDirPath = CANON

const benchmarkFiles = lib.getFilesInDir(photosDirPath)
const fixturesFiles = lib.getFilesInDir(testFixturesDirPath)

if (!benchmarkFiles.length) {
    console.log('Place some pictures in benchmark/photos directory.'
        + ' Using test fixtures for now.')
}

const files = benchmarkFiles.length ? benchmarkFiles : fixturesFiles

function runOpenExiftoolBenchmark(ds, files) {
    const ep = new exiftool.ExiftoolProcess(exiftoolBin)
    const result = {}
    return lib.measureOpenEp(ep)
        .then((res) => {
            result.open = res
            const readFn = lib.runOpenProcessRead.bind(null, ep)
            const rs = lib.createReadStream(readFn, files)
            rs.pipe(ds).pipe(process.stdout)
            return lib.readStream(rs)
        })
        .then((res) => {
            result.results = res
            return lib.measureCloseEp(ep)
        })
        .then((res) => {
            result.close = res
        })
        .then(() => result)
        .then((res) => {
            const resultsTime = lib.reduceResultsTime(res.results)
            res.results.time = resultsTime
            const total = res.open.time + res.results.time + res.close.time
            res.total = total
            res.average = Math.floor(total / res.results.length * 100) / 100
            return res
        })
}

function runOpenExiftoolRsBenchmark(ds, files) {
    const rsArray = files.map(file => fs.createReadStream(file))
    const ep = new exiftool.ExiftoolProcess(exiftoolBin)
    const result = {}
    return lib.measureOpenEp(ep)
        .then((res) => {
            result.open = res
            const readFn = lib.runOpenProcessRead.bind(null, ep)
            const rs = lib.createReadStream(readFn, rsArray)
            rs.pipe(ds).pipe(process.stdout)
            return lib.readStream(rs)
        })
        .then((res) => {
            result.results = res
            return lib.measureCloseEp(ep)
        })
        .then((res) => {
            result.close = res
        })
        .then(() => result)
        .then((res) => {
            const resultsTime = lib.reduceResultsTime(res.results)
            res.results.time = resultsTime
            const total = res.open.time + res.results.time + res.close.time
            res.total = total
            res.average = Math.floor(total / res.results.length * 100) / 100
            return res
        })
}

function runExiftoolBenchmark(ds, files) {
    const rs = lib.createReadStream(lib.runProcessRead.bind(null, exiftoolBin), files)
    rs.pipe(ds).pipe(process.stdout)
    return lib.readStream(rs)
        .then((res) => {
            const output = {
                results: res,
            }
            const resultsTime = lib.reduceResultsTime(output.results)
            output.results.time = resultsTime
            output.total = resultsTime
            output.average = Math.floor(resultsTime / output.results.length * 100) / 100
            return output

        })
}

function runBenchmark() {
    const ds = lib.createDisplayStream(lib.getObjectPrint)
    const ds2 = lib.createDisplayStream(lib.getObjectPrint)
    const ds3 = lib.createDisplayStream(lib.getObjectPrint)

    const benchResults = {}
    return runExiftoolBenchmark(ds, files)
        .then(res => { benchResults.exiftool = res })
        .then(runOpenExiftoolBenchmark.bind(null, ds2, files))
        .then(res => { benchResults.exiftoolOpen = res })
        .then(() => runOpenExiftoolRsBenchmark(ds3, files))
        .then(res => { benchResults.exiftoolOpenRs = res })
        .then(() => benchResults)
}

runBenchmark()
    .then((res) => {
        const exiftoolOpenTime = res.exiftoolOpen.total
        const exiftoolTime = res.exiftool.total
        const percent = Math.floor(exiftoolTime / exiftoolOpenTime * 100)
        console.log()
        console.log('Exiftool')
        console.log(`Read ${res.exiftool.results.length} files`)
        console.log(`Total time: ${exiftoolTime}ms`)
        console.log(`Average time: ${res.exiftool.average}ms`)
        console.log()
        console.log('Exiftool Open')
        console.log(`Read ${res.exiftoolOpen.results.length} files`)
        console.log(`Total time: ${exiftoolOpenTime}ms`)
        console.log(`Average time: ${res.exiftoolOpen.average}ms`)
        console.log()
        console.log('Exiftool Open using ReadStreams')
        console.log(`Read ${res.exiftoolOpenRs.results.length} files`)
        console.log(`Total time: ${res.exiftoolOpenRs.total}ms`)
        console.log(`Average time: ${res.exiftoolOpenRs.average}ms`)
        console.log()
        console.log(`Exiftool Open was faster by ${percent}%`)
    })
