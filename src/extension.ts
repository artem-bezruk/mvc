"use strict";
import * as vscode from 'vscode';
import * as appRouteParser from './route_parser_v8';
import * as appRouteParser10 from './route_parser_v10';
import * as appUseImportParser from './use_import_parser_v8';
const TAG = 'EP:';
let mThenableProgress;
let mIntervalId: NodeJS.Timeout;
let mResolve: (value: string | PromiseLike<string>) => void;
let mReject: (reason?: any) => void;
let mStatusBarItem: vscode.StatusBarItem;
interface MyResult {
    uri: vscode.Uri;
    positionStart: vscode.Position;
    positionEnd: vscode.Position;
}
export function activate(context: vscode.ExtensionContext) {
    console.log(TAG, 'Extension "goto-route-controller-laravel" activate');
    let disposableRouteToController = vscode.commands.registerTextEditorCommand('extension.openControllerClassFile', (textEditor: vscode.TextEditor, edit: vscode.TextEditorEdit, args: any[]) => {
        try {
            mReject(new Error('CancelProgress'));
        } catch (e) {
        }
        mThenableProgress = vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: 'EP: Finding controller declaration'
        }, (progress: vscode.Progress<{ message?: string; increment?: number }>, token: vscode.CancellationToken) => {
            return new Promise<string>((resolve: (value: string | PromiseLike<string>) => void, reject: (reason?: any) => void) => {
                try {
                    mReject(new Error('CancelProgress'));
                } catch (e) {
                }
                mResolve = resolve; 
                mReject = reject; 
                let textLine: vscode.TextLine = textEditor.document.lineAt(textEditor.selection.start);
                let strUri = textEditor.document.uri.path;
                if (strUri.indexOf('routes') === -1) {
                    vscode.window.showInformationMessage(TAG + ' Oops... This file is not inside routes directory');
                    reject(new Error('NotInsideRoutesDirectory'));
                    return;
                }
                if ((strUri.indexOf('web.php') !== -1) || (strUri.indexOf('api.php') !== -1)) {
                } else {
                    vscode.window.showInformationMessage(TAG + ' Oops... This file is not web.php or api.php');
                    reject(new Error('NotWebPhpOrApiPhp'));
                    return;
                }
                if (textEditor.document.getText().indexOf('Route::') === -1) {
                    vscode.window.showInformationMessage(TAG + ' Oops... No route declaration found in this file');
                    reject(new Error('NoRouteDeclarationFound'));
                    return;
                }
                let activeEditor: vscode.TextEditor = textEditor;
                const text: string = textLine.text;
                let isFound = false;
                let _str_match: string = "";
                let match;
                const regEx: RegExp = /'([a-zA-Z\\]+)\w+(@\w+)?'/g;
                while (match = regEx.exec(fnRouteFilterStr(text))) {
                    const startPos: vscode.Position = activeEditor.document.positionAt(match.index);
                    const endPos: vscode.Position = activeEditor.document.positionAt(match.index + match[0].length);
                    const decoration = { range: new vscode.Range(startPos, endPos), hoverMessage: 'File **' + match[0] + '**' };
                    let strResultMatch: string = match[0];
                    _str_match = strResultMatch;
                    isFound = true;
                    break;
                }
                let temp_location_summ = {
                    found: false,
                    summ_klass_parts: [""],
                    summ_klass_name: "",
                    summ_action: "",
                    use: {},
                    route: {},
                };
                try {
                    let [parsed_route, error] = appRouteParser.fnTryParseRouteVer8(text);
                    console.log('route_parser=',);
                    if (null != parsed_route) {
                        let [results, err2] = appUseImportParser.fnTryParseUseImportVer8(
                            textEditor.document.getText()
                        );
                        console.log('use_import_parser=',);
                        if (null != results) {
                            for (let index = 0; index < results.length; index++) {
                                const parsed_use = results[index];
                                if (parsed_route instanceof Error) {
                                    continue;
                                }
                                if (parsed_use instanceof Error) {
                                    continue;
                                }
                                if (null == parsed_route.use_class_name) {
                                    continue;
                                }
                                if (null == parsed_use.useable_class_name) {
                                    continue;
                                }
                                if (parsed_route.use_class_name == parsed_use.useable_class_name) {
                                    temp_location_summ.found = true;
                                    temp_location_summ.use = parsed_use;
                                    temp_location_summ.route = parsed_route;
                                    temp_location_summ.summ_klass_parts = parsed_use.class_parts;
                                    temp_location_summ.summ_klass_name = parsed_use.useable_class_name;
                                    temp_location_summ.summ_action = parsed_route.action;
                                    break;
                                }
                            }
                        }
                    }
                } catch (error) {
                    console.error('parsing_error=', { error });
                }
                console.log({ temp_location_summ: temp_location_summ });
                try {
                    fnFindAndOpenControllerFile(
                        temp_location_summ,
                        progress,
                        token,
                    ).then((arrResult) => {
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
                        }
                        else if (arrResult.length > 1) {
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
                                console.log('fnFindAndOpenControllerFile:', 'onRejected:', { reason });
                            });
                        }
                        progress.report({ increment: 100 });
                        if (arrResult.length > 0) {
                            console.log('fnFindAndOpenControllerFile:', "arrResult.length > 0");
                            resolve('ResolveFindingDone');
                            Promise.resolve(arrResult);
                        }
                        else {
                            progress.report({ message: 'Declaration not found. [1]' });
                            setTimeout(function () {
                                progress.report({ increment: 100 });
                                resolve('ResolveFindingDone');
                            }, 3000);
                        }
                        console.log('fnFindAndOpenControllerFile:', 'done');
                    }).catch((reason: any) => {
                        console.error('fnFindAndOpenControllerFile:', { reason });
                        _fnOtherWayVer8FullPathController();
                    }).finally(() => {
                    });
                } catch (error) {
                    console.error('fnFindAndOpenControllerFile:', { error });
                    _fnOtherWayVer8FullPathController();
                }
                function _fnOtherWayVer8FullPathController() {
                    let fullpathctr_location_summ = {
                        found: false,
                        is_class_path_absolute: false,
                        class: "",
                        class_dot: "",
                        class_parts: [""],
                        use_class_name: "",
                        action: "",
                    };
                    try {
                        let [parsed_route, error] = appRouteParser.fnTryParseRouteVer8(text);
                        console.log('route_parser=');
                        if (null != parsed_route) {
                            if (parsed_route instanceof Error) {
                                throw new Error("");
                            }
                            fullpathctr_location_summ.found = true;
                            fullpathctr_location_summ.is_class_path_absolute = parsed_route.is_class_path_absolute;
                            fullpathctr_location_summ.class = parsed_route.class;
                            fullpathctr_location_summ.class_dot = parsed_route.class_dot;
                            fullpathctr_location_summ.class_parts = parsed_route.class_parts;
                            fullpathctr_location_summ.use_class_name = parsed_route.use_class_name;
                            fullpathctr_location_summ.action = parsed_route.action;
                        }
                    } catch (error) {
                        console.error('parsing_error=', { error });
                    }
                    console.log({ fullpathctr_location_summ });
                    try {
                        fnFindAndOpenFullPathControllerFile(
                            fullpathctr_location_summ,
                            progress,
                            token,
                        ).then((arrResult) => {
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
                            }
                            else if (arrResult.length > 1) {
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
                                    console.log('fnFindAndOpenFullPathControllerFile:', 'onRejected:', reason);
                                });
                            }
                            progress.report({ increment: 100 });
                            if (arrResult.length > 0) {
                                console.log('fnFindAndOpenFullPathControllerFile:', "erlangp: Hore! Found using Method3");
                                resolve('ResolveFindingDone');
                                Promise.resolve(arrResult);
                            }
                            else {
                                progress.report({ message: 'Declaration not found. [1]' });
                                setTimeout(function () {
                                    progress.report({ increment: 100 });
                                    resolve('ResolveFindingDone');
                                }, 3000);
                            }
                            console.log('fnFindAndOpenFullPathControllerFile:', 'done');
                        }).catch((reason: any) => {
                            console.error('fnFindAndOpenFullPathControllerFile:', { reason });
                            _fnOtherWayVer1();
                        }).finally(() => {
                        });
                    } catch (error) {
                        console.error('fnFindAndOpenFullPathControllerFile:', { error });
                        _fnOtherWayVer1();
                    }
                }
                function _fnOtherWayVer1() {
                    let _pos: number = text.lastIndexOf("@");
                    let _action: string = text.substring(_pos); 
                    let _pos_action_end = _action.indexOf("'");
                    _action = _action.substring(0, _pos_action_end);
                    _action = _action.replace("@", "").replace("'", ""); 
                    console.log('erlangp: hore', ">>>" + _action + "<<<");
                    let _class: string = text.substring(0, _pos);
                    let _pos_class_end: number = _pos;
                    let _pos_class_start: number = _class.lastIndexOf("'");
                    _class = _class.substring(_pos_class_start, _pos_class_end);
                    _class = _class.replace("@", "").replace("'", "");
                    console.log('erlangp: hore', ">>>" + _class + "<<<");
                    if (isFound) {
                        fnHandleRouteToController(_str_match, resolve, reject, progress, token).then((myCode: string) => {
                            console.log('erlangp: myCode: ', myCode);
                            if (myCode === "OK") {
                                console.log("erlangp: Hore! Found using Method1");
                                progress.report({ increment: 100 });
                                resolve('ResolveFindingDone');
                            } else {
                                progress.report({ message: 'Please wait...' });
                                fnRunMethod2(_class, _action, progress, token, resolve);
                            }
                        }).catch((reason: any) => {
                            try {
                                mReject(reason);
                            } catch (e) {
                            }
                        }).finally(() => {
                        });
                    } else {
                        console.log('erlangp: regex not match', '');
                        fnRunMethod2(_class, _action, progress, token, resolve);
                    }
                };
            });
        });
        mThenableProgress.then((value: string) => {
            console.log(TAG, 'progress onFulfilled', value);
        }, (reason: any) => {
            console.log(TAG, 'progress onRejected', reason);
        });
    });
    let disposableControllerToRoute = vscode.commands.registerTextEditorCommand('extension.openRoutesDeclarationFile', (textEditor: vscode.TextEditor, edit: vscode.TextEditorEdit, args: any[]) => {
        try {
            mReject(new Error('CancelProgress'));
        } catch (e) {
        }
        let progressOptions = {
            location: vscode.ProgressLocation.Notification,
            title: 'EP: Finding route declaration'
        };
        mThenableProgress = vscode.window.withProgress(
            progressOptions,
            (progress: vscode.Progress<{ message?: string; increment?: number }>, token: vscode.CancellationToken) => {
                return new Promise<string>((resolve: (value: string | PromiseLike<string>) => void, reject: (reason?: any) => void) => {
                    try {
                        mReject(new Error('CancelProgress'));
                    } catch (e) {
                    }
                    mResolve = resolve;
                    mReject = reject;
                    fnHandleControllerToRouteVer1(textEditor, edit, args, resolve, reject, progress, token)
                        .then(() => {
                        })
                        .catch((reason: any) => {
                            fnHandleControllerToRouteVer8(textEditor, edit, args, resolve, reject, progress, token)
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
                        })
                        .finally(() => {
                        });
                });
            }
        );
        mThenableProgress.then((value: string) => {
            console.log(TAG, 'progress onFulfilled', value);
        }, (reason: any) => {
            console.log(TAG, 'progress onRejected', reason);
        });
    });
    let disposableFindBladeUsage = vscode.commands.registerTextEditorCommand('extension.findBladeUsage', (textEditor: vscode.TextEditor, edit: vscode.TextEditorEdit, args: any[]) => {
        try {
            mReject(new Error('CancelProgress'));
        } catch (e) {
        }
        mThenableProgress = vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: 'EP: Finding blade usage'
        }, (progress: vscode.Progress<{ message?: string; increment?: number }>, token: vscode.CancellationToken) => {
            return new Promise<string>((resolve: (value: string | PromiseLike<string>) => void, reject: (reason?: any) => void) => {
                try {
                    mReject(new Error('CancelProgress'));
                } catch (e) {
                }
                mResolve = resolve; 
                mReject = reject; 
                let textLine: vscode.TextLine = textEditor.document.lineAt(textEditor.selection.start);
                let strUri = textEditor.document.uri.path;
                if (strUri.indexOf('resources') === -1 || strUri.indexOf('views') === -1) {
                    vscode.window.showInformationMessage(TAG + ' Oops... This file is not inside "views" directory');
                    reject(new Error('NotInsideViewsDirectory'));
                    return;
                }
                if ((strUri.indexOf('.blade.php') !== -1)) {
                } else {
                    vscode.window.showInformationMessage(TAG + ' Oops... This file is not a blade file');
                    reject(new Error('NotBladeFile'));
                    return;
                }
                let strFiltered: string = strUri.replace('.blade.php', '')
                    .trim();
                let indexStrResources = strFiltered.indexOf('resources');
                let strr = strFiltered.substring(indexStrResources);
                if (strr.indexOf('resources') === -1 || strr.indexOf('views') === -1) {
                    vscode.window.showInformationMessage(TAG + ' Oops... This file is not inside "views" directory (2)');
                    reject(new Error('NotInsideViewsDirectory2'));
                    return;
                }
                let indexStrViews = strr.indexOf('views');
                strr = strr.substring(indexStrViews + 'views'.length + 1); 
                strr = strr.trim();
                if (strr) {
                } else {
                    vscode.window.showInformationMessage(TAG + ' Oops... No usage found');
                    reject(new Error('NoUsageFound'));
                    return;
                }
                strr = strr.replace(/[\\]/g, '.')
                    .replace(/[/]/g, '.')
                    .trim();
                let strToFind: string = "view('" + strr + "'"; 
                fnHandleFindBladeUsage(strToFind, textEditor, edit, args, resolve, reject, progress, token)
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
            console.log(TAG, 'progress onFulfilled', value);
        }, (reason: any) => {
            console.log(TAG, 'progress onRejected', reason);
        });
    });
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
    function fnUpdateDecorations() {
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
    function fnTriggerUpdateDecorations() {
        if (timeout) {
            clearTimeout(timeout);
            timeout = undefined;
        }
        timeout = setTimeout(fnUpdateDecorations, 500);
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
    context.subscriptions.push(disposableRouteToController);
    context.subscriptions.push(disposableControllerToRoute);
    context.subscriptions.push(disposableFindBladeUsage);
    context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor(function () {
        fnUpdateUiStatusBar();
    }));
    context.subscriptions.push(vscode.window.onDidChangeTextEditorSelection(function () {
        fnUpdateUiStatusBar();
    }));
    fnUpdateUiStatusBar();
}
function fnRunMethod2(_class: string, _action: string, progress: vscode.Progress<{ message?: string | undefined; increment?: number | undefined; }>, token: vscode.CancellationToken, resolve: (value: string | PromiseLike<string>) => void) {
    fnHandleRouteToControllerV2(_class, _action, progress, token).then((arrResult) => {
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
        }
        else if (arrResult.length > 1) {
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
                console.log(TAG, 'onRejected:', reason);
            });
        }
        progress.report({ increment: 100 });
        if (arrResult.length > 0) {
            console.log("erlangp: Hore! Found using Method2");
            resolve('ResolveFindingDone');
            Promise.resolve(arrResult);
        }
        else {
            progress.report({ message: 'Declaration not found. [1]' });
            setTimeout(function () {
                progress.report({ increment: 100 });
                resolve('ResolveFindingDone');
            }, 3000);
        }
        console.log(TAG, 'fnHandleRouteToController: done');
    }).catch((reason: any) => {
        try {
            mReject(reason);
        }
        catch (e) {
        }
    }).finally(() => {
    });
}
export function deactivate() {
    console.log(TAG, 'Extension "goto-route-controller-laravel" deactivate');
}
function fnSleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
function fnUpdateUiStatusBar() {
    let textEditor = vscode.window.activeTextEditor;
    if (textEditor === undefined) {
        return;
    }
    let textLine: vscode.TextLine = textEditor.document.lineAt(textEditor.selection.start);
    mStatusBarItem.hide();
    mStatusBarItem.command = '';
    mStatusBarItem.text = '';
    if (fnIsBladeFile(textEditor)) {
        mStatusBarItem.command = 'extension.findBladeUsage';
        mStatusBarItem.text = 'EP-findBladeUsage';
        mStatusBarItem.tooltip = 'Find blade usage';
        mStatusBarItem.show();
    } else if (fnIsControllerFile(textEditor)) {
        mStatusBarItem.command = 'extension.openRoutesDeclarationFile';
        mStatusBarItem.text = 'EP-findRoute';
        mStatusBarItem.tooltip = 'Find route';
        mStatusBarItem.show();
    } else if (fnIsRouteFile(textEditor)) {
        mStatusBarItem.command = 'extension.openControllerClassFile';
        mStatusBarItem.text = 'EP-findController';
        mStatusBarItem.tooltip = 'Find controller';
        mStatusBarItem.show();
    }
}
function fnIsControllerFile(textEditor: vscode.TextEditor): Boolean {
    let docText = textEditor.document.getText();
    let namespacePosition: number = docText.indexOf('namespace App\\Http\\Controllers');
    if (namespacePosition === -1) {
        return false;
    }
    return true;
}
function fnIsBladeFile(textEditor: vscode.TextEditor): Boolean {
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
    let strr = strFiltered.substring(indexStrResources);
    if (strr.indexOf('resources') === -1 || strr.indexOf('views') === -1) {
        return false;
    }
    let indexStrViews = strr.indexOf('views');
    strr = strr.substring(indexStrViews + 'views'.length + 1); 
    strr = strr.trim();
    if (strr) {
        return true;
    }
    return false;
}
function fnIsRouteFile(textEditor: vscode.TextEditor): Boolean {
    let strUri = textEditor.document.uri.path;
    if ((strUri.indexOf('web.php') !== -1) || (strUri.indexOf('api.php') !== -1)) {
        return true;
    }
    return false;
}
async function fnHandleFindBladeUsage(
    strToFind: string,
    textEditor: vscode.TextEditor,
    edit: vscode.TextEditorEdit,
    args: any[],
    resolveParent: (value: string | PromiseLike<string>) => void,
    rejectParent: (reason?: any) => void,
    progressParent: vscode.Progress<{ message?: string; increment?: number }>,
    tokenParent: vscode.CancellationToken
) {
    let urisAll: vscode.Uri[] = [];
    let uris1 = await vscode.workspace.findFiles('**' + strFilenamePrefix + '.php', '{bootstrap,config,database,node_modules,storage,vendor}' + strFilenamePrefix + '.php', '{bootstrap,config,database,node_modules,storage,vendor}' + summ.summ_klass_name + '.php', '{bootstrap,config,database,node_modules,storage,vendor}' + abcKlassName + '.php', '{bootstrap,config,database,node_modules,storage,vendor}/**');
    if (uris.length === 0) {
        return Promise.reject(new Error('local.NoControllerFileFound'));
    }
    for (let i = 0; i < uris.length; i++) {
        fnUpdateProgressMessage(i, uris, progressParent);
        const uri = uris[i];
        let filePath: string = uri.toString();
        console.log(TAG, 'Scanning file:', filePath);
        let textDocument: vscode.TextDocument = await vscode.workspace.openTextDocument(uri);
        let docText: string = textDocument.getText();
        if (docText.indexOf('<?') !== -1) {
        } else {
            errorList.push('NotPhpFile');
            continue;
        }
        let strNamespacePrefix: string = '';
        let namespacePosition: number = docText.indexOf('namespace App\\Http\\Controllers' + strNamespacePrefix + '');
        if (namespacePosition === -1) {
            errorList.push('NamespaceNotFound');
            continue;
        }
        let arrNamespaceWithoutClassName = summ.class_parts.slice(0, -1); 
        let strExtraSeparator: string = '\\';
        if (summ.class_parts.length === 1) {
            strExtraSeparator = ''; 
        }
        if (summ.class_parts[0] == 'App') {
            strExtraSeparator = ''; 
        }
        let strFullNamespace = 'namespace ' + strExtraSeparator + arrNamespaceWithoutClassName.join('\\') + ';';
        let exactNamespacePosition: number = docText.indexOf('' + strFullNamespace + '');
        if (exactNamespacePosition === -1) {
            errorList.push('ExactNamespaceNotFound');
            continue;
        }
        let classNamePosition: number = docText.indexOf('class ' + abcKlassName + '');
        if (classNamePosition === -1) {
            errorList.push('ClassNameNotFound');
            continue;
        }
        let posStart: vscode.Position = textDocument.positionAt(classNamePosition + 'class '.length);
        let posEnd: vscode.Position = textDocument.positionAt('class '.length + classNamePosition + strPhpMethodName.length);
        if (strPhpMethodName.length > 0) {
            let methodPosition: number = docText.indexOf(' function ' + strPhpMethodName + '(');
            if (methodPosition === -1) {
                errorList.push('MethodNameNotFound');
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
    if (arrResult.length === 0) {
        if (errorList.length > 0) {
            return Promise.reject(errorList[0]);
        }
    }
    return Promise.resolve(arrResult);
}
