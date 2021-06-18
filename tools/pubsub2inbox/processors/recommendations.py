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
from .base import Processor, NotConfiguredException
import json
import re
from google.cloud.functions.context import Context
from google.cloud.recommender_v1.services.recommender import RecommenderClient
from google.cloud.recommender_v1.types.recommendation import Recommendation
from google.cloud.recommender_v1.types.insight import Insight
from google.cloud.recommender_v1.types.recommender_service import ListInsightsRequest
from googleapiclient import discovery, http
from google.api_core.gapic_v1 import client_info as grpc_client_info
import google_auth_httplib2
import google.auth
import fnmatch


class UnknownRecommenderException(Exception):
    pass


class RecommendationsProcessor(Processor):
    multi_regions = ['global', 'us', 'europe', 'asia']
    recommenders = {}
    insights = {}

    def __init__(self, config, jinja_environment, data, event,
                 context: Context):
        self.recommenders = {
            'google.compute.instance.MachineTypeRecommender': {
                'location': [self.is_zone],
                'parent': [self.is_project]
            },
            'google.compute.instanceGroupManager.MachineTypeRecommender': {
                'location': [self.is_region, self.is_zone],
                'parent': [self.is_project]
            },
            'google.compute.instance.IdleResourceRecommender': {
                'location': [self.is_zone],
                'parent': [self.is_project]
            },
            'google.compute.disk.IdleResourceRecommender': {
                'location': [self.is_region, self.is_zone],
                'parent': [self.is_project]
            },
            'google.compute.address.IdleResourceRecommender': {
                'location': [self.is_global, self.is_region],
                'parent': [self.is_project]
            },
            'google.compute.image.IdleResourceRecommender': {
                'location': [self.is_multi_region, self.is_region],
                'parent': [self.is_project]
            },
            'google.compute.commitment.UsageCommitmentRecommender': {
                'location': [self.is_region],
                'parent': [self.is_project, self.is_billing_account]
            },
            'google.logging.productSuggestion.ContainerRecommender': {
                'location': [],
                'parent': [],
            },  # Not supported by API currently
            'google.monitoring.productSuggestion.ComputeRecommender': {
                'location': [],
                'parent': [],
            },  # Not supported by API currently
            'google.accounts.security.SecurityKeyRecommender': {
                'location': [],
                'parent': [],
            },  # Not supported by API currently
        }
        self.insights = {
            'google.compute.firewall.Insight': {
                'location': [self.is_global],
                'parent': [self.is_project]
            },
            'google.iam.policy.Insight': {
                'location': [self.is_global],
                'parent': [
                    self.is_organization, self.is_folder, self.is_project
                ]
            },
            'google.iam.serviceAccount.Insight': {
                'location': [self.is_global],
                'parent': [self.is_project]
            }
        }
        super().__init__(config, jinja_environment, data, event, context)

    def get_regions(self, compute_service, project_id, location_filters):
        """Fetches all regions for a project"""
        region_request = compute_service.regions().list(project=project_id)
        regions = []
        while region_request is not None:
            region_response = region_request.execute()
            for region in region_response['items']:
                for region_filter in location_filters:
                    if fnmatch.fnmatch(region['name'], region_filter):
                        regions.append(region['name'])
                        break

            region_request = compute_service.regions().list_next(
                previous_request=region_request,
                previous_response=region_response)

        for multi_region in self.multi_regions:
            for region_filter in location_filters:
                if fnmatch.fnmatch(multi_region, region_filter):
                    regions.append(multi_region)
                    break
        return regions

    def is_project(self, parent):
        return parent.startswith('projects/')

    def is_folder(self, parent):
        return parent.startswith('folders/')

    def is_organization(self, parent):
        return parent.startswith('organizations/')

    def is_billing_account(self, parent):
        return parent.startswith('billingAccounts/')

    def is_global(self, region):
        return True if region == 'global' else False

    def is_multi_region(self, region):
        return True if region in self.multi_regions else False

    def is_region(self, region):
        return True if re.search("\d+$", region) else False

    def is_zone(self, zone):
        return True if re.search("\d+-[a-z]$", zone) else False

    def get_link(self, parent):
        if parent[0].startswith('projects/'):
            return 'project=%s' % (parent[1][1])
        if parent[0].startswith('organizations/'):
            return 'organization=%s' % (parent[0].split("/")[-1:])
        if parent[0].startswith('folders/'):
            return 'folder=%s' % (parent[0].split("/")[-1:])
        return ''

    def get_zones(self, compute_service, project_id, location_filters):
        """Fetches all zones for a project"""
        # Fetch zones and filter
        zone_request = compute_service.zones().list(project=project_id)
        # Add multiregional locations
        zones = []
        while zone_request is not None:
            zone_response = zone_request.execute()
            for zone in zone_response['items']:
                for zone_filter in location_filters:
                    if fnmatch.fnmatch(zone['name'], zone_filter):
                        zones.append(zone['name'])
                        break
            zone_request = compute_service.zones().list_next(
                previous_request=zone_request, previous_response=zone_response)

        # Make sure we have unique values only
        zones = list(set(zones))
        return zones

    def get_recommendations(self, client, recommender_types, parents,
                            all_locations, filter):
        """Fetches recommendations with specified recommender types from applicable locations"""
        recommendations = {}
        for parent in parents:
            recommendations[parent[0]] = []
            for location in all_locations:
                for recommender_type in recommender_types:
                    ok_parent = False
                    for test in self.recommenders[recommender_type]['parent']:
                        if test(parent[0]):
                            ok_parent = True
                            break
                    if not ok_parent:
                        continue

                    ok_location = False
                    for test in self.recommenders[recommender_type]['location']:
                        if test(location):
                            ok_location = True
                            break
                    if not ok_location:
                        continue

                    full_parent = '%s/locations/%s/recommenders/%s' % (
                        parent[0], location, recommender_type)
                    self.logger.debug('Fetching recommendations...',
                                      extra={
                                          'type': parent[0].split('/')[0],
                                          'parent': full_parent,
                                          'location': location,
                                          'recommender': recommender_type
                                      })
                    rec_response = client.list_recommendations(
                        parent=full_parent, filter=filter)
                    for recommendation in rec_response:
                        _rec = {
                            'type':
                                parent[0].split('/')[0],
                            'parent':
                                parent[1],
                            'link':
                                self.get_link(parent),
                            'location':
                                location,
                            'recommender_type':
                                recommender_type,
                            'recommendation':
                                Recommendation.to_dict(recommendation),
                        }
                        recommendations[parent[0]].append(_rec)
        return recommendations

    def get_insights(self, client, insight_types, parents, all_locations,
                     filter):
        """Fetches insights with specified insight types from applicable locations"""
        insights = {}
        for parent in parents:
            insights[parent[0]] = []
            for location in all_locations:
                for insight_type in insight_types:
                    ok_parent = False
                    for test in self.insights[insight_type]['parent']:
                        if test(parent[0]):
                            ok_parent = True
                            break
                    if not ok_parent:
                        continue

                    ok_location = False
                    for test in self.insights[insight_type]['location']:
                        if test(location):
                            ok_location = True
                            break
                    if not ok_location:
                        continue

                    full_parent = '%s/locations/%s/insightTypes/%s' % (
                        parent[0], location, insight_type)
                    self.logger.debug('Fetching insights...',
                                      extra={
                                          'type': parent[0].split('/')[0],
                                          'parent': full_parent,
                                          'location': location,
                                          'insight_type': insight_type
                                      })
                    insights_request = ListInsightsRequest(parent=full_parent,
                                                           filter=filter)
                    insights_response = client.list_insights(
                        request=insights_request)
                    for insight in insights_response:
                        _insight = {
                            'type': parent[0].split('/')[0],
                            'parent': parent[1],
                            'link': self.get_link(parent),
                            'location': location,
                            'insight_type': insight_type,
                            'insight': Insight.to_dict(insight),
                        }
                        insights[parent[0]].append(_insight)
        return insights

    def rollup_recommendations(self, recommendations):
        recommendations_rollup = {}
        for parent, recs in recommendations.items():
            if parent not in recommendations_rollup:
                recommendations_rollup[parent] = {}
            for _rec in recs:
                rec = _rec['recommendation']
                if 'primary_impact' in rec and 'recommender_subtype' in rec:
                    sub_type = rec['recommender_subtype']
                    if 'cost_projection' in rec['primary_impact']:
                        cost_projection = rec['primary_impact'][
                            'cost_projection']['cost']
                        if sub_type not in recommendations_rollup[parent]:
                            recommendations_rollup[parent][sub_type] = {
                                'link': _rec['link'],
                                'parent': _rec['parent'],
                                'type': _rec['type'],
                                'count': 0,
                                'cost': {
                                    'currency_code': '',
                                    'nanos': 0,
                                    'units': 0
                                }
                            }
                        recommendations_rollup[parent][sub_type]['count'] += 1
                        recommendations_rollup[parent][sub_type]['cost'][
                            'currency_code'] = cost_projection['currency_code']
                        recommendations_rollup[parent][sub_type]['cost'][
                            'nanos'] += int(cost_projection['nanos'])
                        recommendations_rollup[parent][sub_type]['cost'][
                            'units'] += int(cost_projection['units'])

        return recommendations_rollup

    def rollup_insights(self, insights):
        insights_rollup = {}
        for parent, _insights in insights.items():
            if parent not in insights_rollup:
                insights_rollup[parent] = {}
            for _insight in _insights:
                insight = _insight['insight']
                if 'insight_subtype' in insight:
                    sub_type = insight['insight_subtype']
                    if sub_type not in insights_rollup[parent]:
                        insights_rollup[parent][sub_type] = {
                            'link': _insight['link'],
                            'parent': _insight['parent'],
                            'type': _insight['type'],
                            'count': 0,
                        }
                    insights_rollup[parent][sub_type]['count'] += 1
        return insights_rollup

    def process(self):
        if 'recommendations' not in self.config:
            raise NotConfiguredException(
                'No Recommender configuration specified in config!')

        recommender_config = self.config['recommendations']

        for recommender in recommender_config['recommender_types']:
            if recommender not in self.recommenders:
                raise UnknownRecommenderException(
                    'Unknown recommender %s specified in config!' %
                    (recommender))

        data = json.loads(self.data)
        self.jinja_environment.globals = {
            **self.jinja_environment.globals,
            **data
        }

        projects = []
        if 'projects' in recommender_config:
            projects = self._jinja_var_to_list(recommender_config['projects'],
                                               'projects')
        folders = []
        if 'folders' in recommender_config:
            folders = self._jinja_var_to_list(recommender_config['folders'],
                                              'folders')
        organizations = []
        if 'organizations' in recommender_config:
            organizations = self._jinja_var_to_list(
                recommender_config['organizations'], 'organizations')
        billing_accounts = []
        if 'billingAccounts' in recommender_config:
            billing_accounts = self._jinja_var_to_list(
                recommender_config['billingAccounts'], 'billing_accounts')

        if len(projects) == 0 and len(folders) == 0 and len(
                organizations) == 0 and len(billing_accounts) == 0:
            raise NotConfiguredException(
                'No projects, organizations, folders or billing accounts specified in config!'
            )

        location_filters = self._jinja_var_to_list(
            recommender_config['locations'], 'locations')
        if len(location_filters) == 0:
            raise NotConfiguredException(
                'No location filters specified in config!')

        client_info = grpc_client_info.ClientInfo(
            user_agent='google-pso-tool/pubsub2inbox/1.1.0')
        client = RecommenderClient(client_info=client_info)

        credentials, project_id = google.auth.default(
            ['https://www.googleapis.com/auth/cloud-platform'])
        branded_http = google_auth_httplib2.AuthorizedHttp(credentials)
        branded_http = http.set_user_agent(
            branded_http, 'google-pso-tool/pubsub2inbox/1.1.0')

        compute_service = discovery.build('compute', 'v1', http=branded_http)
        if len(projects) == 0:
            raise NotConfiguredException(
                'Please specify at least one project to fetch regions and zones.'
            )
        all_zones = self.get_zones(compute_service, projects[0],
                                   location_filters)
        all_regions = self.get_regions(compute_service, projects[0],
                                       location_filters)
        all_locations = all_zones + all_regions
        self.logger.debug('Fetched all available locations.',
                          extra={'locations': all_locations})

        parents = []
        for project in self.expand_projects(projects):
            parents.append(('projects/%s' % project[1], project))
        for organization in organizations:
            parents.append(('organizations/%s' % organization, [organization]))
        for folder in folders:
            parents.append(('folder/%s' % folder, [folder]))
        for billing_account in billing_accounts:
            parents.append(
                ('billingAccounts/%s' % billing_account, [billing_account]))
        self.logger.debug('Determined all parents.', extra={'parents': parents})

        recommendations = {}
        recommendations_rollup = {}
        if 'fetch_recommendations' in recommender_config:
            fetch_recommendations = self._jinja_expand_bool(
                recommender_config['fetch_recommendations'])
            if fetch_recommendations:
                recommendations = self.get_recommendations(
                    client, recommender_config['recommender_types'], parents,
                    all_locations, recommender_config['recommendation_filter']
                    if 'recommendation_filter' in recommender_config else None)
                recommendations_rollup = self.rollup_recommendations(
                    recommendations)

        insights = {}
        insights_rollup = {}
        if 'fetch_insights' in recommender_config:
            fetch_insights = self._jinja_expand_bool(
                recommender_config['fetch_insights'])
            if fetch_insights:
                insights = self.get_insights(
                    client, recommender_config['insight_types'], parents,
                    all_locations, recommender_config['insight_filter']
                    if 'insight_filter' in recommender_config else None)
                insights_rollup = self.rollup_insights(insights)

        self.logger.debug('Fetching recommendations and/or insights finished.')
        _ret = {
            'recommendations': recommendations,
            'recommendations_rollup': recommendations_rollup,
            'insights': insights,
            'insights_rollup': insights_rollup,
        }
        if 'vars' in recommender_config:
            return {**recommender_config['vars'], **_ret}
        return _ret
