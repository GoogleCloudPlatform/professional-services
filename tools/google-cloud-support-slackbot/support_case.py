#!/usr/bin/env python3

# Copyright 2021 Google LLC

# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import re
import logging
import time
from datetime import datetime
from support_service import support_service

logger = logging.getLogger(__name__)


class SupportCase:
    """
    Represent a Google Cloud Support Case.

    Attributes
    ----------
    case_number : str
      a unique string of numbers that is the id for the case
    resource_name : str
      a unique string including the org or project id and the
      case id, examples:
      organizations/12345/cases/67890
      projects/12345/cases/67890
    case_title : str
      the title the user gave the case when they created it
    description : str
      the user"s description of the case as provided in the support ticket
    escalated : bool
      whether or not a case has been escalated. This field doesn"t exist in
      the response until after a case has been escalated. True means the case
      is escalated
    case_creator : str
      name of the user that opened the support case. not a mandatory field
    create_time : str
      timestamp of when the case was created
    update_time : str
      timestamp of the last update made to the case
    priority : str
      the current priority of the case, represented as S0, S1, S2, S3, or S4
    state : str
      the status of the support ticket. Can be NEW, IN_PROGRESS_GOOGLE_SUPPORT,
      ACTION_REQUIRED, SOLUTION_PROVIDED, or CLOSED
    comment_list : list
      all public comments made on the case as strings. Comments are sorted
      with newest comments at the top
    """

    def __init__(self, caseobj):
        """
        Parameters
        ----------
        caseobj : json
            json for an individual case
        """
        MAX_RETRIES = 3

        service = support_service()

        self.case_number = re.search("(?:cases/)([0-9]+)", caseobj["name"])[1]
        self.resource_name = caseobj["name"]
        self.case_title = caseobj["displayName"]
        self.description = caseobj["description"]
        if "escalated" in caseobj:
            self.escalated = caseobj["escalated"]
        else:
            self.escalated = False
        try:
            self.case_creator = caseobj["creator"]["displayName"]
        except KeyError:
            self.case_creator = ""
        self.create_time = str(
            datetime.fromisoformat(caseobj["createTime"].replace("Z",
                                                                 "+00:00")))
        self.update_time = str(
            datetime.fromisoformat(caseobj["updateTime"].replace("Z",
                                                                 "+00:00")))
        self.priority = caseobj["severity"].replace("S", "P")
        self.state = caseobj["state"]
        self.comment_list = []
        case_comments = service.cases().comments()
        request = case_comments.list(parent=self.resource_name)
        while request is not None:
            try:
                comments = request.execute(num_retries=MAX_RETRIES)
            except BrokenPipeError as e:
                error_message = f"{e} : {datetime.now()}"
                logger.error(error_message)
                time.sleep(1)
            else:
                if "comments" in comments:
                    for comment in comments["comments"]:
                        self.comment_list.append(comment)
                request = case_comments.list_next(request, comments)
