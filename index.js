'use strict';

const fs = require('fs');
const bencode = require('bencode');

const torrent = bencode.decode(fs.readFileSync('sample.torrent'));
console.log(torrent.announce.toString('utf8'));