# !/usr/bin/env python

# Usage: postpack.py

from json import loads
from os import chdir, environ
from pathlib import Path
from sys import path


if __name__ == "__main__":
    from subprocess import run
    chdir(Path(__file__).parent)

    package = loads((Path(__file__).parent / 'package.json').read_text())
    run(['code', '--install-extension', f'{package["name"]}-{package["version"]}.vsix'])
