#!/bin/sh

# TODO - now that i think about it, perhaps most of this is best inside of the
# appropriate repos...

if [ "`screen -ls | grep tnoodle`" != "" ]; then
	echo "Screen session tnoodle already running, killing it"
	# TODO if there's more than one session named tnoodle, this doesn't work
	screen -S tnoodle -X quit
fi
( cd deps/tnoodle; screen -d -m -S tnoodle -c ../../tnoodlescreenrc )

if [ "`screen -ls | grep battle`" != "" ]; then
	echo "Screen session battle already running, killing it"
	# TODO if there's more than one session named battle, this doesn't work
	screen -S battle -X quit
fi
( cd deps/Hackathon2011; screen -d -m -S battle -c ../../battlescreenrc )

# nginx is daemonized, so there's no use to running it inside of a screen
sudo killall nginx
sudo nginx -c `readlink -f nginx.conf`
