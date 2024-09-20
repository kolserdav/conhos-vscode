/******************************************************************************************
 * Repository: Conhos vscode
 * File name: webpack.config.web.js
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
const webpack = require('webpack');

/**
 * @param {{WEBPACK_BUILD?: boolean}} param0
 * @param {import('webpack').Configuration} argv
 * @returns {import('webpack').Configuration}
 */
const config = ({ WEBPACK_BUILD }, argv) => {
  return {
    mode: WEBPACK_BUILD ? 'production' : 'development',
    target: 'webworker',
    context: __dirname,
    entry: {
      lib: './src/lib.ts',
    },
    devtool: WEBPACK_BUILD ? false : 'source-map',
    output: {
      path: path.resolve(__dirname, 'dist-web'),
      filename: '[name].js',
      libraryTarget: 'umd',
    },
    resolve: {
      extensions: ['.ts', '.js'],
    },
    module: {
      rules: [
        {
          test: /\.ts$/,
          exclude: /node_modules/,
          use: {
            loader: 'ts-loader',
            options: {
              configFile: path.resolve(__dirname, 'tsconfig.web.json'),
            },
          },
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
    plugins: [
      new webpack.DefinePlugin({
        'process.env': JSON.stringify({}),
      }),
    ],
  };
};

module.exports = config;
