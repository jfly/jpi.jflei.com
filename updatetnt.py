#!/usr/bin/env python3

import urllib.request
import json
import os.path
import os
import shutil

API_PREVIEW_HEADER = {"Accept": "application/vnd.github.manifold-preview"}

r = urllib.request.Request("https://api.github.com/repos/cubing/tnoodle/releases",
    headers=API_PREVIEW_HEADER)
f = urllib.request.urlopen(r)
rawjson = f.read().decode()
releases = json.loads(rawjson)
assets_url = releases[0]['assets_url']

r = urllib.request.Request(assets_url, headers=API_PREVIEW_HEADER)
f = urllib.request.urlopen(r)
rawjson = f.read().decode()
assets = json.loads(rawjson)

assets = [ a for a in assets if a['label'].endswith('.html') ]
for asset in assets:
    headers = dict(API_PREVIEW_HEADER)
    headers['Accept'] = 'application/octet-stream'
    r = urllib.request.Request(asset['url'], headers=headers)
    f = urllib.request.urlopen(r)
    raw = f.read().decode()

    f = open(os.path.join('tnt', asset['name']), 'w')
    f.write(raw)
    f.close()

indexName = 'tnt/index.html'
if os.path.exists(indexName):
    os.remove(indexName)
# for some reason, nginx is serving up a 403 with
# a symlink, so we just copy the file.
#os.symlink('tnt.html', indexName)
shutil.copyfile('tnt/tnt.html', indexName)
