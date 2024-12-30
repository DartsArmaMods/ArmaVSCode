// The module "vscode" contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require("vscode");

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
    const copyMacroPath = vscode.commands.registerCommand("arma-vscode.copyMacroPath", async function (editor) {
        let macroPath = editor.path;

        vscode.window.showInformationMessage(`Copied ${macroPath} path to clipboard`);
        await vscode.env.clipboard.writeText(macroPath);
    });

    context.subscriptions.push(copyMacroPath);
}

// This method is called when your extension is deactivated
function deactivate() {}

module.exports = {
    activate,
    deactivate
}
