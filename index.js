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
