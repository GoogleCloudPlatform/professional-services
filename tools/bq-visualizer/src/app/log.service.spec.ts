import {inject, TestBed} from '@angular/core/testing';
import {LogService} from './log.service';

describe('LogService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({providers: [LogService]});
  });

  it('should be created', inject([LogService], (service: LogService) => {
       expect(service).toBeTruthy();
     }));
});
