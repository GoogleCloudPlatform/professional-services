package com.google.cloud.sandbox.service.impl;

import com.google.cloud.sandbox.model.ProjectRecord;
import com.google.cloud.sandbox.repository.ProjectRepository;

import com.google.cloud.sandbox.service.EmailService;
import com.google.cloud.sandbox.service.ProjectService;
import java.sql.Timestamp;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;

import org.springframework.stereotype.Service;

@Service
public class DeleteCheckServiceImp {
    
    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private ProjectService projectService;

    @Autowired
    private EmailService emailService;

    Logger logger = LoggerFactory.getLogger(DeleteCheckServiceImp.class);

    @Scheduled(cron = "${schedule.expired.cron}")
    public void checkIfProjectIsExpired(){
        logger.info("Running job to check for expired projects");
        List<ProjectRecord> listOfProjects = projectRepository.findByActive(true);
        logger.info(listOfProjects.size()+ " active projects records found");
        listOfProjects.stream()
            .filter(r -> r.getDelete_at().before(Timestamp.from(Instant.now())))
            .forEach( r-> projectService.deleteProject(r));
    }

    @Scheduled(cron = "${schedule.to.be.expired.cron}")
    public void checkProjectToBeExpired(){
        logger.info("Verify project to be expired in 3 days");
        List<ProjectRecord> listOfProjects = projectRepository.findByActive(true);
        LocalDate todayDate = LocalDateTime.now().toLocalDate();
        logger.info("today date "+ todayDate);
        listOfProjects.stream()
            .filter(r -> r.getDelete_at().toLocalDateTime().minusDays(3).toLocalDate().isEqual(todayDate))
            .forEach( r-> { emailService.sendEmailNotification(r);
			});
    }
}
