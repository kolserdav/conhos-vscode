/******************************************************************************************
 * Repository: Conhos vscode
 * File name: server.ts
 * Author: Sergey Kolmiller
 * Email: <kolserdav@conhos.ru>
 * License: MIT
 * License text: See LICENSE file
 * Copyright: kolserdav, All rights reserved (c)
 * Create Date: Tue Sep 10 2024 16:42:55 GMT+0700 (Krasnoyarsk Standard Time)
 ******************************************************************************************/
import {
  createConnection,
  TextDocuments,
  ProposedFeatures,
  DiagnosticSeverity,
  Diagnostic,
  TextDocumentSyncKind,
  InitializeResult,
  TextDocumentPositionParams,
  CompletionItem,
} from 'vscode-languageserver/node';
import { Position, TextDocument } from 'vscode-languageserver-textdocument';
import { parse } from './utils/yaml';
import log from './utils/log';
import { getMedialplan } from './utils/request';
import { SOURCE } from './constants';
import {
  checkConfig,
  CONFIG_DEFAULT,
  createCompletionItems,
  getCurrentLevel,
  getParentProperty,
  getWordRangeAtPosition,
} from './lib';

import { DeployData } from '..';

const source = SOURCE;

const connection = createConnection(ProposedFeatures.all);
const documents = new TextDocuments(TextDocument);

let deployData: DeployData | null = null;

const completionItems = createCompletionItems(CONFIG_DEFAULT as any);

connection.onInitialize(() => {
  const result: InitializeResult = {
    capabilities: {
      textDocumentSync: TextDocumentSyncKind.Incremental,
      completionProvider: {
        resolveProvider: true,
        triggerCharacters: [':'],
      },
      hoverProvider: true,
    },
  };

  return result;
});

let cursorPosition: Position = { line: 0, character: 0 };

connection.onCompletion((textDocumentPosition: TextDocumentPositionParams): CompletionItem[] => {
  const document = documents.get(textDocumentPosition.textDocument.uri);
  if (!document) {
    console.warn('Document is missig', textDocumentPosition.textDocument.uri);
    return [];
  }

  const line = cursorPosition.line;

  const lineText = document.getText({
    start: { line: line, character: 0 },
    end: cursorPosition,
  });

  const currentLevel = getCurrentLevel(lineText);
  const parentEl = getParentProperty({
    text: document.getText(),
    currentLevel,
    currentLineIndex: cursorPosition.line,
  });

  const filteredItems = completionItems.filter((item) => {
    const matchesLevel = item.data.level === currentLevel;
    let matchesParent = parentEl ? parentEl.key === item.data.parent : true;
    matchesParent = currentLevel === 2 || matchesParent;

    return matchesLevel && matchesParent;
  });

  return filteredItems;
});

connection.onCompletionResolve((item: CompletionItem): CompletionItem => {
  return item;
});

connection.onHover((params) => {
  const { textDocument, position } = params;
  const document = documents.get(textDocument.uri);
  if (!document) {
    console.warn('Document is missing in hover callback');
    return;
  }
  const wordRange = getWordRangeAtPosition(document.getText(), position);
  if (!wordRange) {
    console.warn('Word range is missing', position);
    return;
  }
  const word = document.getText(wordRange);

  const info = completionItems.find((item) => item.label === word);

  if (!info || !info?.detail) {
    return null;
  }

  const hoverMessage = `**${word}** - ${info.detail} [${typeof info.data.type}]  \n___  \n${info.documentation}`;

  return {
    contents: {
      kind: 'markdown',
      value: hoverMessage,
    },
  };
});

connection.onNotification('custom/cursorPosition', (params) => {
  const { uri, position } = params;
  cursorPosition = position;
  const document = documents.get(uri.external);
  if (document) {
    const line = position.line;

    const lineText = document.getText({
      start: { line: line, character: 0 },
      end: position,
    });

    const currentLevel = getCurrentLevel(lineText);
    const parentEl = getParentProperty({
      text: document.getText(),
      currentLevel,
      currentLineIndex: cursorPosition.line,
    });
    const lineTextClear = lineText.trim();

    const completionItem = completionItems.find((item) => {
      let matchesParent = parentEl ? parentEl.key === item.data.parent : true;
      matchesParent = currentLevel === 2 || matchesParent;
      return (
        new RegExp(`^${lineTextClear}`).test(item.label) &&
        lineTextClear !== item.label &&
        item.data.level === currentLevel &&
        matchesParent
      );
    });
    if (lineTextClear && completionItem) {
      connection.sendNotification('custom/triggerCompletion', { uri: document.uri });
    } else {
      connection.sendNotification('custom/hideSuggestWidget');
    }
  } else {
    console.error('Document not found', uri.external);
  }
});

// Only keep settings for open documents
documents.onDidClose((e) => {
  log('warn', 'Server was closed', e);
});

connection.onDidChangeWatchedFiles((_change) => {
  // Monitored files have change in VS Code
  connection.console.log('We received a file change event');
});

documents.onDidChangeContent(async (change) => {
  const diagnostics: Diagnostic[] = [];
  const document = documents.get(change.document.uri);

  if (!isConhosFile(change.document.uri)) {
    return;
  }

  if (!document) {
    log('warn', 'Document is missing', document);
    return;
  }

  setTimeout(() => {
    connection.sendNotification('custom/cursorPosition', { uri: change.document.uri });
  }, 100);

  const configText = document.getText();
  const { data: config, error } = parse(configText);

  if (error || !config) {
    diagnostics.push({
      severity: DiagnosticSeverity.Error,
      range: {
        start: { line: 0, character: 1 },
        end: { line: 0, character: 1 },
      },
      message: `Failed to parsing YAML: ${error?.message}`,
      source,
    });
    connection.sendDiagnostics({ uri: change.document.uri, diagnostics });
    return;
  }

  if (!deployData) {
    deployData = await getMedialplan();
    if (!deployData) {
      diagnostics.push({
        severity: DiagnosticSeverity.Error,
        range: {
          start: { line: 0, character: 0 },
          end: { line: 0, character: 5 },
        },
        message: 'Failed to conect to server. Check network connection and try again.',
        source,
      });
      connection.sendDiagnostics({ uri: change.document.uri, diagnostics });
      return;
    }
  }

  const checkResult = await checkConfig({ config, configText }, { deployData });

  for (let i = 0; checkResult[i]; i++) {
    const {
      exit,
      msg,
      data,
      position: { lineEnd, lineStart, columnEnd, columnStart },
    } = checkResult[i];
    diagnostics.push({
      severity: exit ? DiagnosticSeverity.Error : DiagnosticSeverity.Warning,
      range: {
        start: { line: lineStart, character: columnStart },
        end: { line: lineEnd, character: columnEnd },
      },
      message: `${msg} ${data ? `(${data})` : ''}`,
      source,
    });
  }

  connection.sendDiagnostics({ uri: change.document.uri, diagnostics });
});

documents.onDidOpen(async (event) => {
  if (isConhosFile(event.document.uri) && !deployData) {
    deployData = await getMedialplan();
  }
  console.log('Document opened:', event.document.uri);
});

documents.listen(connection);

connection.listen();

function isConhosFile(uri: string) {
  return /\.?conhos\.ya?ml$/.test(uri);
}
