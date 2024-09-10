import path from 'path';
import * as vscode from 'vscode';
import {
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
  State,
  TransportKind,
} from 'vscode-languageclient/node';
import log from './utils/log';

let client: LanguageClient;

export async function activate(context: vscode.ExtensionContext) {
  const serverModule = context.asAbsolutePath(path.join('dist', 'server.js'));
  let debugOptions = { execArgv: ['--nolazy', '--inspect=6009'] };
  let serverOptions: ServerOptions = {
    run: { module: serverModule, transport: TransportKind.ipc },
    debug: {
      module: serverModule,
      transport: TransportKind.ipc,
      options: debugOptions,
    },
  };

  const clientOptions: LanguageClientOptions = {
    documentSelector: [{ scheme: 'file', language: 'yaml' }],
    synchronize: {
      fileEvents: vscode.workspace.createFileSystemWatcher('*conhos.y(a)ml'),
    },
  };

  client = new LanguageClient(
    'conhosLanguageServer',
    'Conhos Language Server',
    serverOptions,
    clientOptions
  );
  client.start();

  client.onDidChangeState((event) => {
    switch (event.newState) {
      case State.Starting:
        log('info', 'Client is starting...', event);
        break;
      case State.Running:
        log('info', 'Client is ready', event);
        break;
      case State.Stopped:
        log('error', 'Client is stopped', event);
        break;
      default:
        log('warn', 'Default newState', event);
    }
  });
}

export function deactivate(): Thenable<void> | undefined {
  if (!client) {
    return undefined;
  }
  return client.stop();
}
