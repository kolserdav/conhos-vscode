/******************************************************************************************
 * Repository: Conhos vscode
 * File name: index.js
 * Author: Sergey Kolmiller
 * Email: <kolserdav@conhos.ru>
 * License: MIT
 * License text: See LICENSE file
 * Copyright: kolserdav, All rights reserved (c)
 * Create Date: Fri Sep 20 2024 13:22:00 GMT+0700 (Krasnoyarsk Standard Time)
 ******************************************************************************************/
// @ts-check
const extension = require('./dist/extension.js');

/**
 * @param {import('vscode').ExtensionContext} ctx
 */
async function activate(ctx) {
  return await extension.activate(ctx);
}

/**
 * @param {import('vscode').ExtensionContext} ctx
 */
async function deactivate(ctx) {
  return await extension.activate(ctx);
}

exports.activate = activate;
exports.deactivate = deactivate;
