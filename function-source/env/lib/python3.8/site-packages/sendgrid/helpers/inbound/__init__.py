"""
Inbound Parse helper
--------------------
This is a standalone module to help get you started consuming and processing
Inbound Parse data.  It provides a Flask server to listen for Inbound Parse
POSTS, and utilities to send sample data to the server.

See README.txt for detailed usage instructions, including quick-start guides
for local testing and Heroku deployment.
"""

from .config import *  # noqa
from .parse import *  # noqa
