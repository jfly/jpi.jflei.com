#!/usr/bin/env python3

import sys
import subprocess
import gitserver
gitserver.cdIntoScriptDir()

extraCmds = subprocess.list2cmdline(sys.argv[1:])
if extraCmds:
   extraCmds = ' ' + extraCmds

project = gitserver.GitSensitiveProject(
     name='remote',
     compileCommand='echo Nothing to compile!',
     runCommand='./main.py' + extraCmds)
gitserver.startGitSensitiveScreen('remote', [project])
