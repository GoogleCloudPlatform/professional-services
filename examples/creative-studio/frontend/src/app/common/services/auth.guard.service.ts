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

import {inject, Injectable, PLATFORM_ID} from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivate,
  Router,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import {AuthService} from './auth.service';
import {isPlatformBrowser} from '@angular/common';
import {Observable, of} from 'rxjs';

const LOGIN_ROUTE = '/login';
@Injectable({
  providedIn: 'root',
})
export class AuthGuardService implements CanActivate {
  private platformId = inject(PLATFORM_ID);

  constructor(
    private authService: AuthService,
    private router: Router,
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot,
  ):
    | Observable<boolean | UrlTree>
    | Promise<boolean | UrlTree>
    | boolean
    | UrlTree {
    if (!isPlatformBrowser(this.platformId)) {
      // --- SERVER SIDE ---
      // Allow navigation to render the basic app shell.
      // The client will verify localStorage and redirect if necessary.
      console.log(
        'AuthGuard (SSR): Allowing shell render. Client will verify auth.',
      );
      return true;
    }

    // --- BROWSER SIDE ---
    if (!this.authService.isLoggedIn()) {
      void this.router.navigate([LOGIN_ROUTE]);
      return false;
    }

    return true;
  }
}
