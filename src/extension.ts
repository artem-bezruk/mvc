'use strict';
import * as vscode from 'vscode';
export function activate(context: vscode.ExtensionContext) {
	console.log('Congratulations, your extension "LaravelRouteClassOpener" is now active!');
	let disposable = vscode.commands.registerCommand('enableLaravelRouteClassOpener', () => {
		vscode.window.showInformationMessage('Laravel Route Class Opener enabled!');
	});
	const regEx: RegExp = /'([a-zA-Z\\]+)\w+Controller(@\w+)?'/g;
	let diss = vscode.commands.registerTextEditorCommand('extension.openPhpClassFile', (textEditor: vscode.TextEditor, edit: vscode.TextEditorEdit, args: any[]) => {
		let textLine: vscode.TextLine = textEditor.document.lineAt(textEditor.selection.start);
		let str: string = textEditor.document.getText(textEditor.selection);
		let activeEditor: vscode.TextEditor = textEditor;
		const text: string = textLine.text;
		const smallNumbers: vscode.DecorationOptions[] = [];
		const largeNumbers: vscode.DecorationOptions[] = [];
		let match;
		while (match = regEx.exec(text)) {
			const startPos: vscode.Position = activeEditor.document.positionAt(match.index);
			const endPos: vscode.Position = activeEditor.document.positionAt(match.index + match[0].length);
			const decoration = { range: new vscode.Range(startPos, endPos), hoverMessage: 'File **' + match[0] + '**' };
			let strResultMatch: string = match[0];
			parsePhpClassAndMethod(strResultMatch);
		}
	});
	function parsePhpClassAndMethod(str: string) {
		let strFiltered: string = str.replace(/[,]/g, '');
		strFiltered = strFiltered.trim();
		strFiltered = strFiltered.replace(/[\']/g, '');
		strFiltered = strFiltered.replace(/["]/g, '');
		let strPhpNamespace: string = '';
		let strPhpMethodName: string = '';
		if (strFiltered.indexOf('@') == -1) {
			strPhpNamespace = strFiltered;
		} else {
			let arrStr: string[] = strFiltered.split('@');
			strPhpNamespace = arrStr[0];
			strPhpMethodName = arrStr[1];
		}
		let arrStrPhpNamespace: string[] = strPhpNamespace.split('\\');
		let strFilenamePrefix: string = arrStrPhpNamespace[arrStrPhpNamespace.length - 1];
		let files: Thenable<vscode.Uri[]> = vscode.workspace.findFiles('**/' + strFilenamePrefix + '.php');
		files.then((uris: vscode.Uri[]) => {
			uris.forEach((uri, i: number, uriss) => {
				let filePath: string = uri.toString();
				vscode.workspace.openTextDocument(uri).then((textDocument: vscode.TextDocument) => {
					let docText: string = textDocument.getText();
					if (docText.indexOf('<?php') == 0) {
					} else {
						return;
					}
					let strNamespacePrefix: string = '';
					let namespacePosition: number = docText.indexOf('namespace App\\Http\\Controllers' + strNamespacePrefix);
					if (namespacePosition == -1) {
						return;
					}
					let classNamePosition: number = docText.indexOf('class ' + strFilenamePrefix + ' ');
					if (classNamePosition == -1) {
						return;
					}
					let posStart: vscode.Position = textDocument.positionAt(classNamePosition + 'class '.length);
					let posEnd: vscode.Position = textDocument.positionAt('class '.length + classNamePosition + strPhpMethodName.length);
					if (strPhpMethodName.length > 0) {
						let methodPosition: number = docText.indexOf(' function ' + strPhpMethodName + '(');
						if (methodPosition == -1) {
							return;
						} else {
							posStart = textDocument.positionAt(methodPosition + ' function '.length);
							posEnd = textDocument.positionAt(' function '.length + methodPosition + strPhpMethodName.length);
						}
					}
					vscode.window.showInformationMessage(strPhpNamespace);
					let selectionRange: vscode.Range = new vscode.Range(
						posStart,
						posEnd
					);
					let options: vscode.TextDocumentShowOptions = {
						viewColumn: undefined,
						preserveFocus: false,
						preview: true,
						selection: selectionRange,
					};
					vscode.window.showTextDocument(textDocument.uri, options);
				});
			});
		})
	}
	console.log('Decorator sample is activated');
	let timeout: NodeJS.Timer | undefined = undefined;
	const smallNumberDecorationType = vscode.window.createTextEditorDecorationType({
		borderWidth: '1px',
		borderStyle: 'solid',
		overviewRulerLane: vscode.OverviewRulerLane.Right,
		light: {
			borderColor: 'darkblue',
			borderRadius: '8px'
		},
		dark: {
			borderColor: 'rgba(255, 255, 255, 0.5)',
			borderRadius: '8px'
		}
	});
	const largeNumberDecorationType = vscode.window.createTextEditorDecorationType({
		cursor: 'crosshair',
		backgroundColor: { id: 'myextension.largeNumberBackground' }
	});
	let activeEditor = vscode.window.activeTextEditor;
	function updateDecorations() {
		if (!activeEditor) {
			return;
		}
		const text: string = activeEditor.document.getText();
		const smallNumbers: vscode.DecorationOptions[] = [];
		const largeNumbers: vscode.DecorationOptions[] = [];
		let match;
		while (match = regEx.exec(text)) {
			const startPos: vscode.Position = activeEditor.document.positionAt(match.index);
			const endPos: vscode.Position = activeEditor.document.positionAt(match.index + match[0].length);
			const decoration = { range: new vscode.Range(startPos, endPos), hoverMessage: 'File **' + match[0] + '**' };
			smallNumbers.push(decoration);
		}
		activeEditor.setDecorations(smallNumberDecorationType, smallNumbers);
		activeEditor.setDecorations(largeNumberDecorationType, largeNumbers);
	}
	function triggerUpdateDecorations() {
		if (timeout) {
			clearTimeout(timeout);
			timeout = undefined;
		}
		timeout = setTimeout(updateDecorations, 500);
	}
	if (activeEditor) {
		triggerUpdateDecorations();
	}
	vscode.window.onDidChangeActiveTextEditor(editor => {
		activeEditor = editor;
		if (editor) {
			triggerUpdateDecorations();
		}
	}, null, context.subscriptions);
	vscode.workspace.onDidChangeTextDocument(event => {
		if (activeEditor && event.document === activeEditor.document) {
			triggerUpdateDecorations();
		}
	}, null, context.subscriptions);
	context.subscriptions.push(diss);
	context.subscriptions.push(disposable);
}
export function deactivate() {
}
