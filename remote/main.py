#!/usr/bin/env python3

import tornado.gen
import tornado.web
import tornado.ioloop
from tornado.options import define, options, parse_command_line

define("port", default=8888, help="run on the given port", type=int)

TV_IS_ON = False#<<<

class MainHandler(tornado.web.RequestHandler):
    def get(self):
        self.write("Hello, world")

class TvStateHandler(tornado.web.RequestHandler):
    def get(self):
        self.write({"on": TV_IS_ON})

class TvOnHandler(tornado.web.RequestHandler):
    def initialize(self, on):
        self.on = on

    def get(self):
        global TV_IS_ON
        error = None
        TV_IS_ON = self.on
        self.write({"error": error})

application = tornado.web.Application([
    (r"/", MainHandler),
    (r"/tv/state", TvStateHandler),
    (r"/tv/on", TvOnHandler, dict(on=True)),
    (r"/tv/off", TvOnHandler, dict(on=False)),
])

if __name__ == "__main__":
    parse_command_line()
    application.listen(options.port)
    loop = tornado.ioloop.IOLoop.instance()
    loop.start()

    import datetime
    @tornado.gen.engine
    def f():
        while True:
            print('yielding...!')
            # Pause 1 second while other tasks can run on the loop
            yield tornado.gen.Task(loop.add_timeout, datetime.timedelta(seconds=1))
            print('go!')

    f()
