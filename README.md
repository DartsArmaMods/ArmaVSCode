<h1 align="center">LazyArmaDev</h1>
<p align="center">
    <img src="https://img.shields.io/badge/Version-1.2.2-blue?style=flat-square" alt="LazyArmaDev Version">
    <a href="https://marketplace.visualstudio.com/items?itemName=DartRuffian.lazyarmadev">
        <img src="https://img.shields.io/visual-studio-marketplace/d/DartRuffian.LazyArmaDev?style=flat-square&label=Downloads" alt="LazyArmaDev Downloads">
    </a>
</p>

# LazyArmaDev README

This is a small VS Code extension for Arma development.
[Install for VS Code](https://marketplace.visualstudio.com/items?itemName=DartRuffian.lazyarmadev).

## Features

### "Copy QPATHTOF Path"
A file context menu option that will copy the macro'd path to a given file.

E.g. selecting a file located at `addons/someAddonName/data/camo1_co.paa` will copy `QPATHTOF(data\camo1_co.paa)` to your clipboard.

#### Requirements:
1. The file/folder is in a folder named `addons`

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