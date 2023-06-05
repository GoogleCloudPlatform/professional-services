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
import {EventEmitter, Injectable} from '@angular/core';
import {OAuthService} from 'angular-oauth2-oidc';
import {JwksValidationHandler} from 'angular-oauth2-oidc-jwks';
import {AuthConfig, LoginOptions} from 'angular-oauth2-oidc';

import {environment} from '../environments/environment';

import {LogService} from './log.service';

@Injectable({providedIn: 'root'})
export class GoogleAuthService {
  loginEvent = new EventEmitter<boolean>();

  constructor(private logSvc: LogService, private oauthService: OAuthService) {
    //this.oauthService.initCodeFlow();
    this.oauthService.initLoginFlow();
  }

  public async login() {
    //console.log('GoogleAuthService::login calling isLoggedIn')
    if (this.isLoggedIn() === false) {
      await this.configureAuth();
    }
  }
  public isLoggedIn(): boolean {
    //console.log('GoogleAuthService::isLoggedin: ' + this.oauthService.hasValidAccessToken())
    return this.oauthService.hasValidAccessToken();
  }
  public logout() {
    //console.log('GoogleAuthService::logout calling isLoggedIn')
    
    if (this.isLoggedIn()) {
      this.oauthService.logOut();
      this.loginEvent.emit(false);
    }
  }

  getAccessToken(): string {
    return this.oauthService.getAccessToken();
  }

  private async configureAuth() {
    this.logSvc.debug('configureAuth');
    this.oauthService.configure(environment.authConfig);
    this.oauthService.tokenValidationHandler = new JwksValidationHandler();
    let options = new LoginOptions();
    options.disableNonceCheck=true;
    const result = await this.oauthService.loadDiscoveryDocumentAndTryLogin(options);
    //console.log('GoogleAuthService::configureAuth: result=')
    console.debug(result)
    this.loginEvent.emit(result);
    return result;
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
