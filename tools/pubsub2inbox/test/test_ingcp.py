#   Copyright 2021 Google LLC
#
#   Licensed under the Apache License, Version 2.0 (the "License");
#   you may not use this file except in compliance with the License.
#   You may obtain a copy of the License at
#
#       http://www.apache.org/licenses/LICENSE-2.0
#
#   Unless required by applicable law or agreed to in writing, software
#   distributed under the License is distributed on an "AS IS" BASIS,
#   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#   See the License for the specific language governing permissions and
#   limitations under the License.
import tftest
import os
import tempfile
import base64
from contextlib import redirect_stdout
from .helpers import fixture_to_pubsub, load_config
import unittest
import logging
import main
import io
from datetime import datetime


class TestIngcp(unittest.TestCase):

    def test_in_gcp(self):
        ALL_TESTS = ['bigquery', 'gcs', 'cai']
        logger = logging.getLogger('test')
        logger.setLevel(logging.DEBUG)

        tf_vars = {
            'project_id':
                os.getenv('PROJECT_ID')
                if os.getenv('PROJECT_ID') else os.getenv('GOOGLE_PROJECT_ID')
        }
        if not tf_vars['project_id'] or tf_vars['project_id'] == '':
            self.skipTest(
                'No PROJECT_ID or GOOGLE_PROJECT_ID environment variable set.')

        tf = tftest.TerraformTest('test/fixtures/gcp')
        tf.setup()
        tfapply = tf.apply(output=True, tf_vars=tf_vars)
        logger.debug('Apply output: %s' % (tfapply))

        tfout = tf.output()
        try:
            params = {}
            sa_key = tempfile.NamedTemporaryFile()
            for k, v in tfout.items():
                if k != 'sa_key':
                    params['%%{%s}' % k.upper()] = v['value']
                else:
                    sa_key.write(base64.b64decode(v['value'].encode()))
                    sa_key.flush()

            os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = sa_key.name

            for test in ALL_TESTS:
                config = load_config(test, params)
                data, context = fixture_to_pubsub(test)
                context.timestamp = datetime.utcnow().strftime(
                    '%Y-%m-%dT%H:%M:%S.%fZ')

                buf = io.StringIO()
                with redirect_stdout(buf):
                    main.decode_and_process(logger, config, data, context)

        except Exception as e:
            tfdestroy = tf.destroy(output=True, tf_vars=tf_vars)
            logger.debug('Destroy output: %s' % (tfdestroy))
            raise (e)


if __name__ == '__main__':
    unittest.main()
