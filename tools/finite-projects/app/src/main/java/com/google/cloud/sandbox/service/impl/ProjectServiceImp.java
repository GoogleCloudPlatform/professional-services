package com.google.cloud.sandbox.service.impl;


import com.google.cloud.resourcemanager.v3.Project;
import com.google.cloud.resourcemanager.v3.ProjectsClient;
import com.google.cloud.resourcemanager.v3.UpdateProjectRequest;
import com.google.cloud.sandbox.api.ApiResponse;
import com.google.cloud.sandbox.model.ProjectRecord;
import com.google.cloud.sandbox.model.ProjectRequest;
import com.google.cloud.sandbox.repository.ProjectRepository;
import com.google.cloud.sandbox.service.ProjectService;
import com.google.protobuf.FieldMask;
import com.google.protobuf.util.Timestamps;

import java.sql.Timestamp;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.concurrent.ExecutionException;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;


import com.google.cloud.sandbox.exception.ResourceNotFoundException;
import org.springframework.stereotype.Service;

import static com.google.cloud.sandbox.utils.ApplicationConstants.PROJECT_UPDATE_FAILED;
import static com.google.cloud.sandbox.utils.ApplicationConstants.PROJECT_DELETE_FAILED;
import static com.google.cloud.sandbox.utils.ApplicationConstants.PROJECT_CREATION_FAILED;;

@Service
public class ProjectServiceImp implements ProjectService {

  private String parentId;

  @Autowired
  private ProjectRepository projectRepository;

  @Autowired
  private ProjectsClient projectsClient;

  Logger logger = LoggerFactory.getLogger(ProjectServiceImp.class);

  public ProjectServiceImp(@Value("${project.parent.id}") String parentId,
      ProjectRepository projectRepository,
      ProjectsClient projectsClient) {
    this.parentId = parentId;
    this.projectRepository = projectRepository;
    this.projectsClient = projectsClient;
  }

  public Project createProject(ProjectRequest request){

      Project newProject = Project.newBuilder()
          .setProjectId(request.getId())
          .setParent(parentId)
          .setDisplayName(request.getName())
          .build();
      //todo log calling Project create with params?
      logger.info("PROJECT CREATED " + newProject.getDisplayName());
    try {
     return projectsClient.createProjectAsync(newProject).get();

    } catch (InterruptedException e) {
      e.printStackTrace();
      //todo Handle failed case
    } catch (ExecutionException e) {
      e.printStackTrace();
      Throwable cause = e.getCause();
      ApiResponse apiResponse = new ApiResponse(Boolean.FALSE, 
                                String.format("%s : %s, Cause : %s" ,PROJECT_CREATION_FAILED, request.getId(), cause));
      throw new AssertionError(apiResponse);
    }
    //todo log project created with result
    return null;
  }

  //TODO: Steps to ensure safe delete
  public void deleteProject(ProjectRecord record) {
      logger.info("Deleting project " + record.getRsc_name());
      try {
        Project result = projectsClient.deleteProjectAsync(record.getRsc_name()).get();
        logger.info("Successfully deleted project " + result.getProjectId());
        record.setActive(false);
        projectRepository.save(record);
        logger.info(record.getId() + " saved as inactive");
        //todo log that project has been deleted
      } catch (InterruptedException e) {
        logger.error("Interrupted Thread :" + e.getStackTrace(), e);
        Thread.currentThread().interrupt();
        throw new AssertionError(e);

      } catch (ExecutionException e) {
        e.printStackTrace();
        Throwable cause = e.getCause();
        throw new AssertionError(String.format("%s : %s, Cause : %s" ,PROJECT_DELETE_FAILED, record.getId(), cause));
      }

  }

  public ProjectRecord saveProjectToDB(Project project,
      ProjectRequest newProjectRequest) {

    return projectRepository.save(new ProjectRecord(project.getProjectId(),
        project.getDisplayName(),
        project.getName(),
        new Timestamp(Timestamps.toMillis(project.getCreateTime())),
        newProjectRequest.getOwnerName(), newProjectRequest.getOwnerEmail(),
        newProjectRequest.getBudget(), Timestamp.from(
        Instant.now().plus(newProjectRequest.getActiveDays(), ChronoUnit.DAYS)), true));
    //todo Log Saved to Database
  }

  @Override
	public Project updateProject(ProjectRequest updateProject, String projectId) {

    ProjectRecord projectData = projectRepository.findByIAndActive(projectId).
      orElseThrow((() -> new ResourceNotFoundException("Project", "projectId", updateProject.getId())));
  
      try { 
        
        Project originalProject = projectsClient.getProject(projectData.getRsc_name());
        UpdateProjectRequest request = UpdateProjectRequest.newBuilder()
            .setProject(originalProject)
            .setUpdateMask(FieldMask.newBuilder().build())
            .build();
        
        return projectsClient.updateProjectAsync(request).get();

      } catch (InterruptedException e) {
        e.printStackTrace();
        Thread.currentThread().interrupt();
        throw new AssertionError(e);

      } catch (ExecutionException e) {
        e.printStackTrace();
        Throwable cause = e.getCause();
        ApiResponse apiResponse = new ApiResponse(Boolean.FALSE, String.format("%s : %s, Cause : %s" ,PROJECT_UPDATE_FAILED, projectData.getId(), cause));
        throw new AssertionError(apiResponse);
      }
	}

}
