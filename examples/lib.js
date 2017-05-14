const fs = require('fs')

// create temp file for writing metadata
function cloneFile(originalFile, file) {
    return new Promise((resolve, reject) => {
        const rs = fs.createReadStream(originalFile)
        const ws = fs.createWriteStream(file)
        rs.on('error', reject)
        ws.on('error', reject)
        ws.on('close', () => {
            resolve(file)
        })
        rs.pipe(ws)
    })
}

function makeFileNameWithParams(basename, params, extension) {
    const paramsStr = Object.keys(params)
        .reduce((acc, key) => {
            const value = params[key]
            return [].concat(acc, [`${key}=${value}`])
        }, []).join('')
    const filename = `${basename}-${paramsStr}.${extension}`
    return filename
}
const makeJpegFilenameWithParams = (basename, params) => makeFileNameWithParams(basename, params, 'jpg')

module.exports = {
    cloneFile,
    makeJpegFilenameWithParams,
}
