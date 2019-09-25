var http = require('http');
var connect = require('connect');
var httpProxy = require('http-proxy');
var harmon = require('harmon');
var trumpet = require('trumpet');

var stream = require('stream');
var util = require('util');
var Upper = new stream.Transform();
Upper._transform = function(chunk, enc, cb) {
    console.log(chunk);//<<<
    var upperChunk = chunk.toString().toUpperCase();
    this.push(upperChunk);
    cb();
};

var selects = [];

selects.push({
    query: 'body',
    func: function(body) {
        //body.removeAttribute('class');//<<<
        var tr = trumpet();
        body.createReadStream({ outer: true }).pipe(tr);//<<<
        //body.createReadStream({ outer: true }).pipe(process.stdout);//<<<

        var comicWrapStream = tr.createReadStream("#comic img", { outer: true });
        comicWrapStream.pipe(body.createWriteStream());
        //comicWrapStream.pipe(process.stdout);//<<<

        /*<<<
        var s = new stream.Readable();
        s.pipe(tr);
        s._read = function noop() {}; // redundant? see update below
        s.push('<div id="comic-wrap">yoyoyo</div>');
        s.push(null);
        */
    },
});

selects.push({
    query: 'head',
    func: function(node) {
        node.createWriteStream().end('<meta name="viewport" content="width=device-width, initial-scale=1"><style>img { max-width: 100%; width: 100%; } body { background-color: black; }</style>');
        //node.createWriteStream().end('');
        //<<<node.createWriteStream().end('<div>+ Trumpet</div>');
    },
});

//
// Basic Connect App
//
var app = connect();

var proxy = httpProxy.createProxyServer({
    target: 'http://www.thedreamlandchronicles.com',
})

app.use(harmon([], selects, true));

/*<<<
app.use('/comic', function comicMiddleware(req, res, next) {
    //<<<
    var _write = res.write;
    res.write = function(data, encoding) {
        console.log(data);//<<<
        _write.call(res, "HELLO");//<<<
    };
    next();
});
*/

app.use(function(req, res) {
    proxy.web(req, res);
});

http.createServer(app).listen(8004);

/*<<<
http.createServer(function(req, res) {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.write('<html><head></head><body><div class="a">Nodejitsu Http Proxy</div><div class="b">&amp; Frames</div></body></html>');
    res.end();
}).listen(8004);
*/
