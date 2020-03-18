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
import {HttpClientTestingModule, HttpTestingController} from '@angular/common/http/testing';
import {inject, TestBed} from '@angular/core/testing';
import {OAuthModule, OAuthService, UrlHelperService} from 'angular-oauth2-oidc';

import {GoogleAuthService, MockOAuthService} from './google-auth.service';

describe('GoogleAuthService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, OAuthModule.forRoot()],
      providers: [
        GoogleAuthService,
        {provide: OAuthService, useClass: MockOAuthService},
        UrlHelperService,
      ]
    });
  });

  it('should be created',
     inject([GoogleAuthService], (service: GoogleAuthService) => {
       expect(service).toBeTruthy();
     }));
});
