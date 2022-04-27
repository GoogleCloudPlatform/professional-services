#!/usr/bin/env python
from google.cloud import pubsub_v1
from threading import Lock, Timer
from tabulate import tabulate
import sys
import argparse
import json

class Poller():
  def __init__(self, argv=None):
    parser = argparse.ArgumentParser(description='Poll and keep track of hash count')
    parser.add_argument('-s', '--subscription',
      help="Fully qualified subscription name")
    self.opts = parser.parse_args(argv)
    self.counters = {}
    self.lock = Lock()
    self.watchdog = None

  def dump(self):
    with self.lock:
      table = [["Filename", "Findings"]]
      for fn in self.counters:
        table.append([fn, self.counters[fn]])
      print(tabulate(table))
      self.counters = {}

  def set_timer(self):
    with self.lock:
      if self.watchdog and self.watchdog.is_alive():
        self.watchdog.cancel()
      self.watchdog = Timer(5, self.dump)
      self.watchdog.start()

  def running_total(self, msg):
    data = json.loads(msg.data)
    filename = data['filename']
    self.set_timer()
    with self.lock:
      print(data)
      if filename not in self.counters:
        self.counters[filename] = 1
      else:
        self.counters[filename] += 1
      msg.ack()

  def run(self):
    subscriber = pubsub_v1.SubscriberClient()
    future = subscriber.subscribe(self.opts.subscription, self.running_total)
    print("Successfully subscribed to {}. Messages will print below...".format(self.opts.subscription))
    try:
      future.result()
    except KeyboardInterrupt:
      future.cancel()

if __name__ == '__main__':
  Poller(sys.argv[1:]).run()
