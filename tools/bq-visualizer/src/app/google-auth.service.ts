import {Injectable} from '@angular/core';
import {OAuthService} from 'angular-oauth2-oidc';
import {JwksValidationHandler} from 'angular-oauth2-oidc';
import {AuthConfig} from 'angular-oauth2-oidc';

import {environment} from '../environments/environment';

import {LogService} from './log.service';

@Injectable({providedIn: 'root'})
export class GoogleAuthService {
  constructor(private logSvc: LogService, private oauthService: OAuthService) {
    this.configureAuth();
  }

  private async configureAuth() {
    this.logSvc.debug('configureAuth');
    this.oauthService.configure(environment.authConfig);
    this.oauthService.tokenValidationHandler = new JwksValidationHandler();
    return this.oauthService.loadDiscoveryDocumentAndLogin();
  }
}

export class MockOAuthService extends OAuthService {
  configure(config: any): void {}

  configureAuth(): Promise<boolean> {
    return Promise.resolve(true);
  }

  loadDiscoveryDocumentAndLogin(options?: any): Promise<boolean> {
    return Promise.resolve(true);
  }

  getAccessToken(): string {
    return 'fake-oauth-token';
  }
}
