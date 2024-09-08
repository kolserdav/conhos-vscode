// @ts-check
const path = require("path");

const debugWebpack = !!process.env.DEBUG_WEBPACK;

/** @type {import('webpack').Configuration} */
const config = {
  target: "node",
  context: __dirname,
  entry: "./src/extension.ts",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "extension.js",
    libraryTarget: "commonjs2",
  },
  devtool: "nosources-source-map",
  externals: {
    vscode: "commonjs vscode",
  },
  resolve: {
    extensions: [".ts", ".js"],
    alias: {
      vscode: path.resolve(__dirname, "node_modules/vscode"),
    },
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: [
          {
            loader: "ts-loader",
          },
        ],
      },
    ],
  },
};

module.exports = config;
