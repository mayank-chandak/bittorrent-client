'use strict';

const tp = require('./torrent-parser');

module.exports = class {
    constructor(torrent) {
        function buildPiecesArray() {
            const nPieces = torrent.info.pieces.length / 20;
            const arr = new Array(nPieces).fill(null);

            return arr.map((_, i) => new Array(tp.blocksPerPiece(torrent, i)).fill(false));
        }

        this._requested = new Array(size).fill(false);
        this._received = new Array(size).fill(false);
    }

    addRequested(pieceBlock) {
        const blockIndex = pieceBlock.begin / tp.BLOCK_LEN;
        this._requested[pieceBlock.index][blockIndex] = true;
    }

    addReceived(pieceBlock) {
        const blockIndex = pieceBlock.begin / tp.BLOCK_LEN;
        this._recieved[pieceBlock.index][blockIndex] = true;
    }

    needed(pieceBlock) {
        if (this._requested.every(blocks => blocks.every(i => i))){
            this._requested = this._received.map(blocks => blocks.slice());
        }
        const blockIndex = pieceBlock.begin / tp.BLOCK_LEN;
        return !this._requested[pieceBlock.index][blockIndex];
    }

    isDone() {
        return this._received.every(blocks => blocks.every(i => i));
    }
};