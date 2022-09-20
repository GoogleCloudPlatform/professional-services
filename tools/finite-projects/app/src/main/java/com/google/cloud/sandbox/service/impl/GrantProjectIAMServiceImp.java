package com.google.cloud.sandbox.service.impl;

import com.google.cloud.resourcemanager.v3.Project;
import com.google.cloud.resourcemanager.v3.ProjectsClient;
import com.google.cloud.sandbox.model.ProjectRequest;
import com.google.cloud.sandbox.service.GrantProjectIAMService;
import com.google.iam.v1.Binding;
import com.google.iam.v1.Policy;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class GrantProjectIAMServiceImp implements GrantProjectIAMService {

  private ProjectsClient projectsClient;

  Logger logger = LoggerFactory.getLogger(GrantProjectIAMServiceImp.class);

  public GrantProjectIAMServiceImp(ProjectsClient projectsClient) {
    this.projectsClient = projectsClient;
  }

  public void grantProjectOwner(Project project, ProjectRequest newProjectRequest) {
    logger.info("Grant roles/owner to user: "
        + newProjectRequest.getOwnerEmail()
        + " for project: " +project.getProjectId());
    try {
      projectsClient.setIamPolicy(
          project.getName(),
          Policy.newBuilder()
              .addBindings(
                  Binding.newBuilder()
                      .addMembers("user:" + newProjectRequest.getOwnerEmail())
                      .setRole("roles/owner")
                      .setRole("roles/resourcemanager.projectMover")
                      .build())
              .build());
    } catch(Exception ex){
      logger.info("error" + ex.getMessage()) ;
    }
    
  }
}
