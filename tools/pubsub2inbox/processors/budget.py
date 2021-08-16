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
from .base import Processor
from google.cloud.billing.budgets_v1beta1.services import budget_service
from google.cloud.billing.budgets_v1beta1.types import GetBudgetRequest
import json


class MissingAttributesException(Exception):
    pass


class BudgetProcessor(Processor):

    def _get_budget_service_client(self):
        return budget_service.BudgetServiceClient()

    def _get_budget_request(self):
        return GetBudgetRequest()

    def process(self):
        if 'budgetId' not in self.event[
                'attributes'] or 'billingAccountId' not in self.event[
                    'attributes']:
            raise MissingAttributesException(
                'Message attributes are missing budgetId and billingAccountId!')

        client = self._get_budget_service_client()
        request = self._get_budget_request()
        request.name = 'billingAccounts/%s/budgets/%s' % (
            self.event['attributes']['billingAccountId'],
            self.event['attributes']['budgetId'])
        self.logger.debug('Retrieving details for budget.',
                          extra={'budget': request.name})

        response = client.get_budget(request)

        projects = self.expand_projects(response.budget_filter.projects)

        data = json.loads(self.data)

        ret = {
            'projects': projects,
            'budget': {
                'name':
                    response.name,
                'display_name':
                    response.display_name,
                'cost_amount':
                    data['costAmount'] if 'costAmount' in data else '',
                'cost_interval_start':
                    data['costIntervalStart']
                    if 'costIntervalStart' in data else '',
                'alert_threshold_exceeded':
                    data['alertThresholdExceeded']
                    if 'alertThresholdExceeded' in data else '',
                'forecast_threshold_exceeded':
                    data['forecastThresholdExceeded']
                    if 'forecastThresholdExceeded' in data else '',
                'credit_types_treatment':
                    str(response.budget_filter.credit_types_treatment
                       ).replace('CreditTypesTreatment.', ''),
                'amount_type':
                    'last_period'
                    if response.amount.last_period_amount else 'specified',
                'amount_units':
                    response.amount.last_period_amount.units
                    if response.amount.last_period_amount else
                    response.amount.specified_amount.units,
                'amounts_currency_code':
                    response.amount.last_period_amount.currency_code
                    if response.amount.last_period_amount else
                    response.amount.specified_amount.currency_code,
            }
        }
        return ret