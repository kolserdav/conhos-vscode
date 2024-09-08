// @ts-check

// eslint-disable-next-line @typescript-eslint/no-var-requires
const extension = require("./dist/extension.js");

async function activate(ctx) {
  return await extension.activate(ctx);
}

async function deactivate(ctx) {
  return await extension.activate(ctx);
}

exports.activate = activate;
exports.deactivate = deactivate;
