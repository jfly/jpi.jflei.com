#!/bin/sh

# From http://stackoverflow.com/questions/59895/can-a-bash-script-tell-what-directory-its-stored-in
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
echo "Changing to $DIR"
cd $DIR

if [ -d "servers" ]; then
	echo "servers directory already exists, not checking out sub servers"
else
	mkdir servers
	git clone --recursive git@github.com:jfly/tnoodle.git servers/tnoodle

	git clone --recursive git@github.com:jfly/gatekeeper.git servers/gatekeeper
	git clone --recursive git@github.com:jfly/TornadoTracker.git servers/TornadoTracker
fi

#<<<servers/tnoodle/RunAll.py --inject `readlink -m tnoodle-analytics.js` --jsenv WATERMARK="Do not use tnoodle.tk to generate scrambles for a WCA competition."
servers/gatekeeper/startserver.py --username twilio --password gobears --port 8042 --sslcrt `readlink -m server.crt` --sslkey `readlink -m server.key`
servers/TornadoTracker/startserver.py /home/jeremy/TornadoTracker/

## nginx is daemonized, so there's no use running it inside of a screen
sudo nginx -s quit
sudo nginx -c `readlink -m nginx.conf`
