package com.google.cloud.imf.gzos

import com.google.auth.oauth2.GoogleCredentials

trait CredentialProvider {
  def getCredentials: GoogleCredentials
}
