// @ts-check
const path = require('path');

/**
 * @param {{WEBPACK_BUILD?: boolean}} param0
 * @param {import('webpack').Configuration} argv
 * @returns {import('webpack').Configuration}
 */
const config = ({ WEBPACK_BUILD }, argv) => {
  return {
    mode: WEBPACK_BUILD ? 'production' : 'development',
    target: 'node',
    context: __dirname,
    entry: {
      extension: './src/extension.ts',
      server: './src/server.ts',
      lib: './src/lib.ts',
      constants: './src/constants.ts',
      scripts: './src/scripts.ts',
    },
    devtool: WEBPACK_BUILD ? false : 'source-map',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: '[name].js',
      library: 'Conhos',
      libraryTarget: 'umd',
    },
    externals: {
      vscode: 'umd vscode',
    },
    resolve: {
      extensions: ['.ts', '.js'],
      alias: {
        vscode: path.resolve(__dirname, 'node_modules/vscode'),
      },
    },
    module: {
      rules: [
        {
          test: /\.ts$/,
          exclude: /node_modules/,
          use: [
            {
              loader: 'ts-loader',
            },
          ],
        },
      ],
    },
  };
};

module.exports = config;
