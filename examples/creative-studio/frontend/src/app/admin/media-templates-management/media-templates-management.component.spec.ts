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

import {ComponentFixture, TestBed} from '@angular/core/testing';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {of} from 'rxjs';

import {MediaTemplatesManagementComponent} from './media-templates-management.component';
import {MediaTemplatesService} from './media-templates.service';

describe('MediaTemplatesManagementComponent', () => {
  let component: MediaTemplatesManagementComponent;
  let fixture: ComponentFixture<MediaTemplatesManagementComponent>;
  let mockMediaTemplatesService: jasmine.SpyObj<MediaTemplatesService>;

  beforeEach(async () => {
    mockMediaTemplatesService = jasmine.createSpyObj('MediaTemplatesService', [
      'getMediaTemplates',
    ]);
    mockMediaTemplatesService.getMediaTemplates.and.returnValue(
      of({data: [], count: 0, page: 0, pageSize: 0, totalPages: 0}),
    );

    await TestBed.configureTestingModule({
      imports: [MediaTemplatesManagementComponent, NoopAnimationsModule],
      providers: [
        {provide: MediaTemplatesService, useValue: mockMediaTemplatesService},
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MediaTemplatesManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
