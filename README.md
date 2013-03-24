This repo contains all the scripts necessary to get jflei.com running. TNoodleServer and Hackathon2011 are started up in detached, named screen sessions. nginx is used to forward requests to the appropriate webserver.

Stuff to look into:

 - http://www.envjs.com/ Tests would be really nice to have. They should be inside of tnoodle and Hackathon2011, though.


Must generate ssl certificates before running `./runall.sh`:

 - openssl genrsa -out server.key 1024; 
 - openssl req -subj '/C=US/ST=California/L=San Francisco/CN=jflei.com' -new -key server.key -out server.csr;
 - openssl x509 -req -days 365 -in server.csr -signkey server.key -out server.crt;
