# LazyArmaDev README

This is a small VS Code extension for Arma development.

## Features

### "Copy QPATHTOF Path"
A file context menu option that will copy the macro'd path to a given file.

E.g. selecting a file located at `addons/someAddonName/data/camo1_co.paa` will copy `QPATHTOF(data\camo1_co.paa)` to your clipboard.

### Snippets
There are a small collection of snippets to make Arma development easier.

#### SQF
1. ACE function header
2. CBA function header
3. `CBA_settingsInitialized` event handler

#### Config
These snippets are avaiable for both the C++ language and [HEMTT](https://marketplace.visualstudio.com/items?itemName=BrettMayson.hemtt)'s "Arma Config" language.
1. CfgPatches
2. CfgPatches (Subaddon)

#### Requirements:
1. The file/folder is in a folder named `addons`

## Known Issues

None

## Release Notes

Users appreciate release notes as you update your extension.

### 1.0.0

Initial release