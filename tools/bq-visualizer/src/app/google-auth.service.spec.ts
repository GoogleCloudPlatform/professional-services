import {HttpClientTestingModule, HttpTestingController} from '@angular/common/http/testing';
import {inject, TestBed} from '@angular/core/testing';
import {OAuthService, UrlHelperService} from 'angular-oauth2-oidc';

import {GoogleAuthService, MockOAuthService} from './google-auth.service';

describe('GoogleAuthService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
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
