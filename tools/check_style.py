#!/usr/bin/env python3

import fnmatch
import os
import re
import ntpath
import sys
import argparse

def check_style(filepath):
    bad_count_file = 0

    with open(filepath, "r", encoding="utf-8", errors="ignore") as file:
        content = file.read()

        lineNumber = 1
        indexOfCharacter = 0

        for c in content:
            if (c == "\n"):
                lineNumber += 1
            elif (c == "\t"):
                print("ERROR: Tab detected at {0} Line number: {1}".format(filepath,lineNumber))
                bad_count_file += 1

            indexOfCharacter += 1

        file.seek(0)

    return bad_count_file

def main():
    print("Validating style")

    file_list = []
    bad_count = 0

    for folder in ["snippets", "test"]:
        for root, _, filenames in os.walk(folder):
            for filename in fnmatch.filter(filenames, "*"):
                file_list.append(os.path.join(root, filename))

    for filename in file_list:
        bad_count = bad_count + check_style(filename)

    print(f"------\nChecked {len(file_list)} files\nErrors detected: {bad_count}")
    if (bad_count == 0):
        print("Validation PASSED")
    else:
        print("Validation FAILED")

    return bad_count

if __name__ == "__main__":
    sys.exit(main())