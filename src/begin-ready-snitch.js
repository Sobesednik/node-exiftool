'use strict'
const EventEmitter = require('events');
const StreamSnitch = require('stream-snitch');

const BEGIN_READY_RE = /{begin(\d+)}([\s\S]*){ready(\d+)}/

class BeginReadySnitch extends EventEmitter {
    constructor(stream) {
        super()
        const snitch = new StreamSnitch(BEGIN_READY_RE)
        snitch.on('match', (data) => {
            this.emit('data', {
                commandNumber: parseInt(data[1], 10),
                data: data[2].trim(),
            })
        })
        stream.pipe(snitch)
    }
}

module.exports = BeginReadySnitch;
