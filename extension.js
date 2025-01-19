const vscode = require("vscode");
const fs = require("fs");

/**
 * @param {String} level
 * @param {String} message
 */
function logMessage(level, message) {
    level = level.toUpperCase();
    const length = level.length;

    level = " ".repeat(5 - length) + level;
    console.log(`[LazyArmaDev] ${level}: ${message}`);
}

const addonRegex = /addons\/(.*)/;

function copyPath(macroPath, useExternal = false) {
    const match = macroPath.match(addonRegex)[1];
    logMessage("TRACE", `macroPath=${macroPath}, match=${match}`);
    let macroPathArray = match.split("/");
    const componentName = macroPathArray.shift();

    if (useExternal) {
        macroPath = `QPATHTOEF(${componentName},${macroPathArray.join("\\")})`;
    } else {
        macroPath = `QPATHTOF(${macroPathArray.join("\\")})`;
    };

    logMessage("LOG", `Copied path to clipboard: ${macroPath}`);
    vscode.window.showInformationMessage(`Copied ${macroPath} path to clipboard`);
    vscode.env.clipboard.writeText(macroPath);
}

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
    const copyMacroPath = vscode.commands.registerCommand("lazyarmadev.copyMacroPath", function (editor) {
        copyPath(editor.path);
    });
    context.subscriptions.push(copyMacroPath);

    const copyExternalMacroPath = vscode.commands.registerCommand("lazyarmadev.copyExternalMacroPath", function (editor) {
        copyPath(editor.path, true);
    });
    context.subscriptions.push(copyExternalMacroPath);

    const generatePrepFile = vscode.commands.registerCommand("lazyarmadev.generatePrepFile", function (editor) {
        logMessage("TRACE", `editor.path=${editor.path}`);
        let functionsFolderArray = editor.path.split("/"); // VS Code returns path as "/<drive>/path/..."
        functionsFolderArray.shift(); // Remove leading "/"
        functionsFolderArray.shift(); // Remove "<drive>:/"
        const functionsFolder = "/" + functionsFolderArray.join("/");

        logMessage("LOG", `Generating PREP file for "${functionsFolder}"`);
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
        const prepFileDir = "/" + functionsFolderArray.join("/") + "/XEH_PREP.hpp"
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
