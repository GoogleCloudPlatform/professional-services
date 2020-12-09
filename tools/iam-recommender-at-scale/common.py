"""Common utils to support apply and reverting recommendations on bulk."""

import collections
from concurrent import futures
import json
import logging
import time

from google_auth_httplib2 import AuthorizedHttp
import httplib2

from google.oauth2 import service_account


class Recommendation(object):
    """Encapsulate Recommendation information required to compute hero metrics."""

    def __init__(self, data):
        self.name = data["name"]
        self.etag = data["etag"]
        self.state = self.get_state(data)
        self.principal = set()
        self.principal_type = ""
        self.remove_role = set()
        self.add_roles = set()
        self.resource = set()

        self.extract_recommendation(data)
        self.check_integrity()
        self.update_data()

    def __repr__(self):
        return repr(
            (self.state, self.principal, self.principal_type, self.remove_role,
             self.add_roles, self.resource, self.name, self.etag))

    def get_state(self, data):
        """Get state of the recommendation."""

        if data["stateInfo"]["state"] == "ACTIVE":
            return "ACTIVE"
        elif data["stateInfo"]["state"] == "SUCCEEDED":
            if ("reverted" in data["stateInfo"].get("stateMetadata", {}) and
                    data["stateInfo"]["stateMetadata"].get("reverted",
                                                           "false") == "true"):
                return "SUCCEEDED_REVERTED"
            else:
                return "SUCCEEDED"
        return data["stateInfo"]["state"]

    def extract_recommendation(self, data):
        """Populate recommendation data from a recommendation payload."""

        for op_grps in data.get("content", {}).get("operationGroups", []):
            for op in op_grps["operations"]:
                if op["action"] == "remove":
                    self.principal.add(
                        op["pathFilters"]["/iamPolicy/bindings/*/members/*"])
                    self.resource.add(op["resource"])
                    self.remove_role.add(
                        op["pathFilters"]["/iamPolicy/bindings/*/role"])
                elif op["action"] == "add":
                    self.resource.add(op["resource"])
                    self.add_roles.add(
                        op["pathFilters"]["/iamPolicy/bindings/*/role"])
                    self.principal.add(op["value"])
                else:
                    raise ValueError("Wrong action : " + op["action"])

    def check_integrity(self):
        """Check invariance of a recommendation payload."""
        assert len(
            self.principal
        ) == 1, "there should be exactly one principal. principal : " + str(
            self.principal)
        assert len(
            self.remove_role
        ) == 1, "there should be exactly one removed role. remove_role: " + str(
            self.remove_role)
        assert len(
            self.resource
        ) == 1, "there should be exactly one resource. resource: " + str(
            self.resource)

    def update_data(self):
        """Update recommendation data after checking the integrity."""

        self.principal = self.principal.pop()
        self.principal_type = self.principal.split(":")[0]
        self.resource = self.resource.pop()


def rate_limit_execution(f, rate_limit, *args):
    """Execute multiple threads of function f for args while respecting the rate limit.

  Args:
    f: function to execute
    rate_limit: rate with which the functions should be executed.
    *args: Args provided for executing the function f.

  Returns:
    Output of executing f on args
  """
    i = 0
    n = len(args[0])
    all_output = []
    max_request, duration = rate_limit
    while i < n:
        tic = int(time.time())
        with futures.ThreadPoolExecutor(max_workers=max_request) as executor:
            output_ = executor.map(f, *[arg[i:i + max_request] for arg in args])
        i += max_request
        all_output.extend(output_)
        toc = int(time.time())
        diff = toc - tic
        if diff < duration and i < n:
            time.sleep(duration - diff)
        logging.info("Finish investigating %d items out of total %d items.",
                     min(i, n), n)
    return all_output


def get_recommendations(project_id, recommender, state, credentials):
    """Returns all recommendtions.

  Args:
    project_id: (str) Project for which to get the recommendtion.
    recommender: Recommender stub to call recommender API
    state: state of the recommendation
    credentials: client credentials
  """
    http = httplib2.Http()
    authorize_http = AuthorizedHttp(credentials, http=http)
    parent = "projects/{}/locations/global/recommenders/google.iam.policy.Recommender".format(
        project_id)
    fields = [
        "recommendations/stateInfo/state", "recommendations/content",
        "recommendations/etag", "recommendations/name",
        "recommendations/stateInfo/stateMetadata"
    ]
    try:
        request = recommender.projects().locations().recommenders(
        ).recommendations().list(parent=parent, fields=",".join(fields))
        response = request.execute(http=authorize_http)

        recommendation_data = [
            Recommendation(r) for r in response.get("recommendations", [])
        ]
        return [r for r in recommendation_data if r.state == state]
    except:
        return []


def update_recommendation_status(recommendation, recommender_client, metadata,
                                 credentials):
    """Update the recommendation status for the recommendations.

  Args:
    recommendation: Recommendation on IAM policy.
    recommender_client: Iam recommender client.
    metadata: (Dict) metadata to update the recommendation state.
    credentials: service account credentials.

  Returns:
    Recommendations with updated status.
  """
    http = httplib2.Http()
    authorize_http = AuthorizedHttp(credentials, http=http)

    return (recommender_client.projects().locations().recommenders().
            recommendations().markSucceeded(name=recommendation["id"],
                                            body={
                                                "etag": recommendation["etag"],
                                                "stateMetadata": metadata
                                            }).execute(http=authorize_http))


def get_current_policy(resourcemanager_v1, project_id, credentials):
    """Returns the current policy associated with project_id.

  Args:
    resourcemanager_v1: ResourcemanagerV1 stub to call IAM API
    project_id: (str) Project for which to get the recommendtion.
    credentials: client credentials
  """
    http = httplib2.Http()
    authorize_http = AuthorizedHttp(credentials, http=http)
    request = resourcemanager_v1.projects().getIamPolicy(resource=project_id)
    cur_policy = request.execute(http=authorize_http)
    del cur_policy["etag"]
    return cur_policy


def update_policy(resourcemanager_v1, project_id, credentials, new_policy):
    """Returns the new policy associated with project_id.

  Args:
    resourcemanager_v1: ResourcemanagerV1 stub to call IAM API
    project_id: (str) Project for which to get the recommendtion.
    credentials: client credentials
    new_policy: New policy to set on the project
  """
    http = httplib2.Http()
    authorize_http = AuthorizedHttp(credentials, http=http)
    set_policy_request = resourcemanager_v1.projects().setIamPolicy(
        resource=project_id, body={"policy": new_policy})
    return set_policy_request.execute(http=authorize_http)


def get_credentials(service_account_file_path, scopes=None):
    """Returns credentials from a service_account_file_path.

  Args:
    service_account_file_path: (str) Path to service account key.
    scopes: List scopes for service account
  """
    if scopes is None:
        scopes = ["https://www.googleapis.com/auth/cloud-platform"]
    return service_account.Credentials.from_service_account_file(
        service_account_file_path, scopes=scopes)


def diff_between_policies(old_policy, new_policy):
    """Returns the difference between two policies.

  Args:
    old_policy: Old policy
    new_policy: New policy
  """
    old_bindings = collections.defaultdict(set)
    for b in old_policy["bindings"]:
        if "condition" in b:
            continue
        for principal in b["members"]:
            old_bindings[principal].add(b["role"])
    new_bindings = collections.defaultdict(set)
    for b in new_policy["bindings"]:
        if "condition" in b:
            continue
        for principal in b["members"]:
            new_bindings[principal].add(b["role"])
    all_principals = {*old_bindings.keys(), *new_bindings.keys()}
    entries = []
    for principal in sorted(all_principals):
        new_roles = new_bindings[principal]
        old_roles = old_bindings[principal]
        if new_roles == old_roles:
            continue
        removed_roles = old_roles - new_roles
        added_roles = new_roles - old_roles
        entry = {
            "principal": principal,
            "removed_roles": list(removed_roles),
            "added_roles": list(added_roles)
        }
        entries.append(entry)
    return json.dumps({"diff_policy": entries}, sort_keys=True, indent=4)


def remove_role_from_policy(policy, recommendation):
    """Remove roles for a policy based on recommendations.

  Args:
    policy: IAM policy.
    recommendation: Recommendation on IAM policy.

  Returns:
    None. Change the policy in place.
  """
    is_acted_recommendation = False
    acted_and_succeeded = False
    if not recommendation["role_recommended_to_be_removed"]:
        return True  # No role to be removed.
    for binding in policy["bindings"]:
        if binding["role"] not in recommendation[
                "role_recommended_to_be_removed"]:
            continue
        if "condition" in binding:
            continue
        try:
            is_acted_recommendation = True
            binding["members"].remove(recommendation["principal"])
            recommendation["role_recommended_to_be_removed"].remove(
                binding["role"])
            acted_and_succeeded = True
        except:
            logging.error("`%s` does not have `role:%s`.",
                          recommendation["principal"],
                          recommendation["role_recommended_to_be_removed"])
    if not is_acted_recommendation:
        logging.error("`%s` does not have `role:%s`.",
                      recommendation["principal"],
                      recommendation["role_recommended_to_be_removed"])
    return is_acted_recommendation and acted_and_succeeded


def add_roles_in_policy(policy, recommendation):
    """Add roles in the policy based on recommendations.

  Args:
    policy: IAM policy.
    recommendation: Recommendation on IAM policy.

  Returns:
    None. Change the policy in place.
  """
    is_acted_recommendation = False
    roles_to_be_added = set(
        recommendation["roles_recommended_to_be_replaced_with"])
    for binding in policy["bindings"]:
        if binding["role"] not in roles_to_be_added:
            continue
        if "condition" in binding:
            continue
        binding["members"].append(recommendation["principal"])
        roles_to_be_added.remove(binding["role"])
    for role in roles_to_be_added:
        policy["bindings"].append({
            "role": role,
            "members": [recommendation["principal"]]
        })
    is_acted_recommendation = True
    return is_acted_recommendation


def writefile(data, output_file):
    with open(output_file, "w") as f:
        f.write(data)


def describe_recommendations(recommendations):
    """Returns a json string representation  of recommendation with selected fileds.

  Args:
    recommendations: List(common.Recommendation)
  """
    recommendations_sorted = sorted(recommendations, key=lambda x: x.principal)
    data = []
    for r in recommendations_sorted:
        data.append({
            "id": r.name,
            "etag": r.etag,
            "principal": r.principal,
            "role_recommended_to_be_removed": list(r.remove_role),
            "roles_recommended_to_be_replaced_with": list(r.add_roles)
        })
    return json.dumps({"recommendations": data}, indent=4, sort_keys=True)
