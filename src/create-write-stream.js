const fs = require('fs')

function createWriteStream(filePath, options) {
    let errorRejectListener
    let openResolveListener
    let writeStream
    const after = () => {
        writeStream.removeListener('error', errorRejectListener)
        writeStream.removeListener('open', openResolveListener)
        return writeStream
    }
    return new Promise((resolve, reject) => {
        errorRejectListener = reject
        writeStream = fs.createWriteStream(filePath, options || {})
        writeStream.on('error', errorRejectListener)
        openResolveListener = () => resolve(writeStream)
        writeStream.on('open', openResolveListener)
    })
        .then(after, (err) => { after(); throw err } )
}

module.exports = createWriteStream
