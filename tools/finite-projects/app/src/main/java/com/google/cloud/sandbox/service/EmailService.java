package com.google.cloud.sandbox.service;

import com.google.cloud.sandbox.model.ProjectRecord;

public interface EmailService {
    void sendEmailNotification(ProjectRecord project);
}
