/*
Copyright 2022 Google LLC

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    https://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/
package com.google.cloud.pso.security.resourcemanager;

import com.google.cloud.resourcemanager.v3.Folder;
import com.google.cloud.resourcemanager.v3.FoldersClient;
import com.google.cloud.resourcemanager.v3.FoldersClient.ListFoldersPagedResponse;
import com.google.cloud.resourcemanager.v3.Project;
import com.google.cloud.resourcemanager.v3.ProjectsClient;
import com.google.cloud.resourcemanager.v3.ProjectsClient.ListProjectsPagedResponse;
import com.google.common.flogger.GoogleLogger;
import java.io.IOException;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Iterator;
import java.util.Map;
import java.util.Set;

public class ResourceManagerClient {

  private static final GoogleLogger logger = GoogleLogger.forEnclosingClass();

  Map<Folder, Set<Project>> folderProjectMap = null;
  ProjectsClient projectsClient = null;

  FoldersClient foldersClient = null;

  public ResourceManagerClient() {
    folderProjectMap = new HashMap<Folder, Set<Project>>();

    try {
      projectsClient = ProjectsClient.create();
      foldersClient = FoldersClient.create();
    } catch (IOException e) {
      logger.atSevere().withCause(e).log("Error Creating Project or Folder client");
    }
  }

  /**
   * Fetch folder and projects recursively.
   *
   * @param parent Organization ID
   * @return Map of folder with projects.
   */
  public Map<Folder, Set<Project>> fetchFoldersAndProjects(String parent) {

    logger.atInfo().log("Fetching resources from " + parent);

    ListFoldersPagedResponse response = foldersClient.listFolders(parent);

    Iterable<Folder> folders = response.iterateAll();
    Iterator<Folder> iterableFolders = folders.iterator();

    while (iterableFolders.hasNext()) {
      Folder folder = iterableFolders.next();
      fetchFolders(folder);
    }
    return folderProjectMap;
  }

  /**
   * Fetch folders recursively.
   *
   * @param folder
   */
  private void fetchFolders(Folder folder) {

    logger.atInfo().log("Listing folders from " + folder.getDisplayName());

    fetchProjects(folder);

    ListFoldersPagedResponse response = foldersClient.listFolders(folder.getName());

    Iterable<Folder> folders = response.iterateAll();
    Iterator<Folder> iterableFolders = folders.iterator();

    while (iterableFolders.hasNext()) {
      folder = iterableFolders.next();
      fetchFolders(folder);
    }
  }

  /**
   * Fetch projects within folder
   *
   * @param folder
   */
  private void fetchProjects(Folder folder) {

    logger.atInfo().log("Fetching projects from " + folder.getDisplayName());

    Set<Project> projectSet = new HashSet<Project>();
    ListProjectsPagedResponse projectsResponse = projectsClient.listProjects(folder.getName());
    Iterable<Project> iterableProjects = projectsResponse.iterateAll();
    Iterator<Project> projects = iterableProjects.iterator();

    while (projects.hasNext()) {
      Project project = projects.next();
      projectSet.add(project);
    }
    folderProjectMap.put(folder, projectSet);
  }
}
