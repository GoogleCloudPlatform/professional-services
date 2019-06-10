/*
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
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
