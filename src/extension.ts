'use strict';
import * as vscode from 'vscode';
export function activate(context: vscode.ExtensionContext) {
	console.log('Congratulations, your extension "hello" is now active!');
	let disposable = vscode.commands.registerCommand('extension.helloWorld', () => {
		vscode.window.showInformationMessage('Hello Erlang!');
	});
	let diss = vscode.commands.registerTextEditorCommand('extension.findFilee', (textEditor: vscode.TextEditor, edit: vscode.TextEditorEdit, args: any[]) => {
		let textLine = textEditor.document.lineAt(textEditor.selection.start);
		let str = textEditor.document.getText(textEditor.selection);
		let activeEditor = textEditor;
		const regEx = /([,])(.?)(['])(.+)([a-zA-Z]{1,})([@])([a-zA-Z]{1,})(['])/g;
		const text = textLine.text;
		const smallNumbers: vscode.DecorationOptions[] = [];
		const largeNumbers: vscode.DecorationOptions[] = [];
		let match;
		while (match = regEx.exec(text)) {
			const startPos = activeEditor.document.positionAt(match.index);
			const endPos = activeEditor.document.positionAt(match.index + match[0].length);
			const decoration = { range: new vscode.Range(startPos, endPos), hoverMessage: 'Number **' + match[0] + '**' };
			let strResultMatch = match[0];
			vscode.window.showInformationMessage(strResultMatch);
			parsePhpClassAndMethod(strResultMatch);
		}
	});
	function parsePhpClassAndMethod(str: string) {
	}
	console.log('decorator sample is activated');
	let timeout: NodeJS.Timer | undefined = undefined;
	const smallNumberDecorationType = vscode.window.createTextEditorDecorationType({
		borderWidth: '1px',
		borderStyle: 'solid',
		overviewRulerColor: 'blue',
		overviewRulerLane: vscode.OverviewRulerLane.Right,
		light: {
			borderColor: 'darkblue',
			borderRadius: '2px'
		},
		dark: {
			borderColor: 'lightblue',
			borderRadius: '2px'
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
		const regEx = /([,])(.?)(['])(.+)([a-zA-Z]{1,})([@])([a-zA-Z]{1,})(['])/g;
		const text = activeEditor.document.getText();
		const smallNumbers: vscode.DecorationOptions[] = [];
		const largeNumbers: vscode.DecorationOptions[] = [];
		let match;
		while (match = regEx.exec(text)) {
			const startPos = activeEditor.document.positionAt(match.index);
			const endPos = activeEditor.document.positionAt(match.index + match[0].length);
			const decoration = { range: new vscode.Range(startPos, endPos), hoverMessage: 'Number **' + match[0] + '**' };
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
export function deactivate() { }
