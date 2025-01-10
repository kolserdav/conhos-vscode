/******************************************************************************************
 * Repository: Conhos vscode
 * File name: extension.ts
 * Author: Sergey Kolmiller
 * Email: <kolserdav@conhos.ru>
 * License: MIT
 * License text: See LICENSE file
 * Copyright: kolserdav, All rights reserved (c)
 * Create Date: Tue Sep 10 2024 16:42:55 GMT+0700 (Krasnoyarsk Standard Time)
 ******************************************************************************************/
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
  const serverModule = context.asAbsolutePath(path.join('dist', 'server'));
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
    documentSelector: [
      { scheme: 'file', language: 'yaml', pattern: '**/conhos.yaml' },
      { scheme: 'file', language: 'yaml', pattern: '**/conhos.yml' },
      { scheme: 'file', language: 'yaml', pattern: '**/*.conhos.yaml' },
      { scheme: 'file', language: 'yaml', pattern: '**/*.conhos.yml' },
    ],
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

  client.onNotification('custom/triggerCompletion', (params) => {
    const editor = vscode.window.activeTextEditor;
    if (editor) {
      const position = editor.selection.active;
      client.sendNotification('custom/triggerCompletion', {
        uri: editor.document.uri,
        position,
      });
      vscode.commands.executeCommand('editor.action.triggerSuggest').then((e) => {
        console.info('Suggestion triggered successfully', e);
      });
    } else {
      console.error('No active text editor found.', params);
    }
  });

  client.onNotification('custom/hideSuggestWidget', (params) => {
    vscode.commands.executeCommand('hideSuggestWidget').then((e) => {
      console.info('Suggestion widget closed successfully', e);
    });
  });

  client.onNotification('custom/cursorPosition', (params) => {
    const editor = vscode.window.activeTextEditor;
    if (editor) {
      const position = editor.selection.active;
      client.sendNotification('custom/cursorPosition', {
        uri: editor.document.uri,
        position,
      });
    } else {
      console.error('No active text editor found.', params);
    }
  });
}

export function deactivate(): Thenable<void> | undefined {
  if (!client) {
    return undefined;
  }
  return client.stop();
}
