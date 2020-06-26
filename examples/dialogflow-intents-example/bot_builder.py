# ==============================================================================
# Copyright 2020 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
# http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
# ==============================================================================

r"""Tool to automatically build DF bots.

Expects an input CSV with 3 columns (training_phrase, intent_name, intent_id).
Constructs a nested directory structure which can be zipped to make a agent.zip
which would correspond to the output if you exported a V2 Dialogflow agent.

Example usage:

python bot_builder.py --root_dir=bike_shop_bot_dir --bot_name=BikeShopBot < BikeShopBotTrain.csv

"""

from __future__ import absolute_import
from __future__ import division
from __future__ import print_function

import csv
import os
import sys

from absl import app
from absl import flags
from absl import logging

import df_bot

flags.DEFINE_string("root_dir", "", "Root directory for bot export.")
flags.DEFINE_string("bot_name", "", "Name of dialogflow bot.")

FLAGS = flags.FLAGS


def main(argv):
  if len(argv) > 1:
    raise app.UsageError("Too many command-line arguments.")

  if not FLAGS.root_dir:
    logging.fatal("Please specify --root_dir")

  if not FLAGS.bot_name:
    logging.fatal("Please specify --bot_name")

  os.makedirs(FLAGS.root_dir)
  bot = df_bot.DFBot(FLAGS.bot_name)
  print("reading bot csv (training_phrase, intent_name, intent_id) from stdin")
  intent_map = {}
  for content, intent, _ in csv.reader(sys.stdin):
    if intent not in intent_map:
      intent_map[intent] = []
    intent_map[intent].append(content)

  for intent, examples in intent_map.items():
    bot.AddIntent(intent, examples)

  bot.Build(FLAGS.root_dir)
  print("wrote bot to {}".format(FLAGS.root_dir))


if __name__ == "__main__":
  app.run(main)
