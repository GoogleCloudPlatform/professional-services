package com.google.cloud.sandbox.service;

import java.io.IOException;

import com.google.cloud.resourcemanager.v3.Project;
import com.google.cloud.sandbox.model.ProjectRecord;
import com.google.cloud.sandbox.model.ProjectRequest;

public interface ProjectService {

    Project createProject(ProjectRequest request);
    ProjectRecord saveProjectToDB(Project project, ProjectRequest newProjectRequest);
    Project updateProject(ProjectRequest request, String projectId) throws IOException;
    void deleteProject(ProjectRecord record);
}