'use strict'
const wrote = require('wrote')
const Readable = require('stream').Readable

/**
 * Create temp file for rs, execute exiftool command, then erase file
 * @param {Readable} rs a read strem
 * @param {string[]} args Arguments
 * @param {function} executeCommand function which is responsible for executing the command
 */
function executeWithRs(rs, args, executeCommand) {
    if (!(rs instanceof Readable)) {
        return Promise.reject(new Error('Please pass a readable stream'))
    }
    if (typeof executeCommand !== 'function') {
        return Promise.reject(new Error('executeCommand must be a function'))
    }
    let ws
    return wrote() // temp file will be created
        .then((res) => {
            ws = res
            rs.pipe(ws)
            return executeCommand(ws.path, args)
        })
        .then((res) => {
            return wrote.erase(ws)
                .then(() => {
                    return res
                })
        }, (err) => {
            return wrote.erase(ws)
                .then(() => {
                    throw err
                })
        })
}

module.exports = executeWithRs
