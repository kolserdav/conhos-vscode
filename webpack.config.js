/******************************************************************************************
 * Repository: Conhos vscode
 * File name: webpack.config.js
 * Author: Sergey Kolmiller
 * Email: <kolserdav@conhos.ru>
 * License: MIT
 * License text: See LICENSE file
 * Copyright: kolserdav, All rights reserved (c)
 * Create Date: Fri Sep 20 2024 13:22:00 GMT+0700 (Krasnoyarsk Standard Time)
 ******************************************************************************************/
// @ts-check
const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');

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
      server: './src/server/server.ts',
      lib: './src/lib.ts',
      constants: './src/constants.ts',
      scripts: './src/scripts.ts',
    },
    devtool: WEBPACK_BUILD ? false : 'source-map',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: '[name].js',
      libraryTarget: 'umd',
    },
    externals: {
      vscode: 'umd vscode',
    },
    resolve: {
      extensions: ['.ts', '.js'],
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
    optimization: {
      minimize: WEBPACK_BUILD,
      minimizer: [
        new TerserPlugin({
          terserOptions: {
            ecma: 2020,
            output: {
              comments: false,
            },
            mangle: false,
          },
          extractComments: false,
        }),
      ],
    },
  };
};

module.exports = config;
