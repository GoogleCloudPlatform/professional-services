package com.google.cloud.sandbox.service;

import com.google.cloud.resourcemanager.v3.Project;
import com.google.cloud.sandbox.model.ProjectRequest;

public interface GrantProjectIAMService {
  void grantProjectOwner(Project project, ProjectRequest newProjectRequest);
}
