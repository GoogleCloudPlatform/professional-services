package com.google.cloud.sandbox.service.impl;

import java.io.File;
import java.io.IOException;
import java.util.Date;

import javax.annotation.PostConstruct;
import javax.mail.MessagingException;
import javax.mail.internet.MimeMessage;

import com.google.cloud.sandbox.model.ProjectRecord;
import com.google.cloud.sandbox.service.EmailService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.apache.commons.io.FileUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class EmailServiceImp implements EmailService{
    @Autowired
    private JavaMailSender mailSender;
    
    private String fromEmail;

    public EmailServiceImp(@Value("${spring.mail.username}") String fromEmail) {
        this.fromEmail = fromEmail;
    }
    Logger logger = LoggerFactory.getLogger(ProjectServiceImp.class);

    public void sendEmailNotification (ProjectRecord project) {
        logger.info("------------- Sending email notification -----------");
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message);
        File htmlTemplateFile = new File(getClass().getClassLoader().getResource("html/email_template.html").getFile());
        String htmlsStringTemplate;
		try {
			htmlsStringTemplate = FileUtils.readFileToString(htmlTemplateFile, "UTF-8");
            Date deleteDate= new Date(project.getDelete_at().getTime());
        
            htmlsStringTemplate = htmlsStringTemplate.replace("$_project", project.getId());
            htmlsStringTemplate = htmlsStringTemplate.replace("$_owner",project.getOwn_email());
            htmlsStringTemplate = htmlsStringTemplate.replace("$_date",deleteDate.toString());

            helper.setSubject("Finite Projects , Project Delete Notification");
            helper.setFrom(fromEmail);
            helper.setTo(project.getOwn_email());
    
            helper.setText(htmlsStringTemplate, true);
    
            mailSender.send(message);
		} catch (IOException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		} catch (MessagingException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}

    



    }
}
