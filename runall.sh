#!/bin/sh

# TODO - now that i think about it, perhaps most of this is best inside of the
# appropriate repos...

if [ -d "servers" ]; then
	echo "servers directory already exists, not checking out sub servers"
else
	mkdir servers
	git clone --recursive git://github.com/jfly/tnoodle.git servers/tnoodle
	git clone --recursive git://github.com/jfly/Hackathon2011.git servers/Hackathon2011
fi

if [ "`screen -ls | grep tnoodle`" != "" ]; then
	echo "Screen session tnoodle already running, killing it"
	# TODO if there's more than one session named tnoodle, this doesn't work
	screen -S tnoodle -X quit
fi
( cd servers/tnoodle; screen -d -m -S tnoodle -c ../../tnoodlescreenrc )

if [ "`screen -ls | grep battle`" != "" ]; then
	echo "Screen session battle already running, killing it"
	# TODO if there's more than one session named battle, this doesn't work
	screen -S battle -X quit
fi
( cd servers/Hackathon2011; screen -d -m -S battle -c ../../battlescreenrc )

if [ "`screen -ls | grep jflei`" != "" ]; then
	echo "Screen session jflei already running, killing it"
	# TODO if there's more than one session named jflei, this doesn't work
	screen -S jflei -X quit
fi
( screen -d -m -S jflei -c jfleiscreenrc )

## nginx is daemonized, so there's no use to running it inside of a screen
##sudo killall node
##sudo nginx -c `readlink -f nginx.conf`
