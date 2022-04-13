"use strict";
import * as vscode from 'vscode';
let mThenableProgress;
let mIntervalId: NodeJS.Timeout;
let mResolve: (value?: string) => void;
let mReject: (reason?: any) => void;
let mStatusBarItem: vscode.StatusBarItem;
export function activate(context: vscode.ExtensionContext) {
    console.log('Extension "goto-route-controller-laravel" activate');
    let disposableA = vscode.commands.registerTextEditorCommand('extension.openControllerClassFile', (textEditor: vscode.TextEditor, edit: vscode.TextEditorEdit, args: any[]) => {
        try {
            mReject(new Error('CancelProgress'));
        } catch (e) {
        }
        mThenableProgress = vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "EP: Laravel: Finding controller declaration"
        }, (progress: vscode.Progress<{ message?: string; increment?: number }>, token: vscode.CancellationToken) => {
            return new Promise<string>((resolve: (value?: string) => void, reject: (reason?: any) => void) => {
                try {
                    mReject(new Error('CancelProgress'));
                } catch (e) {
                }
                mResolve = resolve; 
                mReject = reject; 
                let textLine: vscode.TextLine = textEditor.document.lineAt(textEditor.selection.start);
                let strUri = textEditor.document.uri.path;
                if (strUri.indexOf('routes') === -1) {
                    vscode.window.showInformationMessage('This file is not inside routes directory');
                    reject(new Error('NotInsideRoutesDirectory'));
                    return;
                }
                if ((strUri.indexOf('web.php') !== -1) || (strUri.indexOf('api.php') !== -1)) {
                } else {
                    vscode.window.showInformationMessage('This file is not web.php or api.php');
                    reject(new Error('NotWebPhpOrApiPhp'));
                    return;
                }
                if (textEditor.document.getText().indexOf('Route::') === -1) {
                    vscode.window.showInformationMessage('No route declaration found in this file');
                    reject(new Error('NoRouteDeclarationFound'));
                    return;
                }
                let activeEditor: vscode.TextEditor = textEditor;
                const text: string = textLine.text;
                let isFound = false;
                let match;
                const regEx: RegExp = /'([a-zA-Z\\]+)\w+Controller(@\w+)?'/g;
                while (match = regEx.exec(text)) {
                    const startPos: vscode.Position = activeEditor.document.positionAt(match.index);
                    const endPos: vscode.Position = activeEditor.document.positionAt(match.index + match[0].length);
                    const decoration = { range: new vscode.Range(startPos, endPos), hoverMessage: 'File **' + match[0] + '**' };
                    let strResultMatch: string = match[0];
                    parsePhpClassAndMethod(strResultMatch, resolve, reject, progress, token)
                        .then(() => {
                        })
                        .catch((reason: any) => {
                            try {
                                mReject(reason);
                            } catch (e) {
                            }
                        })
                        .finally(() => {
                        });
                    isFound = true;
                    break;
                }
                if (!isFound) {
                    reject(new Error('NoMatch'));
                }
            });
        });
        mThenableProgress.then((value: string) => {
            console.log('progress onFulfilled', value);
        }, (reason: any) => {
            console.log('progress onRejected', reason);
        });
    });
    let disposableB = vscode.commands.registerTextEditorCommand('extension.openRoutesDeclarationFile', (textEditor: vscode.TextEditor, edit: vscode.TextEditorEdit, args: any[]) => {
        try {
            mReject(new Error('CancelProgress'));
        } catch (e) {
        }
        let progressOptions = {
            location: vscode.ProgressLocation.Notification,
            title: "EP: Laravel: Finding route declaration"
        };
        mThenableProgress = vscode.window.withProgress(
            progressOptions,
            (progress: vscode.Progress<{ message?: string; increment?: number }>, token: vscode.CancellationToken) => {
                return new Promise<string>((resolve: (value?: string) => void, reject: (reason?: any) => void) => {
                    try {
                        mReject(new Error('CancelProgress'));
                    } catch (e) {
                    }
                    mResolve = resolve;
                    mReject = reject;
                    handleTextEditorCommand(textEditor, edit, args, resolve, reject, progress, token)
                        .then(() => {
                        })
                        .catch((reason: any) => {
                            try {
                                mReject(reason);
                            } catch (e) {
                            }
                        })
                        .finally(() => {
                        });
                });
            }
        );
        mThenableProgress.then((value: string) => {
            console.log('progress onFulfilled', value);
        }, (reason: any) => {
            console.log('progress onRejected', reason);
        });
    });
    let disposableC = vscode.commands.registerTextEditorCommand('extension.findBladeUsage', (textEditor: vscode.TextEditor, edit: vscode.TextEditorEdit, args: any[]) => {
        try {
            mReject(new Error('CancelProgress'));
        } catch (e) {
        }
        mThenableProgress = vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "EP: Laravel: Finding blade usage"
        }, (progress: vscode.Progress<{ message?: string; increment?: number }>, token: vscode.CancellationToken) => {
            return new Promise<string>((resolve: (value?: string) => void, reject: (reason?: any) => void) => {
                try {
                    mReject(new Error('CancelProgress'));
                } catch (e) {
                }
                mResolve = resolve; 
                mReject = reject; 
                let textLine: vscode.TextLine = textEditor.document.lineAt(textEditor.selection.start);
                let strUri = textEditor.document.uri.path;
                if (strUri.indexOf('resources') === -1 || strUri.indexOf('views') === -1) {
                    vscode.window.showInformationMessage('This file is not inside "views" directory');
                    reject(new Error('NotInsideViewsDirectory'));
                    return;
                }
                if ((strUri.indexOf('.blade.php') !== -1)) {
                } else {
                    vscode.window.showInformationMessage('This file is not a blade file');
                    reject(new Error('NotBladeFile'));
                    return;
                }
                let strFiltered: string = strUri.replace('.blade.php', '')
                    .trim();
                let indexStrResources = strFiltered.indexOf('resources');
                let strr = strFiltered.substr(indexStrResources);
                if (strr.indexOf('resources') === -1 || strr.indexOf('views') === -1) {
                    vscode.window.showInformationMessage('This file is not inside "views" directory (2)');
                    reject(new Error('NotInsideViewsDirectory2'));
                    return;
                }
                let indexStrViews = strr.indexOf('views');
                strr = strr.substr(indexStrViews + 'views'.length + 1); 
                strr = strr.trim();
                if (strr) {
                } else {
                    vscode.window.showInformationMessage('No usage found');
                    reject(new Error('NoUsageFound'));
                    return;
                }
                console.log('Horray! File is valid.');
                strr = strr.replace(/[\\]/g, '.')
                    .replace(/[/]/g, '.')
                    .trim();
                console.log(strr); 
                let strToFind: string = "view('" + strr + "'";
                handleFindBladeUsage(strToFind, textEditor, edit, args, resolve, reject, progress, token)
                    .then(() => {
                    })
                    .catch((reason: any) => {
                        try {
                            mReject(reason);
                        } catch (e) {
                        }
                    })
                    .finally(() => {
                    });
            });
        });
        mThenableProgress.then((value: string) => {
            console.log('progress onFulfilled', value);
        }, (reason: any) => {
            console.log('progress onRejected', reason);
        });
    });
    async function handleFindBladeUsage(
        strToFind: string,
        textEditor: vscode.TextEditor,
        edit: vscode.TextEditorEdit,
        args: any[],
        resolveParent: (value?: string) => void,
        rejectParent: (reason?: any) => void,
        progressParent: vscode.Progress<{ message?: string; increment?: number }>,
        tokenParent: vscode.CancellationToken
    ) {
        let urisAll: vscode.Uri[] = [];
        let uris1 = await vscode.workspace.findFiles('**vendor' + strFilenamePrefix + '.php', 'vendor,node_modules');
        for (let i = 0; i < uris.length; i++) {
            const uri = uris[i];
            let filePath: string = uri.toString();
            console.log('Scanning file:', filePath);
            let textDocument: vscode.TextDocument = await vscode.workspace.openTextDocument(uri);
            let docText: string = textDocument.getText();
            if (docText.indexOf('<?php') === 0) {
            } else {
                continue;
            }
            let strNamespacePrefix: string = '';
            let namespacePosition: number = docText.indexOf('namespace App\\Http\\Controllers' + strNamespacePrefix);
            if (namespacePosition === -1) {
                continue;
            }
            let arrNamespaceWithoutClassName = arrStrPhpNamespace.slice(0, -1); 
            let strExtraSeparator: string = '\\';
            if (arrStrPhpNamespace.length === 1) {
                strExtraSeparator = ''; 
            }
            let strFullNamespace = 'namespace App\\Http\\Controllers' + strExtraSeparator + arrNamespaceWithoutClassName.join('\\') + ';';
            let exactNamespacePosition: number = docText.indexOf(strFullNamespace);
            if (exactNamespacePosition === -1) {
                continue;
            }
            let classNamePosition: number = docText.indexOf('class ' + strFilenamePrefix + ' ');
            if (classNamePosition === -1) {
                continue;
            }
            let posStart: vscode.Position = textDocument.positionAt(classNamePosition + 'class '.length);
            let posEnd: vscode.Position = textDocument.positionAt('class '.length + classNamePosition + strPhpMethodName.length);
            if (strPhpMethodName.length > 0) {
                let methodPosition: number = docText.indexOf(' function ' + strPhpMethodName + '(');
                if (methodPosition === -1) {
                    continue;
                } else {
                    posStart = textDocument.positionAt(methodPosition + ' function '.length);
                    posEnd = textDocument.positionAt(' function '.length + methodPosition + strPhpMethodName.length);
                }
            }
            arrResult.push({
                uri: textDocument.uri,
                positionStart: posStart,
                positionEnd: posStart
            });
        }
        if (arrResult.length === 1) {
            for (let i = 0; i < arrResult.length; i++) {
                const rec: MyResult = arrResult[i];
                let showOptions: vscode.TextDocumentShowOptions = {
                    viewColumn: undefined,
                    preserveFocus: false,
                    preview: true,
                    selection: new vscode.Range(rec.positionStart, rec.positionEnd),
                };
                vscode.window.showTextDocument(rec.uri, showOptions);
                break;
            }
        } else if (arrResult.length > 1) {
            let arrStrPath: string[] = [];
            for (let x = 0; x < arrResult.length; x++) {
                const rec = arrResult[x];
                arrStrPath.push(rec.uri.path);
            }
            vscode.window.showQuickPick(
                arrStrPath,
                {
                    ignoreFocusOut: true,
                    canPickMany: false,
                }
            ).then((value: string | undefined) => {
                for (let i = 0; i < arrResult.length; i++) {
                    const rec: MyResult = arrResult[i];
                    if (value === rec.uri.path) {
                        let showOptions: vscode.TextDocumentShowOptions = {
                            viewColumn: undefined,
                            preserveFocus: false,
                            preview: true,
                            selection: new vscode.Range(rec.positionStart, rec.positionEnd),
                        };
                        vscode.window.showTextDocument(rec.uri, showOptions);
                        break;
                    }
                }
            }, (reason: any) => {
                console.log('onrejected:', reason);
            });
        }
        progressParent.report({ increment: 99, message: "Done" });
        console.log('console Done');
        resolveParent('ResolveFindingDone');
    }
    function parseClassName(textDocument: vscode.TextDocument): string {
        let strDocument = textDocument.getText();
        const regEx: RegExp = /class \w+Controller /g;
        let match;
        while (match = regEx.exec(strDocument)) {
            const startPos: vscode.Position = textDocument.positionAt(match.index);
            const endPos: vscode.Position = textDocument.positionAt(match.index + match[0].length);
            let strMatch = match[0];
            strMatch = strMatch.replace('class', '');
            strMatch = strMatch.trim();
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
        const regEx: RegExp = /'([a-zA-Z\\]+)\w+Controller(@\w+)?'/g;
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
    mStatusBarItem = vscode.window.createStatusBarItem(
        vscode.StatusBarAlignment.Right, 100
    );
    context.subscriptions.push(mStatusBarItem);
    mStatusBarItem.hide(); 
    context.subscriptions.push(disposableA);
    context.subscriptions.push(disposableB);
    context.subscriptions.push(disposableC);
    context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor(function () {
        updateUiStatusBar();
    }));
    context.subscriptions.push(vscode.window.onDidChangeTextEditorSelection(function () {
        updateUiStatusBar();
    }));
    updateUiStatusBar();
}
export function deactivate() {
    console.log('Extension "goto-route-controller-laravel" deactivate');
}
function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
function updateUiStatusBar() {
    let textEditor = vscode.window.activeTextEditor;
    if (textEditor === undefined) {
        return;
    }
    let textLine: vscode.TextLine = textEditor.document.lineAt(textEditor.selection.start);
    mStatusBarItem.hide();
    mStatusBarItem.command = '';
    mStatusBarItem.text = '';
    if (isBladeFile(textEditor)) {
        mStatusBarItem.command = 'extension.findBladeUsage';
        mStatusBarItem.text = 'EP-findController';
        mStatusBarItem.tooltip = "Find controller";
        mStatusBarItem.show();
    } else if (isControllerFile(textEditor)) {
        mStatusBarItem.command = 'extension.openRoutesDeclarationFile';
        mStatusBarItem.text = 'EP-findRoute';
        mStatusBarItem.tooltip = "Find route";
        mStatusBarItem.show();
    } else if (isRouteFile(textEditor)) {
        mStatusBarItem.command = 'extension.openControllerClassFile';
        mStatusBarItem.text = 'EP-findController';
        mStatusBarItem.tooltip = "Find controller";
        mStatusBarItem.show();
    }
}
function isControllerFile(textEditor: vscode.TextEditor): Boolean {
    let docText = textEditor.document.getText();
    let namespacePosition: number = docText.indexOf('namespace App\\Http\\Controllers');
    if (namespacePosition === -1) {
        return false;
    }
    return true;
}
function isBladeFile(textEditor: vscode.TextEditor): Boolean {
    let strUri = textEditor.document.uri.path;
    if (strUri.indexOf('resources') === -1 || strUri.indexOf('views') === -1) {
        return false;
    }
    if ((strUri.indexOf('.blade.php') !== -1)) {
    } else {
        return false;
    }
    let strFiltered: string = strUri.replace('.blade.php', '')
        .trim();
    let indexStrResources = strFiltered.indexOf('resources');
    let strr = strFiltered.substr(indexStrResources);
    if (strr.indexOf('resources') === -1 || strr.indexOf('views') === -1) {
        return false;
    }
    let indexStrViews = strr.indexOf('views');
    strr = strr.substr(indexStrViews + 'views'.length + 1); 
    strr = strr.trim();
    if (strr) {
        return true;
    }
    return false;
}
function isRouteFile(textEditor: vscode.TextEditor): Boolean {
    let strUri = textEditor.document.uri.path;
    if ((strUri.indexOf('web.php') !== -1) || (strUri.indexOf('api.php') !== -1)) {
        return true;
    }
    return false;
}
