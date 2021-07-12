import {tryEncode, tryDecode} from "./index";

function dummyInput() {
    let input = "";
    for (let i = 0; i < 10; i++) {
        input += " TEST test " + i + " ";
    }
    return input.trim();
}

const encoded = tryEncode(Buffer.from(dummyInput(), "ascii"));
const decoded = tryDecode(encoded).toString("ascii");

console.log(decoded.length, encoded.length);
console.log("encoded size", encoded.length / decoded.length, "times larger");

console.log(encoded);
console.log(decoded);
