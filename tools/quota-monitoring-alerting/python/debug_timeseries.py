""""Debug timeseries."""

import sys

from src.common.lib import monitoring_lib
from src.common.lib import projects_lib
from src.quota.helpers import quota_helper


def _print_results(metrics, title):
    print('\n%s\n....................................................' % title)
    for metric in metrics:
        print(
            metric.get('resource.location') or metric.get('resource_location'),
            '--',
            metric.get('metric.quota_metric') or
            metric.get('metric_quota_metric'), '--',
            metric.get('metric.limit_name') or metric.get('metric_limit_name'),
            '--', metric.get('endTime'), '--',
            metric.get('metric_values') or metric.get('consumption_percentage'))


def rate_usage(project, metric_quota_metric):
    mql = """
    fetch consumer_quota
    | filter resource.service =~ '.*'
    | {rate_usage:
      metric serviceruntime.googleapis.com/quota/rate/net_usage
      | filter resource.project_id = '%s'
      | filter re_partial_match(metric.quota_metric, '%s')
      %s
      %s
      ;
      limit:
      metric serviceruntime.googleapis.com/quota/limit
      | filter resource.project_id = '%s'
      | filter re_partial_match(metric.quota_metric, '%s')
      %s
      %s
      }
    | join
    """
    group_by = """
    | group_by [resource.service, resource.project_id,
                resource.location, metric.quota_metric]
    """

    print('\n################################################################')
    aligners = (
        # Returns one point with sum of points
        ('| window(1d)', group_by, 'rate_usage sum'),
        # Returns the last point
        ('| align next_older(1d)', group_by, 'rate_usage latest'),
        # Returns all actual points
        ('| within(1d)', group_by, 'rate_usage all points'),
    )
    for aligner, group_by, title in aligners:
        query = mql % (project.id, metric_quota_metric, aligner, group_by,
                       project.id, metric_quota_metric, aligner, group_by)
        metrics = monitoring_lib.query_timeseries_mql(project.id, query)
        _print_results(metrics, title)

    # Error: Query with unaligned output must have a duration
    # query = mql % (project_id, metric_quota_metric, '', '')
    # _print_results(project_id, query, 'rate_usage unaligned')


def allocation_usage(project, metric_quota_metric):
    mql = """
    fetch consumer_quota
    | filter resource.service =~ '.*'
    | {allocation_usage:
      metric serviceruntime.googleapis.com/quota/allocation/usage
      | filter resource.project_id = '%s'
      | filter re_partial_match(metric.quota_metric, '%s')
      %s
      %s
      ;
      limit:
      metric serviceruntime.googleapis.com/quota/limit
      | filter resource.project_id = '%s'
      | filter re_partial_match(metric.quota_metric, '%s')
      %s
      %s
      }
    | join
    """
    group_by = """
    | group_by [resource.service, resource.project_id,
                resource.location, metric.quota_metric]
    """

    print('\n################################################################')
    aligners = (
        # Returns one point with sum of points
        ('| window(1d)', group_by, 'allocation_usage sum'),
        # Returns the last point
        ('| align next_older(1d)', group_by, 'allocation_usage latest'),
        # Returns all actual points
        ('| within(1d)', group_by, 'allocation_usage all points'),
    )
    for aligner, group_by, title in aligners:
        query = mql % (project.id, metric_quota_metric, aligner, group_by,
                       project.id, metric_quota_metric, aligner, group_by)
        metrics = monitoring_lib.query_timeseries_mql(project.id, query)
        _print_results(metrics, title)

    # Error: Query with unaligned output must have a duration
    # query = mql % (project_id, metric_quota_metric, '', '')
    # _print_results(project_id, query, 'rate_usage unaligned')


def limits(project, metric_quota_metric):
    mql = """
    fetch consumer_quota
    | filter resource.service =~ '.*'
    | {limit:
      metric serviceruntime.googleapis.com/quota/limit
      | filter resource.project_id = '%s'
      | filter re_partial_match(metric.quota_metric, '%s')
      %s
      %s
    }
    """
    group_by = """
    | group_by [resource.service, resource.project_id,
                resource.location, metric.quota_metric, metric.limit_name]
    """

    print('\n################################################################')
    aligners = (
        # Returns one point with sum of points
        ('| window(1d)', group_by, 'limit sum'),
        # Returns the last point
        ('| align next_older(1d)', group_by, 'limit latest'),
        # Returns all actual points
        ('| within(1d)', group_by, 'limit all points'),
    )
    for aligner, group_by, title in aligners:
        query = mql % (project.id, metric_quota_metric, aligner, group_by)
        metrics = monitoring_lib.query_timeseries_mql(project.id, query)
        _print_results(metrics, title)


def consumption(project, metric_quota_metric):
    print('\n################################################################')
    metrics = quota_helper.mql_single(project, metric_quota_metric)
    _print_results(metrics, 'consumption')

    # Error: Query with unaligned output must have a duration
    # query = mql % (project_id, metric_quota_metric, '', '')
    # _print_results(project_id, query, 'rate_usage unaligned')


def threshold(project, metric_quota_metric, value):
    print('\n################################################################')
    metrics = quota_helper.mql_thresholds_single(project, metric_quota_metric,
                                                 value)
    _print_results(metrics, 'above threshold')

    # Error: Query with unaligned output must have a duration
    # query = mql % (project_id, metric_quota_metric, '', '')
    # _print_results(project_id, query, 'rate_usage unaligned')


if __name__ == '__main__':
    project_id, quota_metric, threshold_value = sys.argv[1:4]
    prj = projects_lib.get(project_id)
    limits(prj, quota_metric)
    allocation_usage(prj, quota_metric)
    rate_usage(prj, quota_metric)
    consumption(prj, quota_metric)
    threshold(prj, quota_metric, threshold_value)
