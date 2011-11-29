This repo contains all the scripts necessary to get jflei.com running. TNoodleServer and Hackathon2011 are started up in detached, named screen sessions. nginx is used to forward requests to the appropriate webserver.

I anticipate that most of the gnu screen magic will get moved into the appropriate subprojects (tnoodle and Hackathon2011). I just need to think of a way of doing it that allows for bug fixes that are easier than tracking down all the places the scripts have been copied to.

Since nginx can't handle websockets, I've written a teeny webserver in node using http-proxy to get TNoodle and battle on one port.

Stuff to look into:

 -http://www.envjs.com/ Tests would be really nice to have. They should be inside of tnoodle and Hackathon2011, though.
