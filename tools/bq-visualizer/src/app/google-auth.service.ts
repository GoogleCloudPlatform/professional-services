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
import { EventEmitter, Injectable, NgZone } from '@angular/core';
import { OAuthService } from 'angular-oauth2-oidc';
import { JwksValidationHandler } from 'angular-oauth2-oidc-jwks';
import { AuthConfig, LoginOptions, OAuthErrorEvent } from 'angular-oauth2-oidc';
//import { accounts } from 'google-one-tap';
import { environment } from '../environments/environment';

import { LogService } from './log.service';
import { env } from 'process';

@Injectable({ providedIn: 'root' })
export class GoogleAuthService {
  loginEvent = new EventEmitter<boolean>();

  constructor(private logSvc: LogService, private oauthService: OAuthService, private _ngZone: NgZone) {

    logSvc.info("GoogleAuthService constructor")
    oauthService.events.subscribe(event => {
      if (event instanceof OAuthErrorEvent) {
        console.error('OAuthErrorEvent Object:', event);
        logSvc.error('OAuthErrorEvent Object:' + JSON.stringify(event));
      } else {
        //console.debug('OAuthEvent Object:', JSON.stringify(event));
        logSvc.debug('OAuthEvent Object:' + JSON.stringify(event));
      }
    });

    logSvc.info('Logged in: ' + this.isLoggedIn());
    //console.log('find google auth library');
  }

  public async login() {
    await this.configureAuth();
  }

  private async configureAuth() {
    try {
      this.logSvc.info("configuring using eng: " + environment.name)
      this.oauthService.configure(environment.authConfig);
    } catch (error: any) {
      this.logSvc.error("failed to configure oauthService");
      this.logSvc.error(error);
    }
    const options = new LoginOptions();
    options.onLoginError = (msg) => { "oauth login error " + this.logSvc.error(JSON.stringify(msg)); };
    options.onTokenReceived = (msg) => { "oauth recieved token: " + this.logSvc.info(JSON.stringify(msg)); };

    this.logSvc.debug('about to this.oauthService.loadDiscoveryDocumentAndLogin()');
    try {
      const result = await this.oauthService.loadDiscoveryDocumentAndLogin(options);
      this.loginEvent.emit(result);
    } catch (error: any) {
      this.logSvc.error(error);
    }

  }
  public isLoggedIn(): boolean {
    console.log('GoogleAuthService::isLoggedin: ' + this.oauthService.hasValidAccessToken())
    return this.oauthService.hasValidAccessToken();
  }
  public logout() {
    //console.log('GoogleAuthService::logout calling isLoggedIn')

    if (this.isLoggedIn()) {
      this.oauthService.logOut();
      this.loginEvent.emit(false);
    }
  }

  getAccessToken(): string | null {
    this.logSvc.info("Abput to get access token");
    try {
      return this.oauthService.getAccessToken();
    } catch (error: any) {
      this.logSvc.error("error getting accessToken");
      this.logSvc.error(JSON.stringify(error));

    }
    return null;
  }

}

export class MockOAuthService extends OAuthService {
  configure(config: any): void { }

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
