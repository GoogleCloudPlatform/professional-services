import os
import respond_and_relay
import logging

log = logging.getLogger(__name__)

BACKEND = os.environ["backend"]
log.info("using [%s] as backend" % BACKEND)


def pre(path, request_params):
  """ modify the request_params in place before sending to backend
  """
  if path == "healthz":
    log.info("skipping relay of health check")
    return

  log.info("-- original request\n%s" % request_params)
  request_params['headers']["injected-header"] = "1"
  request_params['url'] = "%s/%s" % (BACKEND, path)
  log.info("-- new request\n%s" % request_params)

  return request_params


def post(content, status, headers):
  """ inspect backend response
  """
  log.info("-- backend response\n%s %s %s" % (status, headers, len(content)))
  

app = respond_and_relay.create_relay_app(pre, post)

if __name__ == "__main__":
    app.run(debug=1, port=8080, host="0.0.0.0")
