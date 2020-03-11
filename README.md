DEPRECATED: Some content has moved to https://github.com/jfly/dotfiles

# jpi

DEPRECATED: The contents of this repo have moved to
<https://github.com/jfly/dotfiles> and <https://github.com/jfly/gatekeeper>.

This repo just contains stuff that runs on my HTPC. This is meant to be set up
on an Arch machine bootstrapped for HTPC with
[my dotfiles](https://github.com/jfly/dotfiles).

# Setup

Transmission and kodi should be running.

You must create an htpasswd file to protect LAN features. For example, to create a
file for username "admin" and password "password":
- `echo admin:{PLAIN}password > htpasswd`

# TODO

Must generate ssl certificates before running `./runall.sh`:

- `openssl genrsa -out server.key 1024;`
- `openssl req -subj '/C=US/ST=California/L=San Francisco/CN=jpi.jflei.com' -new -key server.key -out server.csr;`
- `openssl x509 -req -days 365 -in server.csr -signkey server.key -out server.crt;`
