package com.google.cloud.sandbox.model;
import javax.persistence.Column;
import javax.validation.constraints.Email;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Positive;
import javax.validation.constraints.PositiveOrZero;
import javax.validation.constraints.Size;

import lombok.Data;

@Data
public class ProjectRequest {

  @NotBlank
  @Size(min = 4)
  String name;

  @NotBlank
  @Column(updatable = false)
  String id;

  @NotBlank
  @Size(min = 5)
  String ownerName;

  @Email
  String ownerEmail;

  @PositiveOrZero
  Integer budget;

  @Positive
  Integer activeDays;

}
