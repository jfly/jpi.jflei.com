This repo just contains stuff that runs on my raspberry pi at home, affectionally known as jpi (rhymes with jfly).

Need a version of nginx configured with:

 - ./configure --with-http_ssl_module --with-http_sub_module

http://wiki.nginx.org/HttpSubsModule#Installation
 - ./configure --with-http_ssl_module --with-http_sub_module --add-module=../ngx_http_substitutions_filter_module

Must generate ssl certificates before running `./runall.sh`:

 - openssl genrsa -out server.key 1024; 
 - openssl req -subj '/C=US/ST=California/L=San Francisco/CN=jpi.jflei.com' -new -key server.key -out server.csr;
 - openssl x509 -req -days 365 -in server.csr -signkey server.key -out server.crt;

Also must create an htpasswd file to protect LAN features. For example, to create a
file for username "admin" and password "password":
 - echo admin:{PLAIN}password > htpasswd
