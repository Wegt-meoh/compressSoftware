const os = require("os");
const path = require("path");
const ProgressBar = require("progress");
const { HuffmanCoder } = require("./huffmanCoder");
const fs = require("fs");
const {
  encodingStringToBuffer,
  addZeroEndOfStringLetLengthDividedBy8,
  parseMapToJSON,
} = require("./utils");
const { Transform } = require("stream");
const __CPU_NUM = os.cpus().length;
const __STRING_MAX_LENGTH__ = 2 ** 28 - 16;
const __Uint8Array_MAX_LENGTH = 4 * 2 ** 30;

function logError(err) {
  if (err) {
    console.log(err);
  }
}

function checkPathValid(sourceFilePath, targetDirPath) {
  if (
    (typeof sourceFilePath !== "string") |
    (typeof targetDirPath !== "string")
  ) {
    throw new Error("path need to be string");
  }

  if (fs.existsSync(sourceFilePath)) {
    if (!fs.statSync(sourceFilePath).isFile()) {
      throw new Error(sourceFilePath + " is not a file");
    }
    fs.accessSync(sourceFilePath, fs.constants.R_OK);
  } else {
    throw new Error(sourceFilePath + " is not exist");
  }

  if (fs.existsSync(targetDirPath)) {
    if (fs.statSync(targetDirPath).isDirectory()) {
      fs.accessSync(targetDirPath, fs.constants.W_OK | fs.constants.R_OK);
    } else {
      throw new Error(targetDirPath + " is not a dir");
    }
  } else {
    fs.mkdirSync(targetDirPath, { recursive: true });
  }
}

/**
 *
 * @param {string} filePath
 * @param {string} label
 * @returns {[fs.Stats,ProgressBar]}
 */
function generateProgressBar(filePath, label) {
  const stat = fs.statSync(filePath);
  const progressBar = new ProgressBar(
    label + ": [:bar] :current/:total :percent :eta",
    { total: stat.size, stream: process.stdout }
  );

  return [stat, progressBar];
}

/**
 * for example:
 * input = /usr/tmp/test.txt
 * output= /usr/tmp/test_{d}.txt, d=0,1,2,3... until output not exist
 * @param {string} filePath
 */
function getNonRepeateFilePath(filePath) {
  if (!fs.existsSync(filePath)) {
    return filePath;
  }
  const basename = path.basename(filePath);
  const extName = basename.slice(basename.indexOf("."));
  const dirPath = filePath.slice(0, filePath.indexOf(basename));
  const fileName = basename.slice(0, basename.indexOf("."));
  let index = 0;
  while (
    fs.existsSync(path.resolve(dirPath, `${fileName}_${index}${extName}`))
  ) {
    index += 1;
  }
  return path.resolve(dirPath, `${fileName}_${index}${extName}`);
}

class ProgressBarTansform extends Transform {
  constructor(opts, progressBar) {
    super(opts);
    this.progressBar = progressBar;
  }
}

class CustomTransform extends Transform {
  #lastRestString = "";
  totalZeroCount = 0;

  constructor(opts, encodingTable) {
    super(opts);
    this.encodingTable = encodingTable;
  }

  _transform(chunk, _, cb) {
    try {
      const [restString, buffer] = recodeBuffer(
        chunk,
        this.encodingTable,
        this.#lastRestString
      );
      this.#lastRestString = restString;
      this.push(buffer);
      cb();
    } catch (error) {
      cb(error);
    }
  }

  _flush(cb) {
    try {
      if (this.#lastRestString.length >= 8) {
        throw new Error(
          "lastRestString length can not be greater or equal than 8"
        );
      }
      while (this.#lastRestString.length < 8) {
        this.#lastRestString += "0";
      }
      this.push(Buffer.from([Number.parseInt(this.#lastRestString, 2)]));
      cb();
    } catch (err) {
      cb(err);
    }
  }
}

/**
 * 对输入buffer根据map重新编码得到新的buffer
 * @param {Buffer} source
 * @param {Map<any,string>} map
 * @param {string} restString
 * @returns {[string,Buffer]}
 */
function recodeBuffer(source, map, restString) {
  const result = [];
  source.forEach((item) => {
    const value = map.get(item);
    if (typeof value !== "string") {
      throw new Error("can not found char in map");
    } else {
      restString += value;
      while (restString.length >= 8) {
        result.push(Number.parseInt(restString.slice(0, 9), 2));
        restString = restString.slice(9);
      }
    }
  });
  return [restString, Buffer.from(result)];
}

function getReadStream1(
  sourceFilePath,
  huffmanCoder,
  progressBar,
  resolve,
  reject
) {
  const readStream = fs
    .createReadStream(sourceFilePath, { flags: "r" })
    .on("data", (chunk) => {
      try {
        huffmanCoder.process(chunk);
        progressBar.tick(chunk.length);
      } catch (error) {
        readStream.destroy(error);
      }
    })
    .on("end", () => {
      try {
        resolve(huffmanCoder.generateEncodeTable());
      } catch (err) {
        reject(err);
      }
    })
    .on("error", (err) => {
      if (err) {
        reject(error);
      }
    });

  return readStream;
}

function getReadStream2(sourceFilePath, reject) {
  const [_, progressBar] = generateProgressBar(sourceFilePath, "transform");
  return fs
    .createReadStream(sourceFilePath, {
      flags: "r",
    })
    .on("data", (chunk) => {
      progressBar.tick(chunk.length);
    })
    .on("error", (err) => {
      if (err) {
        reject(err);
      }
    });
}

function getTransformStream2(encodingTable, reject) {
  return new CustomTransform(undefined, encodingTable).on("error", (err) => {
    if (err) {
      reject(err);
    }
  });
}

function getWriteStream2(chunkFilePath, reject, resolve) {
  return fs
    .createWriteStream(chunkFilePath, {
      flags: "w",
    })
    .on("error", (err) => {
      if (err) {
        reject(err);
      }
    })
    .on("finish", () => {
      resolve();
    });
}

function writeEncodeInformation(targetFilePath, encodingTable) {
  fs.writeFileSync(targetFilePath, parseMapToJSON(encodingTable) + "*", {
    flag: "wx",
  });
}

/**
 *
 * @param {string} array
 */
function encoder(sourceFilePath) {
  if (typeof sourceFilePath !== "string") {
    throw new Error("file path need to be string");
  }
  const targetDirPath = path.dirname(sourceFilePath);
  let targetFilePath;
  //第一遍读取源文件生成编码表
  new Promise((resolve, reject) => {
    //检查读写权限
    checkPathValid(sourceFilePath, targetDirPath);
    //获取源文件数据信息以及生成进度条
    const [_, progressBar] = generateProgressBar(
      sourceFilePath,
      "generate encoding table"
    );
    //生成哈夫曼树来得到编码表
    const huffmanCoder = new HuffmanCoder();
    getReadStream1(sourceFilePath, huffmanCoder, progressBar, resolve, reject);
  })
    //第二遍读取写入编码表然后写入编码目标文件
    .then((encodingTable) => {
      return new Promise((resolve, reject) => {
        targetFilePath = getNonRepeateFilePath(
          sourceFilePath.slice(0, sourceFilePath.indexOf(".")) + ".las"
        );
        writeEncodeInformation(targetFilePath, encodingTable);
        const readStream = getReadStream2(sourceFilePath, reject);
        const transformStream = getTransformStream2(encodingTable, reject);
        const writeStream = getWriteStream2(targetFilePath, reject, resolve);

        readStream.pipe(transformStream).pipe(writeStream);
      });
    })
    //成功完成
    .then(() => {
      //do somthing
      console.log("finish");
    })
    .catch((err) => {
      console.log("promise reject" + err);
      fs.rm(targetFilePath, () => {});
    });
}

function decoder() {}

module.exports = {
  encoder,
  decoder,
};
