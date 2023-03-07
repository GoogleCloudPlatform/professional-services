# Copyright 2018 Google LLC. All rights reserved. Licensed under the Apache License, Version 2.0
# (the "License"); you may not use this file except in compliance with the License. You may obtain
# a copy of the License at
#
# http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software distributed under the License
# is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
# or implied. See the License for the specific language governing permissions and limitations under
# the License.
#
# Any software provided by Google hereunder is distributed "AS IS", WITHOUT WARRANTIES OR
# CONDITIONS OF ANY KIND, and is not intended for production use.

"""This is used to track the settings of the source bucket.
It is required so that after the source bucket is deleted, we can create the new one with all of
the same details and settings.
"""


class BucketDetails(object):
  """Holds the details and settings of a bucket."""

  # pylint: disable=attribute-defined-outside-init
  # This is done intentionally so that properties set either in the init or modified in outside
  # code will be forced to follow the skip rules specified on the command line.

  # pylint: disable=too-many-instance-attributes
  # All of these attributes relate to the bucket being copied.

  def __init__(self, conf, source_bucket):
    """Init the class from a source bucket.

    Args:
        conf: the configargparser parsing of command line options
        source_bucket: a google.cloud.storage.Bucket object that the bucket details should be
            copied from.
    """

    # Unless these values are specified on the command line, use the values from the source
    # bucket
    self.location = conf.location or source_bucket.location
    self.storage_class = conf.storage_class or source_bucket.storage_class

    self._set_skip_settings(conf)

    # These properties can be skipped with cmd line params, so use the property setters to
    # make the checks
    self.iam_policy = source_bucket.get_iam_policy()

    self.is_uniform_bucket = vars(source_bucket)["_properties"][
      "iamConfiguration"]["uniformBucketLevelAccess"]["enabled"]

    if not self.is_uniform_bucket:
      self.acl_entities = (source_bucket.acl.get_entities()
                           if not self._skip_acl else None)
      self.default_obj_acl_entities = (
        source_bucket.default_object_acl.get_entities()
        if not self._skip_default_obj_acl else None)
    else:
      self.acl_entities = None
      self.default_obj_acl_entities = None

    self.requester_pays = source_bucket.requester_pays
    self.cors = source_bucket.cors
    self.default_kms_key_name = source_bucket.default_kms_key_name
    self.labels = source_bucket.labels
    # lifecycle_rules returns a generator
    self.lifecycle_rules = list(source_bucket.lifecycle_rules)
    self.logging = source_bucket.get_logging()
    self.versioning_enabled = source_bucket.versioning_enabled
    # Unlike all other bucket properties, notifications are only given as an iterator
    self.notifications = list(source_bucket.list_notifications())

  def _set_skip_settings(self, conf):
    """Set up which settings need to be skipped and which ones should be copied"""
    self._skip_acl = True if conf.skip_everything else conf.skip_acl
    self._skip_cors = True if conf.skip_everything else conf.skip_cors
    self._skip_default_obj_acl = (True if conf.skip_everything else
                                  conf.skip_default_obj_acl)
    self._skip_iam = True if conf.skip_everything else conf.skip_iam
    self._skip_kms_key = True if conf.skip_everything else conf.skip_kms_key
    self._skip_labels = True if conf.skip_everything else conf.skip_labels
    self._skip_logging = True if conf.skip_everything else conf.skip_logging
    self._skip_lifecycle_rules = (True if conf.skip_everything else
                                  conf.skip_lifecycle_rules)
    self._skip_notifications = (True if conf.skip_everything else
                                conf.skip_notifications)
    self._skip_requester_pays = (True if conf.skip_everything else
                                 conf.skip_requester_pays)
    self._skip_versioning = True if conf.skip_everything else conf.skip_versioning

  @property
  def iam_policy(self):
    """Get the bucket IAM policy"""
    return self._iam_policy

  @iam_policy.setter
  def iam_policy(self, value):
    self._iam_policy = None if self._skip_iam else value

  @property
  def acl_entities(self):
    """Get the bucket ACL entities"""
    return self._acl_entities

  @acl_entities.setter
  def acl_entities(self, value):
    self._acl_entities = None if self._skip_acl else value

  @property
  def default_obj_acl_entities(self):
    """Get the bucket's default object ACL entities"""
    return self._default_obj_acl_entities

  @default_obj_acl_entities.setter
  def default_obj_acl_entities(self, value):
    self._default_obj_acl_entities = None if self._skip_default_obj_acl else value

  @property
  def requester_pays(self):
    """Get the boolean for if the bucket is set as requester pays"""
    return self._requester_pays

  @requester_pays.setter
  def requester_pays(self, value):
    self._requester_pays = None if self._skip_requester_pays else value

  @property
  def cors(self):
    """Get the CORS settings of the bucket"""
    return self._cors

  @cors.setter
  def cors(self, value):
    self._cors = None if self._skip_cors else value

  @property
  def default_kms_key_name(self):
    """Get the bucket's default KMS key's name"""
    return self._default_kms_key_name

  @default_kms_key_name.setter
  def default_kms_key_name(self, value):
    self._default_kms_key_name = None if self._skip_kms_key else value

  @property
  def labels(self):
    """Get the labels on the bucket"""
    return self._labels

  @labels.setter
  def labels(self, value):
    self._labels = {} if self._skip_labels else value

  @property
  def lifecycle_rules(self):
    """Get the lifecycle rules for the bucket"""
    return self._lifecycle_rules

  @lifecycle_rules.setter
  def lifecycle_rules(self, value):
    self._lifecycle_rules = None if self._skip_lifecycle_rules else value

  @property
  def logging(self):
    """Get the logging settings for the bucket"""
    return self._logging

  @logging.setter
  def logging(self, value):
    self._logging = None if self._skip_logging else value

  @property
  def versioning_enabled(self):
    """Get the boolean on if the bucket has versioning enabled"""
    return self._versioning_enabled

  @versioning_enabled.setter
  def versioning_enabled(self, value):
    self._versioning_enabled = None if self._skip_versioning else value

  @property
  def notifications(self):
    """Get the notifications set up for the bucket"""
    return self._notifications

  @notifications.setter
  def notifications(self, value):
    self._notifications = [] if self._skip_notifications else value
