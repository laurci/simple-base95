import {Buffer as SafeBuffer} from "safe-buffer";
import {ALPHABET} from "./alphabet";

function makeBaseMap() {
    const baseMap = new Uint8Array(256).fill(0xff);
    for (let index = 0; index < ALPHABET.length; index++) {
        const ch = ALPHABET.charAt(index);
        const idxCh = ALPHABET.charCodeAt(index);

        if (baseMap[idxCh] !== 255) throw new Error(`Alphabet element '${ch}' is ambiguous`);

        baseMap[idxCh] = index;
    }

    return baseMap;
}

const primitives = {
    base: ALPHABET.length,
    baseMap: makeBaseMap(),
    leader: ALPHABET.charAt(0),
    factor: Math.log(ALPHABET.length) / Math.log(256), // log(base) / log(max base size),
    inverseFactor: Math.log(256) / Math.log(ALPHABET.length),
};

export function tryEncode(input: Buffer | number[] | Uint8Array): string {
    const source = Array.isArray(input)
        ? input instanceof Uint8Array
            ? SafeBuffer.from(input)
            : SafeBuffer.from(input)
        : SafeBuffer.from(input);

    if (source.length === 0) return "";

    let zeros = 0;
    let length = 0;
    let padBegin = 0;
    const padEnd = source.length;

    while (padBegin !== padEnd && source.readUInt8(padBegin) === 0) {
        padBegin++;
        zeros++;
    }

    const size = ((padEnd - padBegin) * primitives.inverseFactor + 1) >>> 0;
    const encoded = new Uint8Array(size);

    while (padBegin !== padEnd) {
        let carry = source.readUInt8(padBegin);

        // Apply "encoded = encoded * 256 + ch".
        let index = 0;

        for (let iterator = size - 1; (carry !== 0 || index < length) && iterator !== -1; iterator--, index++) {
            carry += (256 * encoded[iterator]) >>> 0;
            encoded[iterator] = carry % primitives.base >>> 0;
            carry = (carry / primitives.base) >>> 0;
        }

        if (carry !== 0) throw new Error("Non-zero carry");
        length = index;
        padBegin++;
    }

    let iterator = size - length;
    while (iterator !== size && encoded[iterator] === 0) {
        iterator++;
    }

    let str = primitives.leader.repeat(zeros);
    for (; iterator < size; ++iterator) str += ALPHABET.charAt(encoded[iterator]);

    return str;
}

export function tryDecodeUnsafe(source: string): Buffer | undefined {
    if (source.length === 0) return Buffer.alloc(0);

    let pos = 0;

    // Skip leading spaces.
    if (source[pos] === " ") return;

    // Skip and count leading '1's.
    let zeros = 0;
    let length = 0;
    while (source[pos] === primitives.leader) {
        zeros++;
        pos++;
    }

    // Allocate enough space in big-endian base256 representation.
    const size = ((source.length - pos) * primitives.factor + 1) >>> 0; // log(base) / log(max base)
    const decoded = new Uint8Array(size);

    while (source[pos]) {
        let carry = primitives.baseMap[source.charCodeAt(pos)];

        if (carry === 255) return;

        let i = 0;
        for (let iterator = size - 1; (carry !== 0 || i < length) && iterator !== -1; iterator--, i++) {
            carry += (primitives.base * decoded[iterator]) >>> 0;
            decoded[iterator] = carry % 256 >>> 0;
            carry = (carry / 256) >>> 0;
        }

        if (carry !== 0) throw new Error("Non-zero carry");
        length = i;
        pos++;
    }

    if (source[pos] === " ") return;

    // Skip leading zeroes in b256.
    let iterator = size - length;
    while (iterator !== size && decoded[iterator] === 0) {
        iterator++;
    }

    const out = Buffer.allocUnsafe(zeros + (size - iterator));
    out.fill(0x00, 0, zeros);

    let j = zeros;
    while (iterator !== size) {
        out[j++] = decoded[iterator++];
    }

    return out;
}

export function tryDecode(string: string): Buffer {
    const buffer = tryDecodeUnsafe(string);
    if (buffer) return buffer;

    throw new Error("Non-base" + primitives.base + " character");
}
