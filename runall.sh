#!/bin/sh

# From http://stackoverflow.com/questions/59895/can-a-bash-script-tell-what-directory-its-stored-in
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
echo "Changing to $DIR"
cd $DIR

if [ -d "servers" ]; then
	echo "servers directory already exists, not checking out sub servers"
else
	mkdir servers

	git clone --recursive git@github.com:jfly/gatekeeper.git servers/gatekeeper
fi

servers/gatekeeper/startserver.py --username twilio --password gobears --port 8042 --sslcrt `readlink -m server.crt` --sslkey `readlink -m server.key`
PYTHONPATH=. remote/startserver.py --port=8043

## nginx is daemonized, so there's no use running it inside of a screen
sudo nginx -s quit; sudo nginx -c `readlink -m nginx.conf`
