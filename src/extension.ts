import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    let disposable = vscode.commands.registerCommand('extension.checkTemplate', () => {
        const editor = vscode.window.activeTextEditor;
        console.log(353)
        if (editor) {
            const document = editor.document;
            if (document.languageId !== 'yaml') {
                return;
            }

            const fileName = document.fileName;
            if (!fileName.endsWith('conhos.yml')) {
                return;
            }

            const text = document.getText();
            console.log(22, vscode.workspace.getConfiguration('yamlTemplateChecker'))
            const requiredFields = vscode.workspace.getConfiguration('yamlTemplateChecker').requiredFields;
            const missingFields = checkForMissingFields(text, requiredFields);

            if (missingFields.length > 0) {
                vscode.window.showErrorMessage(`Missing fields: ${missingFields.join(', ')}`);
            } else {
                vscode.window.showInformationMessage('All fields are present.');
            }
        }
    });

    const disposable1 = vscode.workspace.onDidChangeTextDocument(event => {
        // Получаем измененный документ
        const document = event.document;
        console.log(434);
        // Проверяем, что документ имеет нужный язык (например, YAML)
        if (document.languageId === 'yaml') {
            // Здесь вы можете добавить свою логику обработки изменений
            console.log(`Document changed: ${document.fileName}`);
            // Например, вы можете проверить содержимое документа
            const text = document.getText();
            // Ваша логика проверки или обработки текста
        }
    });

    context.subscriptions.push(disposable);

    context.subscriptions.push(disposable1);
}

function checkForMissingFields(text: string, requiredFields: string[]): string[] {
    const missingFields = requiredFields.filter(field => !text.includes(field));
    return missingFields;
}

export function deactivate() {}