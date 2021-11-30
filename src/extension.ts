'use strict';
import * as vscode from 'vscode';
export function activate(context: vscode.ExtensionContext) {
	console.log('Congratulations, your extension "LaravelRouteClassOpener" is now active!');
	let disposableC = vscode.commands.registerCommand('enableLaravelRouteClassOpener', () => {
		vscode.window.showInformationMessage('Laravel Route Class Opener enabled!');
	});
	const regEx: RegExp = /'([a-zA-Z\\]+)\w+Controller(@\w+)?'/g;
	let disposableA = vscode.commands.registerTextEditorCommand('extension.openControllerClassFile', (textEditor: vscode.TextEditor, edit: vscode.TextEditorEdit, args: any[]) => {
		let textLine: vscode.TextLine = textEditor.document.lineAt(textEditor.selection.start);
		let strUri = textEditor.document.uri.path;
		if (strUri.indexOf('routes') == -1) {
			vscode.window.showInformationMessage('This file is not inside routes directory');
			return;
		}
		if ((strUri.indexOf('web.php') != -1) || (strUri.indexOf('api.php') != -1)) {
		} else {
			vscode.window.showInformationMessage('This file is not web.php or api.php');
			return;
		}
		if (textEditor.document.getText().indexOf('Route::') == -1) {
			vscode.window.showInformationMessage('No route declaration found in this file');
			return;
		}
		let activeEditor: vscode.TextEditor = textEditor;
		const text: string = textLine.text;
		let match;
		while (match = regEx.exec(text)) {
			const startPos: vscode.Position = activeEditor.document.positionAt(match.index);
			const endPos: vscode.Position = activeEditor.document.positionAt(match.index + match[0].length);
			const decoration = { range: new vscode.Range(startPos, endPos), hoverMessage: 'File **' + match[0] + '**' };
			let strResultMatch: string = match[0];
			parsePhpClassAndMethod(strResultMatch);
		}
	});
	let disposableB = vscode.commands.registerTextEditorCommand('extension.openRoutesDeclarationFile', (textEditor: vscode.TextEditor, edit: vscode.TextEditorEdit, args: any[]) => {
		let textLine: vscode.TextLine = textEditor.document.lineAt(textEditor.selection.start);
		let activeEditor: vscode.TextEditor = textEditor;
		const text: string = textLine.text;
		const smallNumbers: vscode.DecorationOptions[] = [];
		const largeNumbers: vscode.DecorationOptions[] = [];
		let textDocument = textEditor.document;
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
		let positionNamespaceStart: vscode.Position = textDocument.positionAt(namespacePosition + 'namespace App\\Http\\Controllers'.length);
		let lineNamespace: vscode.TextLine = textDocument.lineAt(positionNamespaceStart);
		let namespaceCommaPosition = lineNamespace.text.indexOf(';') + namespacePosition;
		let positionNamespaceEnd: vscode.Position = textDocument.positionAt(namespaceCommaPosition);
		let strNameSpaceShort: string = textDocument.getText(new vscode.Range(positionNamespaceStart, positionNamespaceEnd));
		if (strNameSpaceShort.indexOf('\\') == 0) {
			strNameSpaceShort = strNameSpaceShort.substr(1)
		}
		let strClassName = parseClassName(textDocument) 
		let strNamespaceWithClass = strNameSpaceShort + '\\' + strClassName
		if (strNamespaceWithClass.indexOf('\\') == 0) {
			strNamespaceWithClass = strNamespaceWithClass.substr(1)
		}
		let parsedMethodName = parseMethodName(textLine);
		let strFullNamespaceWithClassWithMethod = strNamespaceWithClass + "@" + parsedMethodName;
		vscode.window.showInformationMessage(strFullNamespaceWithClassWithMethod);
		let filesWebRoute: Thenable<vscode.Uri[]> = vscode.workspace.findFiles('**/' + 'web.php');
		filesWebRoute.then(handleEe)
		let filesApiRoute: Thenable<vscode.Uri[]> = vscode.workspace.findFiles('**/' + 'api.php');
		filesApiRoute.then(handleEe)
		function handleEe(uris: vscode.Uri[]) {
			if (uris.length == 1) {
			} else {
				return;
			}
			uris.forEach((uri, i: number, uriss) => {
				let filePath: string = uri.toString();
				vscode.workspace.openTextDocument(uri).then((textDocument: vscode.TextDocument) => {
					let docText: string = textDocument.getText();
					if (docText.indexOf('<?php') == 0) {
					} else {
						return;
					}
					let fullStartPosition: number = docText.indexOf("'" + strFullNamespaceWithClassWithMethod + "'")
					if (fullStartPosition == -1) {
						return;
					}
					let fullEndPosition: number = fullStartPosition + ("'" + strFullNamespaceWithClassWithMethod + "'").length
					if (fullEndPosition == -1) {
						return;
					}
					let positionStart: vscode.Position = textDocument.positionAt(fullStartPosition)
					let positionEnd: vscode.Position = textDocument.positionAt(fullEndPosition)
					let ee = textDocument.getText(
						new vscode.Range(
							positionStart, positionEnd
						)
					)
					let options: vscode.TextDocumentShowOptions = {
						viewColumn: undefined,
						preserveFocus: false,
						preview: true,
						selection: new vscode.Range(positionStart, positionEnd),
					};
					vscode.window.showTextDocument(textDocument.uri, options);
				});
			});
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
					let arrNamespaceWithoutClassName = arrStrPhpNamespace.slice(0, -1); 
					let strExtraSeparator: string = '\\';
					if (arrStrPhpNamespace.length == 1) {
						strExtraSeparator = ''; 
					}
					let strFullNamespace = 'namespace App\\Http\\Controllers' + strExtraSeparator + arrNamespaceWithoutClassName.join('\\') + ';';
					let exactNamespacePosition: number = docText.indexOf(strFullNamespace);
					if (exactNamespacePosition == -1) {
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
	function parseClassName(textDocument: vscode.TextDocument): string {
		let strDocument = textDocument.getText();
		const regEx: RegExp = /class \w+Controller /g;
		let match;
		while (match = regEx.exec(strDocument)) {
			const startPos: vscode.Position = textDocument.positionAt(match.index);
			const endPos: vscode.Position = textDocument.positionAt(match.index + match[0].length);
			let strMatch = match[0];
			strMatch = strMatch.replace('class', '')
			strMatch = strMatch.trim()
			return strMatch;
		}
		return '';
	}
	function parseMethodName(textLine: vscode.TextLine): string {
		let strDocument = textLine.text;
		const regEx: RegExp = / public function \w+\(/g;
		let match;
		while (match = regEx.exec(strDocument)) {
			let strMatch = match[0]; 
			strMatch = strMatch.replace('public', ' ')
			strMatch = strMatch.replace('function', ' ')
			strMatch = strMatch.replace('(', ' ')
			strMatch = strMatch.trim()
			return strMatch;
		}
		return '';
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
	}
	vscode.window.onDidChangeActiveTextEditor(editor => {
		activeEditor = editor;
		if (editor) {
		}
	}, null, context.subscriptions);
	vscode.workspace.onDidChangeTextDocument(event => {
		if (activeEditor && event.document === activeEditor.document) {
		}
	}, null, context.subscriptions);
	context.subscriptions.push(disposableA);
	context.subscriptions.push(disposableB);
	context.subscriptions.push(disposableC);
}
export function deactivate() {
}
