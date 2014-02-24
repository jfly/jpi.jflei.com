#!/usr/bin/env python3

import re
import datetime
import subprocess
import tornado.gen
import tornado.web
import tornado.ioloop
from tornado.ioloop import IOLoop
from tornado.process import Subprocess
from tornado.gen import coroutine, Task, Return
from tornado.options import define, options, parse_command_line

define("port", default=8888, help="run on the given port", type=int)

tvPowerStatus = "standby"
desiredTvPowerStatus = None

class MainHandler(tornado.web.RequestHandler):
    def get(self):
        self.write("Hello, world")

class TvStatusHandler(tornado.web.RequestHandler):
    def get(self):
        self.write({"powerStatus": tvPowerStatus})

class TvOnHandler(tornado.web.RequestHandler):
    def initialize(self, newStatus):
        self.newStatus = newStatus

    def get(self):
        global desiredTvPowerStatus
        desiredTvPowerStatus = self.newStatus

application = tornado.web.Application([
    (r"/", MainHandler),
    (r"/tv/status", TvStatusHandler),
    (r"/tv/on", TvOnHandler, dict(newStatus='on')),
    (r"/tv/standby", TvOnHandler, dict(newStatus='standby')),
])

# Stolen from http://tornadogists.org/6723392/
@coroutine
def call_subprocess(cmds, stdin_data=None, stdin_async=True):
    """call sub process async
 
        Args:
            cmd: str, commands
            stdin_data: str, data for standard in
            stdin_async: bool, whether use async for stdin
    """
    stdin = Subprocess.STREAM if stdin_async else subprocess.PIPE
    sub_process = Subprocess(cmds,
                             stdin=stdin,
                             stdout=Subprocess.STREAM,
                             stderr=Subprocess.STREAM)
 
    if stdin_data:
        if stdin_async:
            yield Task(sub_process.stdin.write, stdin_data)
        else:
            sub_process.stdin.write(stdin_data)
 
    if stdin_async or stdin_data:
        sub_process.stdin.close()
 
    result, error = yield [Task(sub_process.stdout.read_until_close),
                           Task(sub_process.stderr.read_until_close),]
 
    raise Return((result, error))

powerStatusRe = re.compile('power status: (.*)')

@coroutine
def pollTvStatus():
    loop = IOLoop.current() 
    while True:
        yield tornado.gen.Task(loop.add_timeout, datetime.timedelta(seconds=1))
        yield pollTvStatusOnce()


# TODO - Look into running a persistent cec-client to avoid
#        startup and teardown costs.
# cec-client commands came from http://forums.pulse-eight.com/yaf_postst912_power-status-of-TV-using-cec-client.aspx
@coroutine
def pollTvStatusOnce():
    global tvPowerStatus, desiredTvPowerStatus
    stdin_data = 'pow 0'.encode("utf-8")
    cmds = [ "cec-client", "-d", "1", "-s" ]
    result, error = yield call_subprocess(cmds=cmds, stdin_data=stdin_data)
    result = result.decode("utf-8")
    newTvPowerStatus = None
    for line in result.splitlines():
        match = powerStatusRe.match(line)
        if match:
            newTvPowerStatus = match.group(1)
            break
    if newTvPowerStatus:
        if newTvPowerStatus != tvPowerStatus:
            print("TV transitioned to power status: %s" % newTvPowerStatus)
        tvPowerStatus = newTvPowerStatus
    else:
        print("Couldn't find power status, here's what I saw from cec-client")
        print("result: %s" % result)
        print("error: %s" % error)

    if desiredTvPowerStatus:
        if tvPowerStatus == desiredTvPowerStatus:
            print("Skipping transition to: %s, as we're already there!" % desiredTvPowerStatus)
            desiredTvPowerStatus = None
        else:
            print("Transitioning to desired power status: %s" % desiredTvPowerStatus)

            stdin_data = ('%s 0' % desiredTvPowerStatus).encode("utf-8")
            cmds = [ "cec-client", "-d", "1", "-s" ]
            result, error = yield call_subprocess(cmds=cmds, stdin_data=stdin_data)
            if error:
                print("Error running command: %s" % cmds)
                print("result: %s" % result)
                print("error: %s" % error)
            desiredTvPowerStatus = None

if __name__ == "__main__":
    parse_command_line()
    application.listen(options.port)
    loop = IOLoop.instance()
    pollTvStatus()
    loop.start()
