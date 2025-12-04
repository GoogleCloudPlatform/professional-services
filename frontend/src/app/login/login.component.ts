/**
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {Component, NgZone} from '@angular/core';
import {GoogleAuthProvider} from '@angular/fire/auth';
import {Router} from '@angular/router';
import {AuthService} from './../common/services/auth.service';
import {UserModel} from './../common/models/user.model';
import {MatSnackBar} from '@angular/material/snack-bar';
import { handleErrorSnackbar } from '../utils/handleMessageSnackbar';
import {environment} from '../../environments/environment';

const HOME_ROUTE = '/';

interface LooseObject {
  [key: string]: any;
}

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  private readonly provider: GoogleAuthProvider = new GoogleAuthProvider();

  loader = false;
  invalidLogin = false;
  errorMessage = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    public ngZone: NgZone,
    private _snackBar: MatSnackBar,
  ) {
    this.provider.setCustomParameters({
      prompt: 'select_account',
    });
  }

  ngOnInit(): void {}

  loginWithGoogle() {
    this.loader = true;
    this.invalidLogin = false;
    this.errorMessage = '';

    if (environment?.isLocal) {
      // This will use the Google Identity Services library to get an FIREBASE-compatible token.
      this.authService.signInWithGoogleFirebase().subscribe({
        next: (firebaseToken: string) => {
          // The signInForGoogleIdentityPlatform method already stored the token and minimal user details
          // in localStorage. We just need to redirect to trigger the AuthGuard.
          this.ngZone.run(() => {
            this.loader = false;
            void this.router.navigate([HOME_ROUTE]);
          });
        },
        error: error => {
          this.loader = false;
          console.log(error);
          // Handle specific errors from the auth service
          if (
            error.message?.includes('timed out') ||
            error.message?.includes('Access Denied')
          ) {
            this.handleLoginError(error.message);
          } else {
            this.handleLoginError(
              error ||
                'An unexpected error occurred during sign-in. Please try again.',
            );
          }
          console.error('FIREBASE Login Process Error:', error);
        },
      });
    } else {
      // This will use the Google Identity Services library to get an FIREBASE-compatible token.
      this.authService.signInForGoogleIdentityPlatform().subscribe({
        next: (firebaseToken: string) => {
          // The signInForGoogleIdentityPlatform method already stored the token and minimal user details
          // in localStorage. We just need to redirect to trigger the AuthGuard.
          this.ngZone.run(() => {
            this.loader = false;
            void this.router.navigate([HOME_ROUTE]);
          });
        },
        error: error => {
          this.loader = false;
          console.log(error);
          // Handle specific errors from the auth service
          if (
            error.message?.includes('timed out') ||
            error.message?.includes('Access Denied')
          ) {
            this.handleLoginError(error.message);
          } else {
            this.handleLoginError(
              error ||
                'An unexpected error occurred during sign-in. Please try again.',
            );
          }
          console.error('FIREBASE Login Process Error:', error);
        },
      });
    }
  }

  private handleLoginError(message: string, postErrorAction?: () => void) {
    this.loader = false;
    handleErrorSnackbar(this._snackBar, { message: message }, 'Login Error');
    if (postErrorAction) {
      postErrorAction();
    }
  }

  redirect(user: UserModel) {
    localStorage.setItem('USER_DETAILS', JSON.stringify(user));
    this.loader = false;
    void this.router.navigate([HOME_ROUTE]);
  }
}
