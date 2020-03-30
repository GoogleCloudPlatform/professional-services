"""Set up credentials (.env) and application variables (config.yml)"""
import os
import yaml


class Config(object):
    """All configuration for this app is loaded here"""

    def __init__(self, **opts):
        if os.environ.get('ENV') != 'prod':  # We are not in Heroku
            self.init_environment()

        """Allow variables assigned in config.yml available the following variables
           via properties"""
        self.path = opts.get(
            'path', os.path.abspath(os.path.dirname(__file__))
        )
        with open('{0}/config.yml'.format(self.path)) as stream:
            config = yaml.load(stream)
            self._debug_mode = config['debug_mode']
            self._endpoint = config['endpoint']
            self._host = config['host']
            self._keys = config['keys']
            self._port = config['port']

    @staticmethod
    def init_environment():
        """Allow variables assigned in .env available using
           os.environ.get('VAR_NAME')"""
        base_path = os.path.abspath(os.path.dirname(__file__))
        env_path = '{0}/.env'.format(base_path)
        if os.path.exists(env_path):
            with open(env_path) as f:
                lines = f.readlines()
                for line in lines:
                    var = line.strip().split('=')
                    if len(var) == 2:
                        os.environ[var[0]] = var[1]

    @property
    def debug_mode(self):
        """Flask debug mode - set to False in production."""
        return self._debug_mode

    @property
    def endpoint(self):
        """Endpoint to receive Inbound Parse POSTs."""
        return self._endpoint

    @property
    def host(self):
        """URL that the sender will POST to."""
        return self._host

    @property
    def keys(self):
        """Incoming Parse fields to parse. For reference, see
        https://sendgrid.com/docs/Classroom/Basics/Inbound_Parse_Webhook/setting_up_the_inbound_parse_webhook.html
        """
        return self._keys

    @property
    def port(self):
        """Port to listen on."""
        return self._port
