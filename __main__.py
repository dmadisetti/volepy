#!/usr/bin/python

from functools import wraps
from flask import Flask, jsonify, render_template
from nmcli import dev, con
from speedtest import Speedtest
import os

app = Flask(__name__, static_url_path='/static', static_folder="static")

def api(endpoint):
    def wrapper(fn):
        @wraps(fn)
        def wrapped(*args, **kwargs):
            try:
                return jsonify({"results":fn(*args, **kwargs)})
            except Exception as e:
                return jsonify({"error": "API Error: {0}".format(e)})
        return app.route("/api/{}".format(endpoint))(wrapped)
    return wrapper

@app.route("/")
def home():
    return render_template("index.html")

@api("speed")
def speed():
    test = Speedtest()
    test.get_servers()
    test.get_best_server()
    test.download()
    test.upload()
    return [test.results.dict()]

@api("dev")
def device():
    return dev.wifi()

@api("connect")
def list_connection():
    return con.s()

@api("connect/<profile>")
def connect(profile):
    return con.up(id=profile)

@api("check")
def check():
    def parse(line):
       line = line.split(" ")
       return {"time": int(line[0]), "mac": line[1], "ip": line[2], "host":
               line[3]}
    with open("/var/lib/misc/dnsmasq.leases", "r") as file:
        data = [parse(line) for line in file]
    return data

if (__name__ == '__main__'):
    # Bind to PORT if defined, otherwise default to 80.
    port = int(os.environ.get('PORT', 8000))
    app.run(host='0.0.0.0', port=port, debug=True)
