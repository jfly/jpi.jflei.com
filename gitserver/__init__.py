import os
import sys
import os.path
import tempfile
import subprocess

def cdIntoScriptDir():
    f = list(sys._current_frames().values())[0].f_back.f_globals['__file__']
    abspath = os.path.abspath(f)
    dname = os.path.dirname(abspath)
    os.chdir(dname)

class GitSensitiveProject(object):
    def __init__(self, name, compileCommand, runCommand):
        self.name = name
        self.compileCommand = compileCommand
        self.runCommand = runCommand
 
def startGitSensitiveScreen(screenTitle, projects, cleanCommand=None):
    gitserverDir = os.path.dirname(sys.modules[__name__].__file__)
    if not cleanCommand:
        cleanCommand = "echo I have no clean command"
    uniqueNames = set([ project.name for project in projects ])
    assert len(uniqueNames) == len(projects), "Project names must be unique"
    assert all([ ' ' not in project.name for project in projects ]), "Project names must not contain spaces"

    screenrc = ""
    for i, project in enumerate(projects):
        screenrc += 'screen -t "%s" %s\n' % ( project.name, i+1 )
        # savepid does some magic with "set -o monitor" that I don't fully understand,
        # but a side effect of it is that ctrl-c and ctrl-z don't work. We sleep 1 to
        # give people a chance to kill this loop.
        screenrc += 'stuff "while true; do %s/savepid %s/pids/%s.pid %s; sleep 1; done\\012"\n' % ( gitserverDir, gitserverDir, project.name, project.runCommand.replace('"', '\\"' ) )
        screenrc += "\n"

    screenrc += "\n"
    i += 1
    screenrc += 'screen -t "git" %s\n' % (i + 1)
    compileCommands = " && ".join([ project.compileCommand for project in projects ])
    screenrc += 'stuff "%s\\012"\n' % compileCommands.replace('"', '\\"')
    killCommands = " && ".join([ 'sudo %s/kill-tree.sh $(ps opgid= `cat %s/pids/%s.pid`)' % ( gitserverDir, project.name, gitserverDir ) for project in projects ])
    screenrc += """
# Trick to kill whole process tree stolen from
#  http://stackoverflow.com/a/3211182
stuff "%s/poll.sh \\"%s && %s && %s\\";\\012"
""" % ( gitserverDir, cleanCommand, compileCommands, killCommands )
   
    screenrcFilename = "%s/pids/screenrc" % gitserverDir
    screenrcFile = open(screenrcFilename, "w")
    screenrcFile.write(screenrc)
    screenrcFile.close()
    
    # screen -ls always returns 1 exit status for some reason
    screens = subprocess.check_output("screen -ls || exit 0", shell=True).decode('utf-8')
    if screenTitle in screens:
        # TODO if there's more than one session named screenTitle, this doesn't work
        subprocess.check_call("screen -S %s -X quit" % screenTitle, shell=True)

    print("Starting screen named %s" % screenTitle)
    subprocess.check_call(
            "screen -d -m -S %s -c %s" % ( screenTitle, screenrcFilename ),
            shell=True)
