import {
  createConnection,
  TextDocuments,
  ProposedFeatures,
  DiagnosticSeverity,
  Diagnostic,
  TextDocumentSyncKind,
  InitializeResult,
  InitializeParams,
} from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { parse } from './utils/yaml';
import log from './utils/log';
import { getMedialplan } from './utils/request';
import { SOURCE } from './constants';
import { checkConfig } from './lib';

const source = SOURCE;

const connection = createConnection(ProposedFeatures.all);
const documents = new TextDocuments(TextDocument);

let hasConfigurationCapability: boolean = false;
let hasWorkspaceFolderCapability: boolean = false;
interface ExampleSettings {
  maxNumberOfProblems: number;
}

const defaultSettings: ExampleSettings = { maxNumberOfProblems: 1000 };

// Cache the settings of all open documents
let documentSettings: Map<string, Thenable<ExampleSettings>> = new Map();

connection.onInitialize((params: InitializeParams) => {
  let capabilities = params.capabilities;

  hasConfigurationCapability = !!(capabilities.workspace && !!capabilities.workspace.configuration);
  hasWorkspaceFolderCapability = !!(
    capabilities.workspace && !!capabilities.workspace.workspaceFolders
  );

  const result: InitializeResult = {
    capabilities: {
      textDocumentSync: TextDocumentSyncKind.Incremental,
      callHierarchyProvider: false,
    },
  };
  if (hasWorkspaceFolderCapability) {
    result.capabilities.workspace = {
      workspaceFolders: {
        supported: true,
      },
    };
  }

  return result;
});

// Only keep settings for open documents
documents.onDidClose((e) => {
  log('error', 'Server was closed', e);
  documentSettings.delete(e.document.uri);
});

connection.onDidChangeWatchedFiles((_change) => {
  // Monitored files have change in VS Code
  connection.console.log('We received a file change event');
});

documents.onDidChangeContent(async (change) => {
  const diagnostics: Diagnostic[] = [];
  const document = documents.get(change.document.uri);

  if (!document) {
    log('warn', 'Document is missing', document);
    return;
  }
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

  const deployData = await getMedialplan();
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

  const checkResult = await checkConfig({ config, configText }, { deployData, isServer: true });

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
      message: `${msg} (${data})`,
      source,
    });
  }

  connection.sendDiagnostics({ uri: change.document.uri, diagnostics });
});

documents.onDidOpen((event) => {
  console.log('Document opened:', event.document.uri);
});

documents.listen(connection);

connection.listen();
