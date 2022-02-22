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
import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {MatButtonModule} from '@angular/material/button';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {MatGridListModule} from '@angular/material/grid-list';
import {MatIconModule} from '@angular/material/icon';
import {MatMenuModule} from '@angular/material/menu';
import {MatCardModule} from '@angular/material/card';
import {MatExpansionModule} from '@angular/material/expansion';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatPaginatorModule} from '@angular/material/paginator';
import {MatSelectModule} from '@angular/material/select';
import {MatTableModule} from '@angular/material/table';
import {By} from '@angular/platform-browser';

import {StageDetailsComponent} from './stage-details.component';

describe('StageDetailsComponent', () => {
  let component: StageDetailsComponent;
  let fixture: ComponentFixture<StageDetailsComponent>;

  beforeEach(async(() => {
    TestBed
        .configureTestingModule({
          imports: [
            HttpClientTestingModule,
            MatGridListModule,
            MatFormFieldModule,
            MatButtonModule,
            MatCheckboxModule,
            MatSelectModule,
            MatCardModule,
            MatExpansionModule,
            MatInputModule,
            MatPaginatorModule,
            MatTableModule,
            MatGridListModule,
            MatMenuModule,
            MatIconModule,
          ],
          declarations: [
            StageDetailsComponent,
          ],
        })
        .compileComponents();

    fixture = TestBed.createComponent(StageDetailsComponent);
    component = fixture.componentInstance;
  }));

  it('should render text', () => {
    component.details = 'hello world';
    fixture.detectChanges();
    const de = fixture.debugElement
    expect(de.query(By.css('mat-card-title')).nativeElement.textContent.trim())
        .toEqual('Stage Details');
    expect(de.query(By.css('mat-card-content > pre')).nativeElement.textContent)
        .toEqual('hello world');
  });
});
