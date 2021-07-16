'use strict';

const dgram = require('dgram');
const Buffer = require('buffer').Buffer;
const urlParse = require('url').parse;
const crypto = require('crypto');
const torrentParser = require('./torrent-parser')
const util = require('./util')

module.exports.getPeers = (torrent, callback) => {
    const socket = dgram.createSocket('udp4');
    const url = torrent.announce.toString('utf8');

    // sending connection request
    udpSend(socket, buildConnReq(), url);

    socket.on('message', response => {
        if (respType(response) === 'connect') {
            // receive and parse connection response
            const connResp = parseConnResp(response);
            // send announce request
            const announceReq = buildAnnounceReq(connResp.connectionId, torrent);
            udpSend(socket, announceReq, url);
        } else if (respType(response) === 'announce') {
            // parse announce request
            const announceResp = parseAnnounceResp(response);
            // pass peers to callback
            callback(announceResp.peers);
        }
    });
};

function udpSend(socket, message, rawUrl, callback=()=>{}) {
    const url = urlParse(rawUrl);
    socket.send(message, 0, message.length, url.port, url.host, callback);
}

function respType(){
    const action = resp.readUInt32BE(0);
    if (action === 0) return 'connect';
    if (action === 1) return 'announce';
}

function buildConnReq(){
    const buf = Buffer.alloc(16);

    // magic constant for UDP... protocol ID
    buf.writeUInt32BE(0x417);
    buf.writeUInt32BE(0x27101980);

    //action: 0 connect
    buf.writeUInt32BE(0, 8);

    //random transaction ID
    crypto.randomBytes(4).copy(buf, 12);

    return buf;
}

function parseConnResp(){
    return {
        action: resp.readUInt32BE(0),
        transactionId: resp.readUInt32BE(4),
        connectionId: resp.slice(8)
    }
}

function buildAnnounceReq(connId, torrent, port=6881){
    const buf = Buffer.allocUnsafe(98);
    
    // connection ID
    connId.copy(buf, 0);
    // action: 1 announce
    buf.writeUInt32BE(1, 8);
    // transaction ID
    crypto.randomBytes(4).copy(buf, 12);
    //  info_hash
    torrentParser.infoHash(torrent).copy(buf, 16);
    //  peer ID
    util.genId().copy(buf, 36);
    // downloaded
    Buffer.alloc(8).copy(buf, 56);
    // left
    torrentParser.size(torrent).copy(buf, 64);
    // uploaded
    Buffer.alloc(8).copy(buf, 72);
    // event
    buf.writeUInt32BE(0, 80);
    // IP address
    buf.writeUInt32BE(0, 84);
    // key
    crypto.randomBytes(4).copy(buf, 88);
    // num_want
    buf.writeInt32BE(-1, 92);
    // port
    buf.writeUInt16BE(port, 96);

    return buf;

}

function parseAnnounceRes(resp){
    function group(iterable, groupSize){
        let groups = [];
        for (let i = 0; i < iterable.length; i += groupSize){
            groups.push(iterable.slice(i, i + groupSize));
        }
        return groups;
    }

    return {
        action: resp.readUInt32BE(0),
        transactionId: resp.readUInt32BE(4),
        leechers: resp.readUInt32BE(8),
        seeders: resp.readUInt32BE(12),
        peers: group(resp.slice(20), 6).map(address => {
            return {
                ip: address.slice(0, 4).join('.'),
                port: address.readUInt16BE(4)
            }
        })
    }
}