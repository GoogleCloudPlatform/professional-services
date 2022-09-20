package com.google.cloud.sandbox.model;


import java.io.Serializable;
import java.sql.Timestamp;
import javax.persistence.Entity;
import javax.persistence.Id;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Entity
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ProjectRecord implements Serializable{

  private static final long serialVersionUID = 1L;

  @Id
  private String id;
  private String dsp_name;
  private String rsc_name;
  private Timestamp created;
  private String own_name;
  private String own_email;
  private Integer budget;
  private Timestamp delete_at;
  private Boolean active;

}
