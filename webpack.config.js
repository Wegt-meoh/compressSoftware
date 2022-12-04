const { FileListPlugin } = require("./customWebpackPlugin");
const path = require("node:path");
const NodePolyfillPlugin = require("node-polyfill-webpack-plugin");

module.exports = {
  mode: "development",
  context: path.resolve(__dirname, "src"),
  entry: "./index.js",
  plugins: [new FileListPlugin(), new NodePolyfillPlugin()],
};
