#!/bin/sh

# From http://stackoverflow.com/questions/59895/can-a-bash-script-tell-what-directory-its-stored-in
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
echo "Changing to $DIR"
cd $DIR

if [ -d "servers" ]; then
	echo "servers directory already exists, not checking out sub servers"
else
	mkdir servers
	git clone --recursive git://github.com/jfly/tnoodle.git servers/tnoodle
fi

servers/tnoodle/RunAll.py --inject `readlink -e tnoodle-analytics.js`

# TODO port jflei code to use git-tools stuff <<<
if [ "`screen -ls | grep jflei`" != "" ]; then
	echo "Screen session jflei already running, killing it"
	# TODO if there's more than one session named jflei, this doesn't work
	screen -S jflei -X quit
fi
( screen -d -m -S jflei -c jfleiscreenrc )

## nginx is daemonized, so there's no use running it inside of a screen
##sudo killall node
##sudo nginx -c `readlink -f nginx.conf`
