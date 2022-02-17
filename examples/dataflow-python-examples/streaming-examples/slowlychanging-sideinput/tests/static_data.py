# Copyright 2020 Google Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import json
import os
import random
from typing import Any, Dict, Iterable, List, Tuple

import apache_beam as beam
from apache_beam.transforms import window


@beam.typehints.with_input_types(str)
@beam.typehints.with_output_types(Iterable[Dict[str, Any]])
class ReadStaticSideInput(beam.PTransform):
    """Helper Dofn function that generates static side input data and can be used in to validate the functionality
       instead of reading side input data from persistent storage such as GCS/LocalFileSystem

       Attributes:
         products: Static list  of products that matches with product names from the main input
    """

    def __init__(self, coder=None):
        self.products: List[str] = [
            "Product 2", "Product 2 XL", "Product 3", "Product 3 XL",
            "Product 4", "Product 4 XL", "Product 5", "Product 5 XL"
        ]

    #print("I am in ReadStaticSideInput")

    def _get_lookup_values(self,
                           sideinput_filepath: str) -> List[Dict[str, Any]]:
        """Creates static lookup values based on side input type

         Args:
             sideinput_filepath: Side input file path with leaf name representing side input type

         Returns:
            List of look up values
         """

        sideinput_type = os.path.basename(os.path.dirname(sideinput_filepath))
        if sideinput_type == "bonuspoints":
            lookup_values = [122, 245, 332, 564, 341, 654, 109, 265]
        elif sideinput_type == "discountpct":
            lookup_values = [0.23, 0.56, 0.17, 0.15, 0.06, 0.28, 0.32, 0.18]
        else:
            lookup_values = [
                "tables", "chairs", "couch", "shoes", "electronics", "mobile",
                "printer", "laptop"
            ]

        return [{
            "productname": product,
            sideinput_type: lookup_values[index]
        } for index, product in enumerate(self.products)]

    def expand(self, pcol):
        """Fetch files based on the file pattern, read the contents from matching files

        Args:
         pcol: PCollection containing list of file patterns

        Returns:
         PCollection of type Json objects that represents data read from the files
        """
        # yapf: disable
        return (pcol
                | "Static Side Input Values" >> beam.FlatMap(self._get_lookup_values)
               )
        # yapf: enable


def get_events() -> List[Dict]:
    """Represents set of sales events"""
    return [{
        "Txid": 1,
        "productname": "Product 2",
        "qty": 2,
        "sales": 489.5
    }, {
        "Txid": 2,
        "productname": "Product 3 XL",
        "qty": 2,
        "sales": 411.8
    }, {
        "Txid": 3,
        "productname": "Product 4",
        "qty": 2,
        "sales": 56.15
    }, {
        "Txid": 4,
        "productname": "Product 4 XL",
        "qty": 5,
        "sales": 197.7
    }, {
        "Txid": 5,
        "productname": "Product 3",
        "qty": 7,
        "sales": 222.3
    }]


def get_maininput_events() -> List[bytes]:
    """Returns sales events encoded as bytes"""
    return list(map(lambda x: json.dumps(x).encode(), get_events()))


def get_expected_enriched_events() -> List[Dict]:
    """Returns enriched sales events with appropriate  look up values"""
    return [{
        'Txid': 1,
        'productname': 'Product 2',
        'qty': 2,
        'sales': 489.5,
        'bonuspoints': 122,
        'discountpct': 0.23,
        'category': 'tables'
    }, {
        'Txid': 2,
        'productname': 'Product 3 XL',
        'qty': 2,
        'sales': 411.8,
        'bonuspoints': 564,
        'discountpct': 0.15,
        'category': 'shoes'
    }, {
        'Txid': 3,
        'productname': "Product 4",
        "qty": 2,
        "sales": 56.15,
        'bonuspoints': 341,
        'discountpct': 0.06,
        'category': 'electronics'
    }, {
        'Txid': 4,
        'productname': "Product 4 XL",
        "qty": 5,
        "sales": 197.7,
        'bonuspoints': 654,
        'discountpct': 0.28,
        'category': 'mobile'
    }, {
        'Txid': 5,
        'productname': "Product 3",
        "qty": 7,
        "sales": 222.3,
        'bonuspoints': 332,
        'discountpct': 0.17,
        'category': 'couch'
    }]


def get_windowedevents(
    window_intervals: Tuple[window.IntervalWindow, window.IntervalWindow]
) -> List[window.TimestampedValue]:
    """Split the total events into 2 windows (1st window contains 2 events and second window with 3 events) and
       attach the timestamp to the elements withing that range.

    Args:
     window_intervals: Two sample intervals to distribute events

    Returns:
        List of Timestamped events distributed between two window intervals
    """
    events = get_maininput_events()
    windowed_events = []
    event_startindex = 0

    for window_interval, event_endindex in zip(window_intervals,
                                               (2, len(events))):
        windowed_events.extend([
            beam.window.TimestampedValue(
                event,
                random.randrange(window_interval.start, window_interval.end))
            for event in events[event_startindex:event_endindex]
        ])
        event_startindex = event_endindex

    return windowed_events


def get_expected_enriched_windowevents(
        window_intervals: Tuple[window.IntervalWindow, window.IntervalWindow]):
    """Split the enriched events into 2 windows (1st window contains 2 events and second window with 3 events)

    Args:
     window_intervals: Two sample intervals to distribute events

    Returns:
        List of enriched events distributed between two window intervals
    """
    events = get_expected_enriched_events()
    windowed_enriched_events = {}
    event_startindex = 0

    for window_interval, event_endindex in zip(window_intervals,
                                               (2, len(events))):
        windowed_enriched_events[window_interval] = [
            events[event_startindex:event_endindex]
        ]
        event_startindex = event_endindex

    return windowed_enriched_events
