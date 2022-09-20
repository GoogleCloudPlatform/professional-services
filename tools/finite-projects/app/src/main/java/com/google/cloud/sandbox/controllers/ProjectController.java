package com.google.cloud.sandbox.controllers;

import com.google.cloud.resourcemanager.v3.Project;
import com.google.cloud.sandbox.model.ProjectRecord;
import com.google.cloud.sandbox.model.ProjectRequest;
import com.google.cloud.sandbox.service.GrantProjectIAMService;
import com.google.cloud.sandbox.service.ProjectService;
import com.google.cloud.sandbox.service.impl.GrantProjectIAMServiceImp;

import java.io.IOException;
import javax.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

//TODO: implement security
@RestController
@Validated
@RequestMapping(path = "/api/projects")
public class ProjectController {

  ProjectService projectService;
  GrantProjectIAMService grantProjectIAMService;

  public ProjectController(ProjectService projectService, GrantProjectIAMServiceImp grantProjectIAMService) {
    this.projectService = projectService;
    this.grantProjectIAMService = grantProjectIAMService;
  }
  @PostMapping(produces = "application/json")
  public ResponseEntity<ProjectRecord> createProject(@Valid @RequestBody ProjectRequest newProjectRequest){
    Project project = projectService.createProject(newProjectRequest);

    ProjectRecord newProject = projectService.saveProjectToDB(project, newProjectRequest);
    grantProjectIAMService.grantProjectOwner(project, newProjectRequest);
    return new ResponseEntity<  >(newProject, HttpStatus.OK);
  }

  @PutMapping("/{projectId}")
	public ResponseEntity<ProjectRecord> updateProject(@Valid @RequestBody ProjectRequest updateProjectRequest,
			@PathVariable(value = "projectId") String projectId) throws IOException {
		  Project updatedProject = projectService.updateProject(updateProjectRequest, projectId);
      ProjectRecord updateProjectRecord = projectService.saveProjectToDB(updatedProject, updateProjectRequest);
		return new ResponseEntity< >(updateProjectRecord, HttpStatus.CREATED);
	}
}
