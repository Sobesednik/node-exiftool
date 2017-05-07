const exiftoolBin = require('dist-exiftool')
const exiftool = require('../../src/index')

const exiftoolProcesses = []

const context = function Context() {
    this._ep = null,
    this.defaultBin = 'exiftool'
    Object.defineProperties(this, {
        ep: {
            get: () => this._ep,
        },
        create: { value: (bin) => {
            const ep = new exiftool.ExiftoolProcess(
                typeof bin === 'string' ? bin : exiftoolBin
            )
            exiftoolProcesses.push(ep)
            this._ep = ep
            return this
        }},
        open: { value: () => {
            if (this.ep)
                return this.ep.open()
            throw new Error('ep has not been created')
        }},
        createOpen: { value: (bin) => {
            return this.create(bin).open()
        }},
        close: { value: () => {
            if (this.ep)
                return this.ep.close()
            throw new Error('ep has not been created')
        }},
        readMetadata: { value: function readMetadata() {
            if (this.ep)
                return this.ep.readMetadata.apply(this.ep, arguments)
            throw new Error('ep has not been created')
        }},
        writeMetadata: { value: function writeMetadata() {
            if (this.ep)
                return this.ep.writeMetadata.apply(this.ep, arguments)
            throw new Error('ep has not been created')
        }},
        initAndReadMetadata: { value: function initAndReadMetadata() {
            return this.createOpen()
                .then(() => {
                    return this.readMetadata.apply(this, arguments)
                })
        }},
        initAndWriteMetadata: { value: function initAndWriteMetadata() {
            return this.createOpen()
                .then(() => this.writeMetadata.apply(this, arguments))
        }},
        exiftoolProcesses: { get: () => exiftoolProcesses.slice() },
    })
}

module.exports = context
