'use strict';
import * as vscode from 'vscode';
export function activate(context: vscode.ExtensionContext) {
	console.log('Congratulations, your extension "LaravelRouteClassOpener" is now active!');
	let disposable = vscode.commands.registerCommand('enableLaravelRouteClassOpener', () => {
		vscode.window.showInformationMessage('Laravel Route Class Opener enabled!');
	});
	let diss = vscode.commands.registerTextEditorCommand('extension.openPhpClassFile', (textEditor: vscode.TextEditor, edit: vscode.TextEditorEdit, args: any[]) => {
		let textLine = textEditor.document.lineAt(textEditor.selection.start);
		let str = textEditor.document.getText(textEditor.selection);
		let activeEditor = textEditor;
		const regEx = /'([a-zA-Z\\]+)\w+@\w+'/g;
		const text = textLine.text;
		const smallNumbers: vscode.DecorationOptions[] = [];
		const largeNumbers: vscode.DecorationOptions[] = [];
		let match;
		while (match = regEx.exec(text)) {
			const startPos = activeEditor.document.positionAt(match.index);
			const endPos = activeEditor.document.positionAt(match.index + match[0].length);
			const decoration = { range: new vscode.Range(startPos, endPos), hoverMessage: 'Number **' + match[0] + '**' };
			let strResultMatch = match[0];
			parsePhpClassAndMethod(strResultMatch);
		}
	});
	function parsePhpClassAndMethod(str: string) {
		let strFiltered = str.replace(',', '');
		strFiltered = strFiltered.trim();
		strFiltered = strFiltered.replace(/[\']/g, '');
		strFiltered = strFiltered.replace(/["]/g, '');
		let arrStr = strFiltered.split('@');
		let strPhpNamespace = arrStr[0];
		let strPhpMethodName = arrStr[1];
		let arrStrPhpNamespace = strPhpNamespace.split('\\');
		let strFilenamePrefix = arrStrPhpNamespace[arrStrPhpNamespace.length - 1];
		let files = vscode.workspace.findFiles('**/' + strFilenamePrefix + '.php');
		files.then((uris: vscode.Uri[]) => {
			let filePath = uris[0].toString();
			vscode.workspace.openTextDocument(uris[0]).then((textDocument: vscode.TextDocument) => {
				let docText = textDocument.getText();
				let methodPosition: number = docText.indexOf('function ' + strPhpMethodName + '(');
				let posStart = textDocument.positionAt('function '.length + methodPosition + '('.length);
				let posEnd = textDocument.positionAt('function '.length + methodPosition + '('.length);
				let range = new vscode.Range(
					posStart,
					posEnd
				);
				let options: vscode.TextDocumentShowOptions = {
					viewColumn: undefined,
					preserveFocus: false,
					preview: false,
					selection: range,
				};
				vscode.window.showTextDocument(textDocument.uri, options);
			});
		})
	}
	console.log('Decorator sample is activated');
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
		const regEx = /'([a-zA-Z\\]+)\w+@\w+'/g;
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
export function deactivate() {
}
