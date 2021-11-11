# Copyright 2019 Google Inc. All Rights Reserved.
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
# ==============================================================================

"""Control formating of the report"""

from typing import Text, Callable, List, Optional

from ml_eda.reporting import template
from ml_eda.reporting import content_generator as cg

WARNING_STR = 'warning'
RECOMMEND_STR = 'recommend'


def numeric_formatting(value: float, width: int = 10) -> Text:
  """Consistently formatting numerical value with fix width. If the length
  is longer than the specified width, scientific notation will be used.

  Args:
    value: numerical value to be formatted
    width: displaying width

  Returns:
    Formatted value in string type.
  """
  formatting_string = "{{0:{width}.{width}}}".format(width=width)
  return formatting_string.format(float(value))


class SectionMeta:
  """Hold metadata required to define a structure of a report section."""
  # pylint: disable-msg=too-many-instance-attributes
  # pylint: disable-msg=too-many-arguments
  def __init__(self,
               section_name: Text,
               section_title: Optional[Text],
               section_title_template: Optional[Text],
               section_description: Optional[Text],
               section_content_generator: Optional[Callable],
               skip_if_no_content: bool,
               generate_warning: bool,
               generate_recommend: bool,
               dependency: List
               ):
    self.section_name = section_name
    self.section_title = section_title
    self.section_title_template = section_title_template
    self.section_description = section_description
    self.section_content_generator = section_content_generator
    self.skip_if_no_content = skip_if_no_content
    self.generate_warning = generate_warning
    self.generate_recommend = generate_recommend
    self.dependency = dependency

  def __repr__(self):
    return '''
    name: {section_name}
    title: {section_title}'''.format(section_name=self.section_name,
                                     section_title=self.section_title)


title = SectionMeta(
    section_name='title',
    section_title="Exploratory Data Analysis Report",
    section_title_template=template.REPORT_TITLE,
    section_description=None,
    section_content_generator=None,
    skip_if_no_content=False,
    generate_warning=False,
    generate_recommend=False,
    dependency=[]
)

dataset_info = SectionMeta(
    section_name='dataset_info',
    section_title=None,
    section_title_template=None,
    section_description=None,
    section_content_generator=cg.create_dataset_info_section,
    skip_if_no_content=True,
    generate_warning=False,
    generate_recommend=False,
    dependency=[]
)

descriptive = SectionMeta(
    section_name='descriptive',
    section_title="Descriptive Analysis",
    section_title_template=template.SECTION_TITLE,
    section_description=None,
    section_content_generator=cg.create_descriptive_section,
    skip_if_no_content=True,
    generate_warning=True,
    generate_recommend=False,
    dependency=[]
)

pearson_correlation = SectionMeta(
    section_name='pearson_correlation',
    section_title="Pearson Correlation",
    section_title_template=template.SUB_SUB_SECTION_TITLE,
    section_description=None,
    section_content_generator=cg.create_pearson_correlation_section,
    skip_if_no_content=True,
    generate_warning=True,
    generate_recommend=False,
    dependency=[]
)

correlation_numerical = SectionMeta(
    section_name='correlation_numerical',
    section_title="Numerical Attributes Correlation",
    section_title_template=template.SUB_SECTION_TITLE,
    section_description=None,
    section_content_generator=None,
    skip_if_no_content=True,
    generate_warning=False,
    generate_recommend=False,
    dependency=[pearson_correlation]
)

contingency_table = SectionMeta(
    section_name='contingency_table',
    section_title="Contingency Table",
    section_title_template=template.SUB_SUB_SECTION_TITLE,
    section_description=None,
    section_content_generator=cg.create_contingency_table_section,
    skip_if_no_content=True,
    generate_warning=False,
    generate_recommend=False,
    dependency=[]
)

information_gain = SectionMeta(
    section_name='information_gain',
    section_title="Information Gain",
    section_title_template=template.SUB_SUB_SECTION_TITLE,
    section_description=None,
    section_content_generator=cg.create_information_gain_section,
    skip_if_no_content=True,
    generate_warning=False,
    generate_recommend=False,
    dependency=[]
)

chi_test = SectionMeta(
    section_name='chi_test',
    section_title="Chi-square Statistical Test",
    section_title_template=template.SUB_SUB_SECTION_TITLE,
    section_description=None,
    section_content_generator=cg.create_chi_square_section,
    skip_if_no_content=True,
    generate_warning=True,
    generate_recommend=False,
    dependency=[]
)

correlation_categorical = SectionMeta(
    section_name='correlation_categorical',
    section_title="Categorical Attributes Correlation",
    section_title_template=template.SUB_SECTION_TITLE,
    section_description=None,
    section_content_generator=None,
    skip_if_no_content=True,
    generate_warning=False,
    generate_recommend=False,
    dependency=[contingency_table, information_gain, chi_test]
)

table_descriptive = SectionMeta(
    section_name='table_descriptive',
    section_title="Descriptive Table",
    section_title_template=template.SUB_SUB_SECTION_TITLE,
    section_description=None,
    section_content_generator=cg.create_table_descriptive_section,
    skip_if_no_content=True,
    generate_warning=False,
    generate_recommend=False,
    dependency=[]
)

anova_test = SectionMeta(
    section_name='anova_test',
    section_title="ANOVA Statistical Test",
    section_title_template=template.SUB_SUB_SECTION_TITLE,
    section_description=None,
    section_content_generator=cg.create_anova_section,
    skip_if_no_content=True,
    generate_warning=True,
    generate_recommend=False,
    dependency=[]
)

correlation_numerical_categorical = SectionMeta(
    section_name='correlation_numerical_categorical',
    section_title="Numerical and Categorical Attributes Correlation",
    section_title_template=template.SUB_SECTION_TITLE,
    section_description=None,
    section_content_generator=None,
    skip_if_no_content=True,
    generate_warning=False,
    generate_recommend=False,
    dependency=[table_descriptive, anova_test]
)

correlation_analysis = SectionMeta(
    section_name='correlation_analysis',
    section_title="Correlation Analysis",
    section_title_template=template.SECTION_TITLE,
    section_description=None,
    section_content_generator=None,
    skip_if_no_content=True,
    generate_warning=False,
    generate_recommend=False,
    dependency=[correlation_numerical, correlation_categorical,
                correlation_numerical_categorical]
)

target_highlight = SectionMeta(
    section_name='target_highlight',
    section_title="Highlights of Target Attribute",
    section_title_template=template.SECTION_TITLE,
    section_description=None,
    section_content_generator=cg.create_target_highlight_section,
    skip_if_no_content=True,
    generate_warning=False,
    generate_recommend=True,
    dependency=[]
)

warning = SectionMeta(
    section_name=WARNING_STR,
    section_title="Warning",
    section_title_template=template.SUB_SECTION_TITLE,
    section_description=None,
    section_content_generator=None,
    skip_if_no_content=True,
    generate_warning=False,
    generate_recommend=False,
    dependency=[]
)

recommend = SectionMeta(
    section_name=RECOMMEND_STR,
    section_title="Recommendation",
    section_title_template=template.SUB_SUB_SECTION_TITLE,
    section_description=None,
    section_content_generator=None,
    skip_if_no_content=True,
    generate_warning=False,
    generate_recommend=False,
    dependency=[]
)

summary = SectionMeta(
    section_name='summary',
    section_title="Summary of warning and recommendation",
    section_title_template=template.SECTION_TITLE,
    section_description=None,
    section_content_generator=None,
    skip_if_no_content=True,
    generate_warning=False,
    generate_recommend=False,
    dependency=[warning, recommend]
)

REPORT_STRUCTURE = (
    title,
    dataset_info,
    descriptive,
    correlation_analysis,
    correlation_numerical,
    pearson_correlation,
    correlation_categorical,
    contingency_table,
    information_gain,
    chi_test,
    correlation_numerical_categorical,
    table_descriptive,
    anova_test,
    target_highlight,
    recommend,
)
