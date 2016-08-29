'use strict';
const EOL = require('os').EOL;

/**
 * A deferred which promise will be resolved when both
 * data and error from exiftool process have been received.
 */
class CommandDeferred {
    constructor() {
        this._data = undefined;
        this._error = undefined;
        this._commandNumber = String(Math.floor(Math.random()*1000000)); //commandNumber;
        this._re = CommandDeferred._makeRegExp(this._commandNumber);
        this._promise = new Promise((resolve, reject) => {
            this._resolve = function(res) {
                resolve(res);
            }
            this._reject = function(err) {
                reject(err);
            }
        });
    }
    _addData(data) {
        //console.log(`Received data for ${this._commandNumber}: "${data}"`);
        if(data) {
            try {
                this._data = JSON.parse(data);
            } catch (err) {
                // should not really happen with -j flag
                this._reject(new Error('Could not parse response'));
            }
        } else {
            this._data = null;
        }
        this._sync();
    }
    _addError(error) {
        //console.log(`Received error for ${this._commandNumber}: "${error}"`);
        if(error) {
            this._error = error.trim();
        } else {
            this._error = null;
        }
        this._sync();
    }
    _sync(d, e) {
        if (this._data !== undefined && this._error !== undefined) {
            this._resolve({ data: this._data, error: this._error });
        }
    }
    get commandNumber() {
        return this._commandNumber;
    }
    get promise() {
        return this._promise;
    }
    matchData(string) {
        const res = this._re.exec(string);
        if (res) {
            this._addData(res[1]);
            return res[0];
        } else {
            return false;
        }
    }
    matchError(string) {
        const res = this._re.exec(string);
        if (res) {
            this._addError(res[1]);
            return res[0];
        } else {
            return false;
        }
    }
    reject(err) {
        this._reject(err);
    }
    get hasData() {
        return this._data !== undefined;
    }
    get hasError() {
        return this._error !== undefined;
    }
    static _makeRegExp(commandNumber) {
        return new RegExp(`{begin${commandNumber}}${EOL}` +
                          '([\\s\\S]*)' +
                          `{ready${commandNumber}}${EOL}`);
    }
}

module.exports = CommandDeferred;
