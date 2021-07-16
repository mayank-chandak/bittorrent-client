'use strict';

const dgram = require('dgram');
const Buffer = require('buffer').Buffer;
const urlParse = require('url').parse;
const crypto = require('crypto');

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
            const announceReq = buildAnnounceReq(connResp.connectionId);
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

}

function buildAnnounceReq(connId){

}

function parseAnnounceRes(resp){
    
}