const fs = require("node:fs");
const fsPromise = require("node:fs/promises");
const path = require("node:path");
const ProgressBar = require("progress");
const { Transform } = require("node:stream");
const crypto = require("node:crypto");
const { StringDecoder } = require("node:string_decoder");

class MyTransform extends Transform {
  constructor(opts) {
    super(opts);
  }

  _transform(chunk, encoding, cb) {
    // this.push(chunk, encoding);
    // console.log("transform");
    cb();
  }

  _flush(cb) {
    this.push(Buffer.from([Number.parseInt("11101", 2)]));
    cb();
  }
}

class TT extends Transform {
  constructor(opts) {
    super(opts);
  }

  _transform(chunk, encoding, cb) {
    console.log(chunk);
    // this.push(Buffer.from(chunk, "base64"));
    cb();
  }
}

const progressBar = new ProgressBar(
  "handling: [:bar] :current/:total :percent :eta",
  { total: 1000, stream: process.stdout }
);

const filePath = "/Users/quepengbiao/Downloads/Download/test.mp4";

let count = 0;
const readStream = fs
  .createReadStream(filePath, { highWaterMark: 2 ** 10, start: 0, end: 5 })
  .on("data", (chunk) => {
    console.log(chunk);
    console.log(chunk.length);
  });
