'use strict';

const Buffer = require('buffer').Buffer;
const tracker = require('./tracker');

module.exports = torrent => {
    tracker.getPeers(torrent, peers => {
        console.log('list of peers:', peers);
    });
};