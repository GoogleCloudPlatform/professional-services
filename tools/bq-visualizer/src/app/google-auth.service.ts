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
import {EventEmitter, Injectable, NgZone} from '@angular/core';
import {OAuthService} from 'angular-oauth2-oidc';
import {JwksValidationHandler} from 'angular-oauth2-oidc-jwks';
import {AuthConfig, LoginOptions, OAuthErrorEvent} from 'angular-oauth2-oidc';
//import { accounts } from 'google-one-tap';
import {environment} from '../environments/environment';

import {LogService} from './log.service';
import { env } from 'process';

@Injectable({providedIn: 'root'})
export class GoogleAuthService {
  loginEvent = new EventEmitter<boolean>();

  constructor(private logSvc: LogService, private oauthService: OAuthService, private _ngZone: NgZone) {
     
    //this.oauthService.initCodeFlow();
    logSvc.info("GoogleAuthService constructor")
    //this.oauthService.initLoginFlow();
    oauthService.events.subscribe(event => {
      if (event instanceof OAuthErrorEvent) {
        console.error('OAuthErrorEvent Object:', event);
        logSvc.error('OAuthErrorEvent Object:' + JSON.stringify(event));
      } else {
        console.warn('OAuthEvent Object:', JSON.stringify(event));
        logSvc.warn('OAuthEvent Object:' + JSON.stringify(event));
      }
    });
    //this.logSvc.debug('this.oauthService.configure(environment.authConfig)');
    /*try{
      oauthService.configure(environment.authConfig);
    } catch(error:any){
      this.logSvc.error(error);
      
    }
    */
    logSvc.info('Logged in: ' + this.isLoggedIn());
    console.log('find google auth library'); 

    /*
    oauthService.loadDiscoveryDocument().then( () =>{
      oauthService.tryLoginCodeFlow().then( () =>{
        if (!oauthService.hasValidAccessToken()){
          console.log("google-auth-svc::constuctor: not logged in calling initLogiFlow")
          oauthService.initLoginFlow();
        } else{
          console.log("google-auth-svc::constuctor: logged in calling loadUserProfile")
          oauthService.loadUserProfile().then((userProfile) =>{
            console.log('logged in')
            console.log(JSON.stringify(userProfile));
          })
        }
      })
    })
    */
    //this.configureAuth();
    //console.log('GoogleAuthService: hasValidAccessToken: ' + this.oauthService.hasValidAccessToken())
  }

  public async login() {
  /*
      const gAccounts: accounts = google.accounts;
    console.log('New Login start')
    gAccounts.id.initialize({
      client_id: environment.authConfig.clientId,
      ux_mode: 'popup',
      cancel_on_tap_outside: true,
      callback: ({ credential }) => {
        this._ngZone.run(() => {
          this._loginWithGoogle(credential);
        });
      },
    });
    console.log(gAccounts.id);
    */
    
    //this.logSvc.debug('this.oauthService.configure(environment.authConfig)');
    //this.oauthService.configure(environment.authConfig);
    await this.new_configureAuth();
  }

  private async new_configureAuth(){
    try{
      this.logSvc.info("configuring using eng: "+ environment.name)
      this.oauthService.configure(environment.authConfig);
    } catch( error:any){
      this.logSvc.error("failed to configure oauthService");
      this.logSvc.error(error);
    }
    const options = new LoginOptions();
    options.onLoginError = (msg)=>{"oauth login error " + this.logSvc.error(JSON.stringify(msg));};
    options.onTokenReceived = (msg)=>{"oauth recieved token: " + this.logSvc.info(JSON.stringify(msg));};

    this.logSvc.debug('about to this.oauthService.loadDiscoveryDocument()');
    try{
      this.oauthService.loadDiscoveryDocumentAndLogin(options); 
    /*  
      this.oauthService.loadDiscoveryDocument().then( () =>{
      this.logSvc.debug('about to tryLoginCodeFlow');
      const options = new LoginOptions();
      options.onLoginError = (msg)=>{"oauth login error " + this.logSvc.error(JSON.stringify(msg));};
      options.onTokenReceived = (msg)=>{"oauth recieved token: " + this.logSvc.info(JSON.stringify(msg));};
      // options.preventClearHashAfterLogin=true;
      
      this.oauthService.tryLoginImplicitFlow( ).then( () =>{
        this.logSvc.debug('checking for validAccessToken');
        if (!this.oauthService.hasValidAccessToken()){
          this.logSvc.info("google-auth-svc::login: not logged in calling initLogiFlow")
          this.oauthService.initLoginFlow();
        } else{
          this.logSvc.debug("google-auth-svc::login: logged in, now calling loadUserProfile")
          this.oauthService.loadUserProfile().then((userProfile) =>{
            this.logSvc.info('google-auth-svc::login: user profile')
            this.logSvc.info(JSON.stringify(userProfile));
          })
        }
      })
    });*/
    } catch (error:any){
      this.logSvc.error(error);
    }

  }
  private _loginWithGoogle(token: string) {
    this.logSvc.info('LoginWith Google responded with ' + token)
  }
  public async oldlogin() {
    //console.log('GoogleAuthService::login calling isLoggedIn')
    console.log('login');
    //console.log(environment.authConfig);
    this.logSvc.info('GoogleAuthService:: login  ')
    this.logSvc.info(JSON.stringify(environment.authConfig));
   
    //if (this.isLoggedIn() === false) {
      //this.logSvc.info('GoogleAuthService:: login  calling configureAuth ')
      //await this.configureAuth();
    
    //}
    //this.oauthService.initCodeFlow()
    //this.oauthService.initLoginFlow();
    await this.configureAuth();
    this.logSvc.info('GoogleAuthService:: login done  ')
    return true;
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

  getAccessToken(): string|null {
    this.logSvc.info("Abput to get access token") ;
    try{
      return this.oauthService.getAccessToken();
    }catch(error:any){
      this.logSvc.error("error getting accessToken") ;
      this.logSvc.error(JSON.stringify(error)) ;

    }
    return null;
  }

  private async configureAuth() {
    this.logSvc.debug('configureAuth. with config =');
    this.logSvc.debug(JSON.stringify(environment.authConfig,null, 4));
    this.oauthService.configure(environment.authConfig);

    this.oauthService.tokenValidationHandler = new JwksValidationHandler();
    let options = new LoginOptions();
    options.onLoginError=(err) =>{alert('onLoginError ' +JSON.stringify(err)) }
    options.onTokenReceived = (token) => {console.log('token recieved'); console.log(token)}
    //options.disableNonceCheck=true;
    console.debug('oauthservice:')
    console.debug(this.oauthService);
    const result = await this.oauthService.loadDiscoveryDocumentAndLogin(options);
    //console.log('GoogleAuthService::configureAuth: result=')
    console.log('configureAuth done');
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
