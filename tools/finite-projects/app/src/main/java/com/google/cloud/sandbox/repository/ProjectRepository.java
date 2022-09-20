package com.google.cloud.sandbox.repository;

import java.util.List;
import java.util.Optional;
import com.google.cloud.sandbox.model.ProjectRecord;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;


@Repository
public interface ProjectRepository extends CrudRepository<ProjectRecord, String> {
  List<ProjectRecord> findByActive(Boolean active);
  
  ProjectRecord findTopByActiveOrderByCreated(Boolean active);

  @Query(value = "SELECT * FROM project_record p WHERE p.id = ?1 AND p.active = true", nativeQuery = true)
  Optional<ProjectRecord> findByIAndActive(@Param("projectId") String projectId);
}
