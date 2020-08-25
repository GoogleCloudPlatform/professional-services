import os
import flask
import time
import random
import logging

log = logging.getLogger(__name__)

app = flask.Flask(__name__)
delay = int(os.environ.get("delay", 0))

# "1 out of <err_rate>" is an error (0 = no errors)
err_rate = int(os.environ.get("err_rate", 0))
response = str(os.environ.get("response", "PONG"))


log.info("using [%s] delay" % delay)
log.info("using [%s] error_rate" % err_rate)
log.info("using [%s] response" % response)

@app.route("/ping")
def ping():
  if err_rate > 0:
    is_err = (random.random()*err_rate) < 1
    if is_err:
      return "ERROR", 500
  
  time.sleep(delay)
  return response


if __name__ == "__main__":
  app.run(host="0.0.0.0", port="8080", debug=True)
