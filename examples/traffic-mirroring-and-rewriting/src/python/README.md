Mirror Plane: Receiving end of the mirror proxy
------------------------------------------------

Take an incoming request from the mirror proxy and relay it to the backend without blocking. It can apply rewrite rules to headers and path as required.

Usage: Simple App
------------------

A sample app `app.py` is given as an example of how to use the mirror plane. The python script looks like::


``` 
    import os
    import respond_and_relay
    
    BACKEND = os.environ["BACKEND"]
    
    def pre(path, request_params):
      """ modify the request_params in place before sending to backend
      """
      print("-- original request\n%s" % request_params)
      request_params['headers']["injected-header"] = "1"
      request_params['url'] = "%s/%s" % (BACKEND, path)
      print("-- new request\n%s" % request_params)
    
    
    def post(content, status, headers):
      """ inspect backend response
      """
      print("-- backend response\n%s %s %s" % (status, headers, len(content)))
      
    
    app = respond_and_relay.create_relay_app(pre, post)
    
    if __name__ == "__main__":
        app.run(debug=1, port=5001)
``` 

where create_relay_app returns a flask app that uses the pre and post functions to handle the incoming request and relayed request/responses.

Steps to run the simple_app:


- Modify pre and post functions in the mirror_plane/simple_app.py file.

- Run the test-backend:

    $  python sample_backend/app.py

- Run the mirror_plane:

    $ BACKEND="http://localhost:8080" python mirror_plane/simple_app.py

- Make a request:

    $ curl http://localhost:5001/ping

You will see the incoming request and response, followed by the relayed request to the backend with modified headers.
