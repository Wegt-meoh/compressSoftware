const { encoder } = require("../src/core");

const filePathMap = {
  smallFilePath: "../test.txt",
  middleFilePath: "/Users/quepengbiao/Downloads/Download/test.mp4",
  largeFilePath: "/Users/quepengbiao/Downloads/Download/largeFile.mp4",
};

const filePath = filePathMap.largeFilePath;

encoder(filePath);
