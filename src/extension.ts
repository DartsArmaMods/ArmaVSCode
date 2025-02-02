import * as vscode from "vscode";
import fs from "fs";

function isUndefined(value: any): boolean {
    return (value === null || value === undefined);
}

/**
 * Logs a message to the debug console
 * @param {String} level Log level, e.g. TRACE, INFO, WARN, ERROR
 * @param {String} message The message to log
 */
function logMessage(level: string, message: string) {
    level = level.toUpperCase();
    const length = level.length;

    level = " ".repeat(5 - length) + level;
    console.log(`[LazyArmaDev] ${level}: ${message}`);
}

// Used to get the path to something inside the component folder
const addonRegex = /addons\\(.*)/;

// Used to get the path on disk to the component
const addonDiskRegex = /.*\\addons\\[^\\]*/;

/**
 * Copies the "macro'd" path to a file using the QPATHTOF / QPATHTOEF macros
 * @param {string} macroPath The path to the given file or folder
 * @param {boolean} useExternal (default, false) Use QPATHTOEF macro
 */
function copyPath(macroPath: string, useExternal: boolean = false) {
    const match = macroPath.match(addonRegex);
    if (isUndefined(match)) { return; }

    logMessage("TRACE", `macroPath=${macroPath}, match=${match}`);
    let macroPathArray = match![1].split("\\");
    const componentName = macroPathArray.shift();

    if (useExternal) {
        macroPath = `QPATHTOEF(${componentName},${macroPathArray.join("\\")})`;
    } else {
        macroPath = `QPATHTOF(${macroPathArray.join("\\")})`;
    };

    logMessage("INFO", `Copied path to clipboard: ${macroPath}`);
    vscode.window.showInformationMessage(`Copied ${macroPath} path to clipboard`);
    vscode.env.clipboard.writeText(macroPath);
}

/**
 * Adds a translation key to the given .xml file
 * @param {String} filePath The path to the stringtable.xml file
 * @param {String} stringKey The translation key
 */
function addStringtableKey(filePath: string, stringKey: string) {
    let content = fs.readFileSync(filePath, {encoding: "utf-8", flag: "r"}).split("\n");

    const newKey = `        <Key ID="${stringKey}">
            <English></English>
        </Key>`;
    content.splice(content.length - 2, 0, newKey);

    fs.writeFile(filePath, content.join("\n"), err => {
        if (err) {
            vscode.window.showErrorMessage(`Failed to write to stringtable file at ${filePath}`);
        } else {
            vscode.window.showInformationMessage(`Generated stringtable key for ${stringKey}`);
        }
    });
}

/**
 * Returns the various "prefixes" for the mod / addon
 * @return {string[]} Array of [main prefix, prefix, component]
 */
function getProjectPrefix(): string[] {
    const filePath = vscode.window.activeTextEditor?.document.fileName;
    if (isUndefined(filePath)) { return ["", "", ""]; }

    let addonDir = filePath!.match(addonDiskRegex);
    if (addonDir === null) { return ["", "", ""]; }

    const addonDirArray = addonDir[0].split("\\");
    const component = addonDirArray[addonDirArray.length - 1];

    // Read $PBOPREFIX$ file to get main prefix and prefix
    const prefixContent = fs.readFileSync(`${addonDir}\\$PBOPREFIX$`, {encoding: "utf-8", flag: "r"}).split("\\");
    const mainprefix = prefixContent[0];
    const prefix = prefixContent[1];

    let returnValue = [mainprefix, prefix, component];
    return returnValue;
}

/*
 * Command function usage
 * Use registerTextEditorCommand if the command only uses the active editor / file.
 * If the command uses a different editor or file, use registerCommand with the editor argument.
 */

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context: vscode.ExtensionContext) {
    // Custom when clause for when the "Generate Stringtable Key" command should be shown
    vscode.window.onDidChangeTextEditorSelection((event) => {
        if (event.kind === undefined) { return; };

        const document = vscode.window.activeTextEditor?.document;
        if (document === null || document === undefined) { return; }
        const position = event.selections[0].anchor;

        // Get the previous word, rather than where the cursor is
        let selectedWord = document.getText(document.getWordRangeAtPosition(position));

        const newCharacter = position.character - selectedWord.length;
        if (newCharacter <= 0) {
            vscode.commands.executeCommand("setContext", "LazyArmaDev.selectedStringtableMacro", false);
            return;
        };

        const macroStart = new vscode.Position(position.line, newCharacter);

        selectedWord = document.getText(document.getWordRangeAtPosition(macroStart));
        logMessage("TRACE", `selectedWord=${selectedWord}, ${selectedWord.endsWith("STRING")}`);
        vscode.commands.executeCommand("setContext", "LazyArmaDev.selectedStringtableMacro", selectedWord.endsWith("STRING")); // CSTRING, LSTRING, LLSTRING, etc.
    });

    const copyMacroPath = vscode.commands.registerCommand("lazyarmadev.copyMacroPath", function (editor) {
        let path = editor.path.split("/");
        path.shift();
        copyPath(path.join("\\"));
    });
    context.subscriptions.push(copyMacroPath);

    const copyExternalMacroPath = vscode.commands.registerCommand("lazyarmadev.copyExternalMacroPath", function (editor) {
        let path = editor.path.split("/");
        path.shift();
        copyPath(path.join("\\"), true);
    });
    context.subscriptions.push(copyExternalMacroPath);

    const generatePrepFile = vscode.commands.registerCommand("lazyarmadev.generatePrepFile", function (editor) {
        let functionsFolderArray = editor.path.split("/");
        functionsFolderArray.shift();
        logMessage("TRACE", `functionsFolderArray=[${functionsFolderArray}]`);
        const functionsFolder = functionsFolderArray.join("\\");

        logMessage("INFO", `Generating PREP file for "${functionsFolder}"`);
        let files = fs.readdirSync(functionsFolder);

        // Only PREP sqf files
        files = files.filter(function (file) {
            const extensionArray = file.split(".");
            const extension = extensionArray[extensionArray.length - 1];
            return extension.toLowerCase() === "sqf";
        });

        // Convert fnc_function_name.sqf -> PREP(function_name);
        files.forEach((file, index) => {
            let functionName = file.split(".")[0]; // Remove extension
            functionName = (functionName.split("_").splice(1)).join("_"); // Remove fn_ / fnc_ prefix
            files[index] = `PREP(${functionName});`;
        }, files);

        // Filter out files that didn't match
        files = files.filter(file => file !== "PREP(undefined);");
        const content = files.join("\n");

        logMessage("TRACE", `content=${content}`);
        files.sort();

        functionsFolderArray.pop(); // Remove "functions", XEH_PREP should be in addon root
        const prepFileDir = functionsFolderArray.join("\\") + "\\XEH_PREP.hpp";
        fs.writeFile(prepFileDir, content, err => {
            if (err) {
                vscode.window.showErrorMessage(`Failed to create file at ${prepFileDir}`);
            } else {
                vscode.window.showInformationMessage(`Generated XEH_PREP.hpp file for ${files.length} functions`);
            }
        });
    });
    context.subscriptions.push(generatePrepFile);

    const generateStringtableKey = vscode.commands.registerTextEditorCommand("lazyarmadev.generateStringtableKey", function (textEditor: vscode.TextEditor) {
        const document = textEditor.document;
        const match = document!.fileName.match(addonDiskRegex);

        const stringtableDir = `${match![0]}\\stringtable.xml`;
        logMessage("TRACE", `stringtableDir=${stringtableDir}`);

        const [, prefix, component] = getProjectPrefix();
        let stringKey = document!.getText(document!.getWordRangeAtPosition(textEditor!.selection.active));
        stringKey = `STR_${prefix}_${component}_${stringKey}`;
        logMessage("TRACE", `stringKey="${stringKey}"`);

        // File doesn't exist, so create a "blank" stringtable
        if (!fs.existsSync(stringtableDir)) {
            logMessage("TRACE", "No stringtable.xml found, creating blank file");
            const content = `<?xml version="1.0" encoding="utf-8"?>
<Project name="${prefix.toUpperCase()}">
    <Package name="${component}">
    </Package>
</Project>`;
            fs.writeFile(stringtableDir, content, err => {
                if (err) {
                    vscode.window.showErrorMessage(`Failed to create missing stringtable file at ${stringtableDir}`);
                } else {
                    vscode.window.showInformationMessage(`Automatically generated missing stringtable.xml file`);
                    addStringtableKey(stringtableDir, stringKey);
                }
            });
        } else {
            addStringtableKey(stringtableDir, stringKey);
        }
    });
    context.subscriptions.push(generateStringtableKey);
}

function deactivate() {}

module.exports = {
    activate,
    deactivate
};