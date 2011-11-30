var http = require('http');
var httpProxy = require('http-proxy');

var proxy = new httpProxy.RoutingProxy();

var proxyServer = http.createServer(function(req, res) {

  //res.writeHead(200, { 'Content-Type': 'text/plain' });
  //res.write('request successfully proxied: ' + req.url +'\n' + JSON.stringify(req.headers, true, 2));
  //res.end();

  var options = [
    { prefix: "/battle",  host: 'localhost', port: 8001, path: "/" },
    { prefix: "/socket.io", host: 'localhost', port: 8001, path: "/socket.io" },
    { prefix: "/nowjs", host: 'localhost', port: 8001, path: "/nowjs" },

	{ prefix: "/", host: 'localhost', port: 8080, path: "/" }
  ];

  for(var i = 0; i < options.length; i++) {// TODO - optimize! tree structure?
	var option = options[i];

	var prefixStr = option.prefix;
    var index = req.url.indexOf(prefixStr);
	if(index < 0) {
		continue;
	}
	// TODO - are we generating urls with "//" in them?
	// TODO - redirect battle -> battle/
    req.url = option.path + req.url.substring(index+prefixStr.length);
    proxy.proxyRequest(req, res, {
      host: option.host,
      port: option.port
    });
	return;
  }

	// TODO - assert false!
});

proxyServer.on('upgrade', function(req, socket, head) {
  //
  // Proxy websocket requests too
  //
  proxy.proxyWebSocketRequest(req, socket, head, {
	host: 'localhost',
	port: 8001
  });
});

proxyServer.listen(80);
