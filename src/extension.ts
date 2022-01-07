"use strict";
import * as vscode from 'vscode';
export function activate(context: vscode.ExtensionContext) {
	console.log('Extension "laravel-goto-controller-route" is now active!');
	let mThenableProgress;
	let mIntervalId: NodeJS.Timeout;
	let mResolve: (value?: string) => void;
	let mReject: (reason?: any) => void;
	const regEx: RegExp = /'([a-zA-Z\\]+)\w+Controller(@\w+)?'/g;
	let disposableA = vscode.commands.registerTextEditorCommand('extension.openControllerClassFile', (textEditor: vscode.TextEditor, edit: vscode.TextEditorEdit, args: any[]) => {
		let textLine: vscode.TextLine = textEditor.document.lineAt(textEditor.selection.start);
		let strUri = textEditor.document.uri.path;
		if (strUri.indexOf('routes') == -1) {
			vscode.window.showInformationMessage('This file is not inside routes directory');
			try {
				mReject(new Error('NotInsideRoutesDirectory'));
			} catch (e) {
			}
			return;
		}
		if ((strUri.indexOf('web.php') != -1) || (strUri.indexOf('api.php') != -1)) {
		} else {
			vscode.window.showInformationMessage('This file is not web.php or api.php');
			try {
				mReject(new Error('FileIsNotWebPhpOrApiPhp'));
			} catch (e) {
			}
			return;
		}
		if (textEditor.document.getText().indexOf('Route::') == -1) {
			vscode.window.showInformationMessage('No route declaration found in this file');
			try {
				mReject(new Error('NoRouteDeclarationFound'));
			} catch (e) {
			}
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
			try {
				mReject(new Error('CancelProgress'));
			} catch (e) {
			}
			mThenableProgress = vscode.window.withProgress({
				location: vscode.ProgressLocation.Notification,
				title: "Laravel: Finding controller declaration"
			}, function (progress: vscode.Progress<{ message?: string; increment?: number }>, token: vscode.CancellationToken) {
				return new Promise<string>(function (resolve: (value?: string) => void, reject: (reason?: any) => void) {
					mResolve = resolve;
					mReject = reject;
					parsePhpClassAndMethod(strResultMatch, resolve, reject, progress, token);
				});
			});
			mThenableProgress.then((value: string) => {
				console.log('progress onFulfilled', value);
			}, (reason: any) => {
				console.log('progress onRejected', reason);
			});
		}
	});
	let disposableB = vscode.commands.registerTextEditorCommand('extension.openRoutesDeclarationFile', (textEditor: vscode.TextEditor, edit: vscode.TextEditorEdit, args: any[]) => {
		let progressOptions = {
			location: vscode.ProgressLocation.Notification,
			title: "Laravel: Finding route declaration"
		};
		try {
			mReject(new Error('CancelProgress'));
		} catch (e) {
		}
		mThenableProgress = vscode.window.withProgress(
			progressOptions,
			function (progress: vscode.Progress<{ message?: string; increment?: number }>, token: vscode.CancellationToken) {
				return new Promise<string>(function (resolve: (value?: string) => void, reject: (reason?: any) => void) {
					mResolve = resolve;
					mReject = reject;
					handleTextEditorCommand(textEditor, edit, args, resolve, reject, progress, token);
				});
			}
		);
		mThenableProgress.then((value: string) => {
			console.log('progress onFulfilled', value);
		}, (reason: any) => {
			console.log('progress onRejected', reason);
		});
	});
	function handleTextEditorCommand(
		textEditor: vscode.TextEditor,
		edit: vscode.TextEditorEdit,
		args: any[],
		resolve: (value?: string) => void,
		reject: (reason?: any) => void,
		progress: vscode.Progress<{ message?: string; increment?: number }>,
		token: vscode.CancellationToken
	) {
		let textLine: vscode.TextLine = textEditor.document.lineAt(textEditor.selection.start);
		let activeEditor: vscode.TextEditor = textEditor;
		const text: string = textLine.text;
		const smallNumbers: vscode.DecorationOptions[] = [];
		const largeNumbers: vscode.DecorationOptions[] = [];
		let textDocument = textEditor.document;
		let docText: string = textDocument.getText();
		if (docText.indexOf('<?php') == 0) {
		} else {
			reject(new Error('NotPhpFile'));
			return;
		}
		let strNamespacePrefix: string = '';
		let namespacePosition: number = docText.indexOf('namespace App\\Http\\Controllers' + strNamespacePrefix);
		if (namespacePosition == -1) {
			reject(new Error('NamespaceNotFound'));
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
		let parsedMethodName: string = '';
		let tempPositionCursor: vscode.Position = textEditor.selection.start;
		let dooLoop: boolean = true;
		while (dooLoop) {
			if (textLine.lineNumber == 1) {
				dooLoop = false;
				break;
			} else {
				parsedMethodName = parseMethodName(textLine).trim();
				if (parsedMethodName.length == 0) {
					tempPositionCursor = tempPositionCursor.translate(-1);
					textLine = textEditor.document.lineAt(tempPositionCursor);
				} else {
					dooLoop = false;
					break;
				}
			}
		}
		let strFullNamespaceWithClassWithMethod = strNamespaceWithClass + "@" + parsedMethodName;
		let filesWebRoute: Thenable<vscode.Uri[]> = vscode.workspace.findFiles('**/' + 'web.php');
		filesWebRoute.then((uris: vscode.Uri[]) => {
			handleEe(uris, strFullNamespaceWithClassWithMethod, resolve, reject, progress, token);
		}, (reason: any) => {
			console.log('File web.php not found', reason);
		});
		let filesApiRoute: Thenable<vscode.Uri[]> = vscode.workspace.findFiles('**/' + 'api.php');
		filesApiRoute.then((uris: vscode.Uri[]) => {
			handleEe(uris, strFullNamespaceWithClassWithMethod, resolve, reject, progress, token);
		}, (reason: any) => {
			console.log('File api.php not found', reason);
		});
	}
	function handleEe(
		uris: vscode.Uri[],
		strFullNamespaceWithClassWithMethod: string,
		resolve: (value?: string) => void,
		reject: (reason?: any) => void,
		progress: vscode.Progress<{ message?: string; increment?: number }>,
		token: vscode.CancellationToken
	) {
		if (uris.length == 1) {
		} else {
			reject(new Error('MultipleFilesMatch'));
			return;
		}
		uris.forEach((uri, i: number, uriss) => {
			let filePath: string = uri.toString();
			vscode.workspace.openTextDocument(uri).then((textDocument: vscode.TextDocument) => {
				let docText: string = textDocument.getText();
				if (docText.indexOf('<?php') == 0) {
				} else {
					reject(new Error('NotPhpFile'));
					return;
				}
				let fullStartPosition: number = docText.indexOf("'" + strFullNamespaceWithClassWithMethod + "'")
				if (fullStartPosition == -1) {
					reject(new Error('ClassAndMethodTextNotFound'));
					return;
				}
				let fullEndPosition: number = fullStartPosition + ("'" + strFullNamespaceWithClassWithMethod + "'").length
				if (fullEndPosition == -1) {
					reject(new Error('EndOfMethodSymbolNotFound'));
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
				setTimeout(function () {
					progress.report({ increment: 99, message: "Done" });
					console.log('console Done');
					vscode.window.showTextDocument(textDocument.uri, options);
					resolve('ResolveFindingDone');
				}, 500);
			});
		});
	}
	function parsePhpClassAndMethod(
		str: string,
		resolve: (value?: string) => void,
		reject: (reason?: any) => void,
		progress: vscode.Progress<{ message?: string; increment?: number }>,
		token: vscode.CancellationToken
	) {
		let strFiltered: string = str.replace(/[,]/g, '')
			.trim()
			.replace(/[\']/g, '')
			.replace(/["]/g, '')
			.trim();
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
						reject(new Error('NotPhpFile'));
						return;
					}
					let strNamespacePrefix: string = '';
					let namespacePosition: number = docText.indexOf('namespace App\\Http\\Controllers' + strNamespacePrefix);
					if (namespacePosition == -1) {
						reject(new Error('NamespaceNotFound'));
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
						reject(new Error('ExactNamespaceNotFound'));
						return;
					}
					let classNamePosition: number = docText.indexOf('class ' + strFilenamePrefix + ' ');
					if (classNamePosition == -1) {
						reject(new Error('ClassNameNotFound'));
						return;
					}
					let posStart: vscode.Position = textDocument.positionAt(classNamePosition + 'class '.length);
					let posEnd: vscode.Position = textDocument.positionAt('class '.length + classNamePosition + strPhpMethodName.length);
					if (strPhpMethodName.length > 0) {
						let methodPosition: number = docText.indexOf(' function ' + strPhpMethodName + '(');
						if (methodPosition == -1) {
							reject(new Error('MethodNameNotFound'));
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
					setTimeout(function () {
						progress.report({ increment: 99, message: "Done" });
						console.log('console Done');
						vscode.window.showTextDocument(textDocument.uri, options);
						resolve('ResolveFindingDone');
					}, 500);
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
			strMatch = strMatch.replace('public', '')
				.replace('function', '')
				.replace('(', '')
				.trim();
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
	function sleep(ms: number) {
		return new Promise(resolve => setTimeout(resolve, ms));
	}
}
export function deactivate() {
}
