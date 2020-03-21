# Copyright 2019 Google Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#            http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
"""
`report.py`
Report utilities.
"""

import logging
from dataclasses import dataclass, asdict, fields
from slo_generator import utils

LOGGER = logging.getLogger(__name__)


@dataclass(init=False)
class SLOReport:
    """SLO report dataclass. Compute an SLO report out of an SLO config and an
    Error Budget Policy step.

    Args:
        config (dict): SLO configuration.
        step (dict): Error budget policy step configuration.
        timestamp (int): Timestamp.
        client (obj): Existing backend client.
        delete (bool): Backend delete action.
    """
    # pylint: disable=too-many-instance-attributes

    # SLO
    service_name: str
    feature_name: str
    slo_name: str
    slo_target: float
    slo_description: str
    sli_measurement: float = 0
    bad_events_count: int = 0
    good_events_count: int = 0
    gap: float

    # Error budget
    error_budget_policy_step_name: str
    error_budget_target: float
    error_budget_measurement: float
    error_budget_burn_rate: float
    error_budget_minutes: float
    error_budget_remaining_minutes: float
    error_minutes: float

    # Error Budget step config
    timestamp: int
    timestamp_human: str
    window: int
    alert: bool
    alerting_burn_rate_threshold: float
    consequence_message: str

    def __init__(self, config, step, timestamp, client=None, delete=False):

        # Init dataclass fields from SLO config and Error Budget Policy
        self.__set_fields(**config,
                          **step,
                          lambdas={
                              'slo_target': float,
                              'alerting_burn_rate_threshold': int
                          })

        # Set other fields
        self.window = int(step['measurement_window_seconds'])
        self.timestamp = int(timestamp)
        self.timestamp_human = utils.get_human_time(timestamp)

        # Get backend results
        result = self.run_backend(config, client=client, delete=delete)
        if result:
            self.build(step, result)

    def build(self, step, result):
        """Compute all data necessary for the SLO report.

        Args:
            step (dict): Error Budget Policy step configuration.
            result (obj): Backend result.

        See https://landing.google.com/sre/workbook/chapters/implementing-slos/
        for details on the calculations.
        """
        info = self.__get_info()
        LOGGER.debug(f"{info} | SLO report starting ...")

        # SLI, Good count, Bad count, Gap from backend results
        sli, good_count, bad_count = self.get_sli(result)
        gap = sli - self.slo_target

        # Error Budget calculations
        eb_target = 1 - self.slo_target
        eb_value = 1 - sli
        eb_remaining_minutes = self.window * gap / 60
        eb_target_minutes = self.window * eb_target / 60
        eb_minutes = self.window * eb_value / 60
        if eb_target == 0:
            eb_burn_rate = 0
        else:
            eb_burn_rate = round(eb_value / eb_target, 1)

        # Alert boolean on burn rate excessive speed.
        alert = eb_burn_rate > self.alerting_burn_rate_threshold

        # Manage alerting message.
        if alert:
            consequence_message = step['overburned_consequence_message']
        elif eb_burn_rate <= 1:
            consequence_message = step['achieved_consequence_message']
        else:
            consequence_message = \
                'Missed for this measurement window, but not enough to alert'

        # Set fields in dataclass.
        self.__set_fields(sli_measurement=sli,
                          good_events_count=good_count,
                          bad_events_count=bad_count,
                          gap=gap,
                          error_budget_target=eb_target,
                          error_budget_measurement=eb_value,
                          error_budget_burn_rate=eb_burn_rate,
                          error_budget_remaining_minutes=eb_remaining_minutes,
                          error_budget_minutes=eb_target_minutes,
                          error_minutes=eb_minutes,
                          alert=alert,
                          consequence_message=consequence_message)

    def run_backend(self, config, client=None, delete=False):
        """Get appropriate backend method from SLO configuration and run it on
        current SLO config and Error Budget Policy step.

        Args:
            config (dict): SLO configuration.
            client (obj, optional): Backend client initiated beforehand.
            delete (bool, optional): Set to True if we're running a delete
                action.

        Returns:
            obj: Backend result.
        """
        info = self.__get_info()

        # Grab backend class and method dynamically.
        cfg = config.get('backend', {})
        cls = cfg.get('class')
        method = cfg.get('method')
        excluded_keys = ['class', 'method', 'measurement']
        backend_cfg = {k: v for k, v in cfg.items() if k not in excluded_keys}
        instance = utils.get_backend_cls(cls)(client=client, **backend_cfg)
        method = getattr(instance, method)
        LOGGER.debug(f'{info} | '
                     f'Using backend {cls}.{method.__name__} (from '
                     f'SLO config file).')

        # Delete mode activation.
        if delete and hasattr(instance, 'delete'):
            method = instance.delete
            LOGGER.warning(f'{info} | Delete mode enabled.')

        # Run backend method and return results.
        result = method(self.timestamp, self.window, config)
        LOGGER.debug(f'{info} | Backend results: {result}')
        return result

    def get_sli(self, result):
        """Compute SLI value and good / bad counts from the backend result.

        Some backends (e.g: Prometheus) are computing and returning the SLI
        value directly, others are sending a tuple (good_count, bad_count) and
        SLI value is computed from there.

        Args:
            result (obj): Backend result.

        Returns:
            tuple: A tuple of 3 values to unpack (float, int, int).
                float: SLI value.
                int: Good events count.
                int: Bad events count.

        Raises:
            Exception: When the backend does not return a proper result.
        """
        info = self.__get_info()
        if isinstance(result, tuple):
            good_count, bad_count = result
            LOGGER.debug(f"{info} | Good: {good_count} | Bad: {bad_count}")
            if (good_count + bad_count) == 0:
                LOGGER.error(f"{info} | No events found.")
                return 0, 0, 0
            sli_measurement = round(good_count / (good_count + bad_count), 6)

        elif isinstance(result, (float, int)):
            good_count, bad_count = 0, 0
            sli_measurement = round(result, 6)

        else:
            msg = "Backend did not return any valid results."
            LOGGER.error(msg)
            LOGGER.debug(f'Backend result: {result}')
            raise Exception(msg)

        return sli_measurement, good_count, bad_count

    def to_json(self):
        """Serialize dataclass to JSON."""
        return asdict(self)

    def is_empty(self):
        """Return True if report is empty (SLI = 0 or sum of good / bad count
        is null)."""
        return self.sli_measurement == 0

    def __set_fields(self, lambdas={}, **kwargs):
        """Set all fields in dataclasses from configs passed and apply function
        on values whose key match one in the dictionaries.

        Args:
            lambdas (dict): Dict {key: function} to apply a function on certain
            kwargs (dict): Dict of key / values to set in dataclass.
        """
        names = set(f.name for f in fields(self))
        for name in names:
            if name not in kwargs:
                continue
            value = kwargs[name]
            if name in lambdas.keys():
                value = lambdas[name](value)
            setattr(self, name, value)

    def __get_info(self):
        """Get info message describing current SLO andcurrent Error Budget Step.
        """
        slo_full_name = self.__get_slo_full_name()
        step_name = self.error_budget_policy_step_name
        return f"{slo_full_name :<32} | {step_name :<8}"

    def __get_slo_full_name(self):
        """Compile full SLO name from SLO configuration.

        Returns:
            str: Full SLO name.
        """
        return f'{self.service_name}/{self.feature_name}/{self.slo_name}'

    def __str__(self):
        report = self.to_json()
        info = self.__get_info()
        slo_target_per = self.slo_target * 100
        sli_per = round(self.sli_measurement * 100, 6)
        gap = round(self.gap * 100, 2)
        gap_str = str(gap)
        if gap >= 0:
            gap_str = f'+{gap}'
        sli_str = (f'SLI: {sli_per:<7} % | SLO: {slo_target_per} % | '
                   f'Gap: {gap_str:<6}%')
        result_str = (
            "BR: {error_budget_burn_rate:<2} / "
            "{alerting_burn_rate_threshold} | "
            "Alert: {alert} | Timestamp: {timestamp}").format_map(report)
        return f'{info} | {sli_str} | {result_str}'
