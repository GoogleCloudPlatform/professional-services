# Copyright 2024 Google LLC
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
"""Runs the DLP inspection over the preprocessed table."""

from typing import List, Dict
import warnings
from google.cloud import dlp_v2
from google.api_core.exceptions import BadRequest, Unknown


class DlpInspection:
    """Performs a DLP inspection on a preprocessed table to identify
            sensitive information."""

    def __init__(
        self,
        project_id: str,
        location_category: str = None,
        dlp_template: str = None,
        tables: List[dlp_v2.Table] = None,
    ):
        """Initializes the class with the required data.

        Args:
            project_id: The project ID to be used.
            location_category: The location to be inspected. Ex. "CANADA".
            tables: Tables to be inspected in the correct format.
        """
        self.dlp_client = dlp_v2.DlpServiceClient()
        self.project_id = project_id
        self.location_category = location_category
        self.dlp_template = dlp_template
        self.tables = tables

    def get_inspection_parameters(self):
        """Gets the table to be inspected with an API call.

        Returns:
            parent (str): The project route in GCP.
            inspect_config (Dict): The configuration for the inspection.
        """
        if self.dlp_template:
            # If DLP template ID and location are provided, use the template.
            template_name = f"projects/{self.project_id}/locations/" + \
                f"{self.dlp_template}"

            template_dlp = self.dlp_client.get_inspect_template(
                name=template_name)

            infotypes = template_dlp.inspect_config.info_types

            # Extract filtered info types from the template.
            filtered_infotypes = [infotype.name for infotype in infotypes]

        elif self.location_category:
            # If location category is provided, list relevant info types.
            infotypes = self.dlp_client.list_info_types()

            with warnings.catch_warnings(record=True):
                warnings.filterwarnings("always", category=UserWarning)

                # Filter info types based on location category.
                filtered_infotypes = [
                    info_type.name
                    for info_type in infotypes.info_types
                    if (
                        str(info_type.categories[0].location_category)
                        == f"LocationCategory.{self.location_category}"
                    )
                    or (
                        str(info_type.categories[0].location_category)
                        == "LocationCategory.GLOBAL"
                    )
                ]

        else:
            # Raise an exception if neither template nor
            # location category is provided.
            raise ValueError("""Either 'dlp_template' or
                             'location_category' must be provided.""")

        inspect_config = {
            "info_types": [
                {"name": name} for name in filtered_infotypes
            ],
            "min_likelihood": "LIKELY",
            "limits": {
                "max_findings_per_request": 100
            }
        }

        parent = f"projects/{self.project_id}"
        return parent, inspect_config

    def analyze_inspection_result(self, results: List[Dict]) -> Dict:
        """Processes the results of the inspection.

            This code iterates through a list of API responses and constructs a
            dictionary.
            Each entry in the dictionary is associated with a column and
            contains a sub-dictionary for each infotype found in the response.
            In each sub-dictionary, the variable name is used as the key
            and the associated value is the likelihood.

            Args:
                table_inspected: The API response to be analyzed.

            Returns:
                finding_results: For every variable there is a dictionary with
                    the infotype and the likelihood value.
                Example: {"name": {"PERSON_NAME": 4.4}, "age": {"AGE": 5.8}}
        """
        table_inspected = {}
        # Create a dictionary in the correct format
        # to analyze the API response.
        finding_results = {}
        for result in (results):
            table_inspected["result"] = result.result

            value_likelihood = {
                "LIKELIHOOD_UNSPECIFIED": 1,
                "VERY_UNLIKELY": 0.6,
                "UNLIKELY": 0.8,
                "POSSIBLE": 1,
                "LIKELY": 1.2,
                "VERY_LIKELY": 1.4
            }
            if table_inspected["result"].findings:
                for finding in table_inspected["result"].findings:
                    try:
                        column = finding.location.content_locations[
                            0].record_location.field_id.name
                        infotypes = finding_results.setdefault(column, {})
                        likelihood = value_likelihood.get(
                            finding.likelihood.name, 0)
                        # If the infotype is already in the dictionary, sum
                        # the likelihood value to the exisiting one.
                        if finding.info_type.name in infotypes:
                            infotypes[finding.info_type.name] += likelihood
                        else:
                            # If the infotype is not in the dictionary, add it
                            # with the likelihood value.
                            infotypes[finding.info_type.name] = likelihood
                    except AttributeError as err:
                        raise ValueError("""AttributeError:
                        No findings returned from API call.""") from err

        return finding_results

    def get_max_infotype(self, finding_results: Dict) -> Dict:
        """Gets the max infotype for each variable.

            Iterates over the finding results and returns the infotype with
            the highest likelihood.

            Args:
                finding_results: The findings result to be analyzed.

            Returns:
            top_findings: A dictionary where each variable has its respective
              "infotype" and "likelihood value."
        """
        top_findings = {}
        for column in finding_results:
            max_infotype = None
            max_count = 0
            for infotype, count in finding_results.get(column).items():
                # Add the infotype to the top_findings dictionary.
                # If the infotype is already in the dictionary, sum the
                # likelihood value to the existing one, otherwise add it
                # with the likelihood value.
                if max_infotype is None or count > max_count:
                    max_infotype = infotype
                    max_count = count
            top_findings[column] = max_infotype
        return top_findings

    def analyze_dlp_table(
        self,
        parent: str,
        table: dlp_v2.Table,
        inspect_config: Dict,
    ) -> List[Dict]:
        """Analyze the complete DLP table one column at a time.

        This function iteratively analyzes a large DLP table by making API
        calls for each column individually. This helps to avoid exceeding
        API quotas and rate limits, which can cause errors and delays.

        Args:
           parent (str): The project route in GCP.
           table (dlp_v2.Table): The particular table to be inspected in
                the correct format.
           inspect_config (Dict): Parameters for the inspection. InfoTypes
                           and the minimum likelihood.

        Returns:
            List[Dict]: The response from the API. Each variable is
            inspected and returns findings for each record.
        """

        results_list = []

        def inspect_content(dlp_table: dlp_v2.Table,
                            results_list: List,
                            inspect_config: Dict,
                            error_counter: int = 0):
            """Recursively inspects the content of DLP table cells.
            This function makes an API request to inspect the content of a 
            chunk of data from the DLP table.
            If the inspection results in an inactive error, the function
            retries the inspection up to two more times to prevent the code
            execution from being interrupted.

            Args:
                dlp_table (dlp_v2.Table): Table containing data.
                result_list (List): Storage for inspection results.
                inspect_config (Dict): Parameters for the inspection. InfoTypes
                and the minimum likelihood.
                error_counter (int, optional): Inactive error counter.
            """
            try:
                # Make the API request for the chunk of data.
                response = self.dlp_client.inspect_content(
                    request={
                        "parent": parent,
                        "item": {"table": dlp_table},
                        "inspect_config": inspect_config
                    }
                )
                # Append the chunk inspection into the results.
                results_list.append(response)
            except BadRequest as error:
                # Handle the BadRequest exception here.
                raise BadRequest(error) from error
            except Unknown as error:
                if error_counter < 2:
                    inspect_content(dlp_table,
                                    results_list,
                                    inspect_config,
                                    error_counter + 1)
                else:
                    raise Unknown(error) from error

        for col_index, _ in enumerate(table.headers):
            dlp_table = dlp_v2.Table()
            dlp_table.headers = [{"name": table.headers[col_index].name}]

            rows = []
            for row in table.rows:
                cell_value = row.values[col_index].string_value
                rows.append(dlp_v2.Table.Row(
                    values=[dlp_v2.Value(string_value=cell_value)]))

            dlp_table.rows = rows

            inspect_content(dlp_table,
                            results_list,
                            inspect_config)

        return results_list

    def get_finding_results(self, table: dlp_v2.Table) -> Dict:
        """Retrieve the finding results of inspected cells in a table.
        This method takes a table and performs data inspection using the
        configured inspection parameters. It returns a dictionary containing
        the finding results for the inspected cells.

            Args:
                table: The particular table to be inspected in the correct
                            format.

           Returns:
                A dictionary, where each variable has its respective
              "infotype" and "likelihood value."""
        parent, inspect_config = self.get_inspection_parameters()

        # Get the complete cells inspected.
        results_lists = self.analyze_dlp_table(parent, table,
                                               inspect_config)
        # Processes the results of the inspection.
        finding_results = self.analyze_inspection_result(results_lists)

        return finding_results

    def merge_finding_results(self, finding_results_list: List) -> Dict:
        """Merges a list of finding results and finds the top findings.

        Args:
            finding_results_list (List): A list of finding results.

        Returns:
            A dictionary containing the top findings with their
                respective infotype and likelihood value.
        """
        merge_finding_result = {}

        # Merge the finding results from the list.
        for finding_results in finding_results_list:
            for key, values in finding_results.items():
                if key not in merge_finding_result:
                    merge_finding_result[key] = {}
                for infotype, value in values.items():

                    # Sum up the likelihood values for each infotype.
                    merge_finding_result[key][infotype] =  \
                        merge_finding_result[key].get(infotype, 0) + value

        # Get the maximum infotype for each variable.
        return self.get_max_infotype(merge_finding_result)
