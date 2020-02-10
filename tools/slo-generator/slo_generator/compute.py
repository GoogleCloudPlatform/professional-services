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
`compute.py`
Compute utilities.
"""

import logging
import time
import pprint
from slo_generator import utils

LOGGER = logging.getLogger(__name__)


def compute(slo_config,
            error_budget_policy,
            timestamp=None,
            client=None,
            do_export=False,
            backend_obj=None,
            backend_method=None,
            backend_config=None):
    """Run pipeline to compute SLO, Error Budget and Burn Rate, and export the
    results (if exporters are specified in the SLO config).

    Args:
        slo_config (dict): SLO configuration.
        error_budget_policy (dict): Error Budget policy configuration.
        timestamp (int, optional): UNIX timestamp. Defaults to now.
        client (obj, optional): Existing metrics backend client.
        do_export (bool, optional): Enable / Disable export. Default: False.
        backend_obj (obj) (optional): Backend object (if unset, will be
            imported dynamically from slo_config). Use when you want to try new
            backends that are not implemented in the backends/ folder.
        backend_method (str) (optional): Backend method (if unset, will be
            imported dynamically from slo_config). Use when you want to try new
            backends that are not implemented in the backends/ folder.
            This must return a tuple (n_good_events[int], n_bad_events[int]).
            The method must take the following arguments:
                - timestamp (int): query timestamp.
                - window (int): query window duration.
        backend_config (dict) (optional): Backend config.
    """
    if timestamp is None:
        timestamp = time.time()

    # Compute SLO, Error Budget, Burn rates and make report
    exporters = slo_config.get('exporters')
    reports = []
    for report in make_reports(slo_config,
                               error_budget_policy,
                               timestamp,
                               client=client,
                               backend_obj=backend_obj,
                               backend_method=backend_method,
                               backend_config=backend_config):
        if not report:
            continue
        reports.append(report)
        if exporters is not None and do_export is True:
            export(report, exporters)
    return reports


def export(data, exporters):
    """Export data using selected exporters.

    Args:
        data (dict): Data to export.
        exporters (list): List of exporter configurations.

    Returns:
        obj: Return values from exporters output.
    """
    LOGGER.debug(f'Exporters: {pprint.pformat(exporters)}')
    LOGGER.debug(f'Data: {pprint.pformat(data)}')
    results = []

    # Passing one exporter as a dict will work for convenience
    if isinstance(exporters, dict):
        exporters = [exporters]

    for config in exporters:
        LOGGER.debug(f'Exporter config: {pprint.pformat(config)}')
        exporter_class = config.get('class')
        LOGGER.info(f'Exporting results to {exporter_class}')
        exporter = utils.get_exporter_cls(exporter_class)()
        ret = exporter.export(data, **config)
        results.append(ret)
        LOGGER.debug(f'Exporter return: {pprint.pformat(ret)}')


def make_reports(slo_config,
                 error_budget_policy,
                 timestamp,
                 client=None,
                 backend_obj=None,
                 backend_method=None,
                 backend_config=None):
    """Run SLO reports for each step in the Error Budget config.

    Args:
        slo_config (dict): SLO configuration.
        error_budget_policy (dict): Error Budget policy.
        timestamp (int): UNIX timestamp.
        client (obj) (optional): Existing metrics backend client.
        backend_obj (obj) (optional): Backend object (if unset, will be
            imported dynamically from slo_config). Use when you want to try new
            backends that are not implemented in the backends/ folder.
        backend_method (str) (optional): Backend method (if unset, will be
            imported dynamically from slo_config). Use when you want to try new
            backends that are not implemented in the backends/ folder.
            This must return a tuple (n_good_events[int], n_bad_events[int]).
            The method must take the following arguments:
                - timestamp (int): query timestamp.
                - window (int): query window duration.
        backend_config (dict) (optional): Backend config.

    Yields:
        list: List of SLO measurement results.
    """
    slo_full_name = get_full_slo_name(slo_config)
    if backend_method:
        if backend_obj:
            backend_method = getattr(backend_obj, backend_method)
        LOGGER.info(
            f'{slo_full_name} | Backend: {backend_method} (from kwargs).')
    else:
        backend_config = slo_config.get('backend', {})
        cls = backend_config.get('class')
        method = backend_config.get('method')
        instance = utils.get_backend_cls(cls)(client=client, **backend_config)
        backend_method = getattr(instance, method)
        LOGGER.info(f'{slo_full_name :<25} | '
                    f'Using backend {cls}.{backend_method.__name__} (from '
                    f'SLO config file).')

    # Loop through steps defined in error budget policy and make measurements
    for step in error_budget_policy:
        backend_result = backend_method(
            timestamp=timestamp,
            window=step['measurement_window_seconds'],
            **slo_config['backend'])
        report = make_measurement(slo_config, step, backend_result, timestamp)
        yield report


def make_measurement(slo_config, step, backend_result, timestamp):
    """Measure following metrics: SLI, SLO, Error Budget, Burn Rate.

    Args:
        slo_config (dict): SLO configuration.
        step (dict): Step config.
        backend_result (tuple or int): A tuple (good_event_count,
            bad_event_count) or the SLI value as a float.
        timestamp (int): UNIX timestamp.

    Returns:
        dict: Report dictionary.
    """
    slo_full_name = get_full_slo_name(slo_config)
    step_name = step['error_budget_policy_step_name']
    info = f"{slo_full_name :<25} | {step_name :<8}"

    LOGGER.debug(f"{info} | SLO report starting ...")

    # For some backends we are sending the SLI value directly, for others we're
    # sending a tuple (good_event_count, bad_event_count) and we'll compute the
    # SLI from there
    if not isinstance(backend_result, tuple):
        if backend_result == 0:
            LOGGER.error(f"{info} | Null SLI value.")
            return None
        good_event_count, bad_event_count = None, None
        sli = round(backend_result, 6)
    else:
        good_event_count, bad_event_count = backend_result
        if (good_event_count + bad_event_count) == 0:
            LOGGER.error(f"{info} | {step_name} | No events found.")
            return None
        LOGGER.debug(f"{info} Good event count: {good_event_count}")
        LOGGER.debug(f"{info} Bad event count: {bad_event_count}")
        sli = round(good_event_count / (good_event_count + bad_event_count), 6)

    slo_target = float(slo_config['slo_target'])
    window = int(step['measurement_window_seconds'])
    alerting_burn_rate_threshold = int(step['alerting_burn_rate_threshold'])
    overburned_consequence_message = step['overburned_consequence_message']
    achieved_consequence_message = step['achieved_consequence_message']
    step_name = step['error_budget_policy_step_name']
    timestamp_human = utils.get_human_time(timestamp)

    # Compute SLI and gap between SLI / SLO target.
    gap = sli - slo_target

    # Compute Error Budget (target, current value, remaining minutes, available
    # minutes).
    error_budget_target = 1 - slo_target
    error_budget_target = 1 - slo_target
    error_budget_value = 1 - sli
    error_budget_remaining_minutes = window * gap / 60
    error_minutes = window * error_budget_value / 60
    error_budget_minutes = window * error_budget_target / 60

    # Compute Error Budget Burn rate: the % of consumed error budget.
    if error_budget_target == 0:
        error_budget_burn_rate = 0
    else:
        error_budget_burn_rate = round(
            error_budget_value / error_budget_target, 1)

    # Alert boolean on burn rate excessive speed.
    alert = error_budget_burn_rate > alerting_burn_rate_threshold

    # Set consequence message as derived from the Error Budget Policy file.
    if alert:
        consequence_message = overburned_consequence_message
    elif error_budget_burn_rate <= 1:
        consequence_message = achieved_consequence_message
    else:
        consequence_message = (
            'Missed for this measurement window, but not enough to alert')

    # Build out result
    result = {
        'service_name': slo_config['service_name'],
        'feature_name': slo_config['feature_name'],
        'slo_name': slo_config['slo_name'],
        'slo_target': slo_config['slo_target'],
        'slo_description': slo_config['slo_description'],
        'error_budget_policy_step_name': step_name,
        'error_budget_remaining_minutes': error_budget_remaining_minutes,
        'error_budget_minutes': error_budget_minutes,
        'error_minutes': error_minutes,
        'error_budget_target': error_budget_target,
        'timestamp_human': timestamp_human,
        'timestamp': timestamp,
        'consequence_message': consequence_message,
        'window': window,
        'bad_events_count': bad_event_count,
        'good_events_count': good_event_count,
        'sli_measurement': sli,
        'gap': gap,
        'error_budget_measurement': error_budget_value,
        'error_budget_burn_rate': error_budget_burn_rate,
        'alerting_burn_rate_threshold': alerting_burn_rate_threshold,
        'alert': alert
    }
    LOGGER.debug(pprint.pformat(result))
    sli_percent = round(sli * 100, 6)
    LOGGER.info(f"{info} | "
                f"SLI: {sli_percent} % | "
                f"Target: {slo_target * 100} % | "
                f"Burnrate: {error_budget_burn_rate :<2} | "
                f"Target burnrate: {alerting_burn_rate_threshold} | "
                f"Alert: {alert}")
    return result


def get_full_slo_name(slo_config):
    """Compile full SLO name from SLO configuration.

    Args:
        slo_config (dict): SLO configuration.

    Returns:
        str: Full SLO name.
    """
    return "{}/{}/{}".format(slo_config['service_name'],
                             slo_config['feature_name'],
                             slo_config['slo_name'])
