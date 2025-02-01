const vscode = require("vscode");
const fs = require("fs");

/**
 * Logs a message to the debug console
 * @param {String} level Log level, e.g. TRACE, INFO, WARN, ERROR
 * @param {String} message The message to log
 */
function logMessage(level, message) {
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
function copyPath(macroPath, useExternal = false) {
    const match = macroPath.match(addonRegex)[1];
    logMessage("TRACE", `macroPath=${macroPath}, match=${match}`);
    let macroPathArray = match.split("\\");
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
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
    const copyMacroPath = vscode.commands.registerCommand("lazyarmadev.copyMacroPath", function () {
        const activeEditor = vscode.window.activeTextEditor;
        copyPath(activeEditor.document.fileName);
    });
    context.subscriptions.push(copyMacroPath);

    const copyExternalMacroPath = vscode.commands.registerCommand("lazyarmadev.copyExternalMacroPath", function () {
        const activeEditor = vscode.window.activeTextEditor;
        copyPath(activeEditor.document.fileName, true);
    });
    context.subscriptions.push(copyExternalMacroPath);

    const generatePrepFile = vscode.commands.registerCommand("lazyarmadev.generatePrepFile", function () {
        const document = vscode.window.activeTextEditor.document;
        logMessage("TRACE", `document.fileName=${document.fileName}`);
        let functionsFolderArray = document.fileName.split("\\"); // VS Code returns path as "<drive>:\path\..."
        functionsFolderArray.pop(); // Remove file name
        const functionsFolder = functionsFolderArray.join("\\");

        logMessage("INFO", `Generating PREP file for "${functionsFolder}"`);
        let files = fs.readdirSync(functionsFolder);

        // Only PREP sqf files
        files = files.filter(function (file) {
            const extensionArray = file.split(".");
            const extension = extensionArray[extensionArray.length - 1];
            return extension.toLowerCase() == "sqf";
        });

        // Convert fnc_function_name.sqf -> PREP(function_name);
        files.forEach(function (file, index) {
            let functionName = file.split(".")[0]; // Remove extension
            functionName = (functionName.split("_").splice(1)).join("_"); // Remove fn_ / fnc_ prefix
            this[index] = `PREP(${functionName});`;
        }, files);

        // Filter out files that didn't match
        files = files.filter(file => file !== "PREP(undefined);");
        const content = files.join("\n");

        logMessage("TRACE", `content=${content}`);
        files.sort();

        functionsFolderArray.pop(); // Remove "functions", XEH_PREP should be in addon root
        const prepFileDir = functionsFolderArray.join("\\") + "\\XEH_PREP.hpp"
        fs.writeFile(prepFileDir, content, err => {
            if (err) {
                vscode.window.showErrorMessage(`Failed to create file at ${prepFileDir}`);
            } else {
                vscode.window.showInformationMessage(`Generated XEH_PREP.hpp file for ${files.length} functions`);
            }
        });
    });
    context.subscriptions.push(generatePrepFile);
}

function deactivate() {}

module.exports = {
    activate,
    deactivate
}