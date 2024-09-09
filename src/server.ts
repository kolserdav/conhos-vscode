import {
  createConnection,
  TextDocuments,
  ProposedFeatures,
  DiagnosticSeverity,
  Diagnostic,
  TextDocumentSyncKind,
  InitializeResult,
  InitializeParams,
  DidChangeConfigurationNotification,
} from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { parse } from './utils/yaml';
import { checkConfig } from './interfaces';
import log from './utils/log';
import { getMedialplan } from './utils/request';

const connection = createConnection(ProposedFeatures.all);
const documents = new TextDocuments(TextDocument);

let hasConfigurationCapability: boolean = false;
let hasWorkspaceFolderCapability: boolean = false;
let hasDiagnosticRelatedInformationCapability: boolean = false;

connection.onInitialize((params: InitializeParams) => {
  let capabilities = params.capabilities;

  // Does the client support the `workspace/configuration` request?
  // If not, we fall back using global settings.
  hasConfigurationCapability = !!(capabilities.workspace && !!capabilities.workspace.configuration);
  hasWorkspaceFolderCapability = !!(
    capabilities.workspace && !!capabilities.workspace.workspaceFolders
  );
  hasDiagnosticRelatedInformationCapability = !!(
    capabilities.textDocument &&
    capabilities.textDocument.publishDiagnostics &&
    capabilities.textDocument.publishDiagnostics.relatedInformation
  );

  const result: InitializeResult = {
    capabilities: {
      textDocumentSync: TextDocumentSyncKind.Incremental,
      // Tell the client that this server supports code completion.
      completionProvider: {
        resolveProvider: true,
      },
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

connection.onInitialized(() => {
  if (hasConfigurationCapability) {
    // Register for all configuration changes.
    connection.client.register(DidChangeConfigurationNotification.type, undefined);
  }
  if (hasWorkspaceFolderCapability) {
    connection.workspace.onDidChangeWorkspaceFolders((_event) => {
      connection.console.log('Workspace folder change event received.');
    });
  }
});

interface ExampleSettings {
  maxNumberOfProblems: number;
}

const defaultSettings: ExampleSettings = { maxNumberOfProblems: 1000 };
let globalSettings: ExampleSettings = defaultSettings;

// Cache the settings of all open documents
let documentSettings: Map<string, Thenable<ExampleSettings>> = new Map();

// Only keep settings for open documents
documents.onDidClose((e) => {
  documentSettings.delete(e.document.uri);
});

connection.onDidChangeWatchedFiles((_change) => {
  // Monitored files have change in VS Code
  connection.console.log('We received a file change event');
});

const validFields = ['field1', 'field2', 'field3'];
documents.onDidChangeContent(async (change) => {
  const diagnostics: Diagnostic[] = [];
  const document = documents.get(change.document.uri);
  if (!document) {
    log('warn', 'Document is missing', document);
    return;
  }
  const text = document.getText();
  const { data, error } = parse(text);

  if (error || !data) {
    diagnostics.push({
      severity: DiagnosticSeverity.Error,
      range: {
        start: { line: 0, character: 0 },
        end: { line: 0, character: 0 },
      },
      message: `Failed to parsing YAML: ${error?.message}`,
      source: 'my-lsp',
    });
    return;
  }

  const deployData = await getMedialplan();
  if (!deployData) {
    log('warn', 'Mediaplan is missing');
    return;
  }

  const checkResult = await checkConfig(data, { deployData, isServer: true });

  for (let i = 0; checkResult[i]; i++) {
    const { exit, msg, data } = checkResult[i];
    diagnostics.push({
      severity: exit ? DiagnosticSeverity.Error : DiagnosticSeverity.Warning,
      range: {
        start: { line: 1, character: 1 },
        end: { line: 1, character: 1 },
      },
      message: `${msg}${data}`,
      source: 'my-lsp',
    });
  }

  connection.sendDiagnostics({ uri: change.document.uri, diagnostics });
});

documents.onDidOpen((event) => {
  console.log('Document opened:', event.document.uri);
});

documents.listen(connection);

connection.listen();
