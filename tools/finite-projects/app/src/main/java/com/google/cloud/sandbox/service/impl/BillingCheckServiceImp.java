package com.google.cloud.sandbox.service.impl;

import com.google.cloud.sandbox.service.ProjectBillingService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

@Service
public class BillingCheckServiceImp {

  @Autowired
  private ProjectBillingService projectBillingService ;

  Logger logger = LoggerFactory.getLogger(BillingCheckServiceImp.class);

  @Scheduled(cron = "${schedule.billing.cron}")
  public void checkIfProjectIsAtBillingLimit(){
    projectBillingService.checkActiveProjectLimits();
  }

}
