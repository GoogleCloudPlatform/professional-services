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
import { Component } from '@angular/core';
import { GoogleAuthService } from './google-auth.service';
import { LogService } from './log.service';



@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {

  title = 'BQ Visualiser';
  isLoggedIn = false;
  constructor(private googleAuthService: GoogleAuthService, private logSvc: LogService) {
    this.googleAuthService.loginEvent.subscribe(
      (isloggedIn: boolean) => this.register_login(isloggedIn));

    this.isLoggedIn = this.googleAuthService.isLoggedIn();
  }



  /* event handler to recognise a login or logout event has occurred */
  private register_login(what: boolean) {
    this.isLoggedIn = what;
    //console.log('AppComponent::registered_login: ' + what)
  }
  public login() {
    //console.log('AppComponent::login calling googleAuthService.login')
    this.googleAuthService.login();
  }

  public logout() {
    console.log('AppComponent::logout calling googleAuthService.logout')
    this.googleAuthService.logout();
  }
  /*
  get isLoggedIn() {
    return this.googleAuthService.isLoggedIn();
  }
  */
}
