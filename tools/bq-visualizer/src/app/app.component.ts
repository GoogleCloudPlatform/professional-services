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
import { Component, ViewChild, NgZone } from '@angular/core';
import { GoogleAuthService } from './google-auth.service';
import { environment } from '../environments/environment';
import { LogService } from './log.service';
//import { accounts } from 'google-one-tap';
//import { accounts } from 'google.accounts';



@Component({
  selector: 'app-root', 
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {

  title = 'BQ Visualiser';
  //client:google.oauth2.CodeClient = null;
  xxxisLoggedIn = false;
  constructor(private googleAuthService: GoogleAuthService, private logSvc: LogService, private _ngZone: NgZone) {
    //console.log(environment.authConfig);
    //console.log(this);
    //this.googleAuthService.loginEvent.subscribe(
    //    (isloggedIn: boolean) => this.register_login(isloggedIn));

    //this.isLoggedIn = this.googleAuthService.isLoggedIn();

    /*this.client = oauth2.initCodeClient({
      client_id: environment.authConfig.clientId,
      scope: environment.authConfig.scope,
      ux_mode: 'popup',
      callback: (response: any) => {
        console.log(' call back with response ' + JSON.stringify(response, null, 3))
      },
    });*/
  }

  ngAfterViewInit() {
    this.setGoogleBtn();
  }

  public setGoogleBtn() {
    /* const gAccounts: accounts = google.accounts;
 
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
 
     gAccounts.id.renderButton(document.getElementById('gloginBtn') as HTMLElement, {
       size: 'large',
       width: 320,
     });*/
  }

  private _loginWithGoogle(token: string) {
    console.log('LoginEvent: ' + token)
  }


  /* event handler to recognise a login or logout event has occurred */
  private register_login(what: boolean) {
    this.xxxisLoggedIn = what;
    //console.log('AppComponent::registered_login: ' + what)
  }
  public login() {
    console.log('AppComponent::login calling googleAuthService.login')
    this.googleAuthService.login();
    
  }

  public logout() {
    console.log('AppComponent::logout calling googleAuthService.logout')

    this.googleAuthService.logout();
  }

  get isLoggedIn() {
    return this.googleAuthService.isLoggedIn();
  }
}
