import {HttpClientTestingModule, HttpTestingController} from '@angular/common/http/testing';
import {DebugElement} from '@angular/core';
import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {MatButtonModule, MatCheckboxModule, MatGridListModule, MatIconModule, MatMenuModule} from '@angular/material';
import {MatCardModule} from '@angular/material/card';
import {MatExpansionModule} from '@angular/material/expansion';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatPaginatorModule} from '@angular/material/paginator';
import {MatSelectModule} from '@angular/material/select';
import {MatTableModule} from '@angular/material/table';
import {By} from '@angular/platform-browser';

import {StepDetailsComponent} from './step-details.component';

describe('StepDetailsComponent', () => {
  let component: StepDetailsComponent;
  let fixture: ComponentFixture<StepDetailsComponent>;
  let de: DebugElement;

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
            StepDetailsComponent,
          ],
        })
        .compileComponents();

    fixture = TestBed.createComponent(StepDetailsComponent);
    component = fixture.componentInstance;

    component.steps = [{
      kind: 'kind',
      substeps: ['foo', 'bar'],
    }];
    fixture.detectChanges();
    de = fixture.debugElement;
  }));

  it('should render the header', () => {
    expect(de.query(By.css('mat-card-header')).nativeElement.textContent.trim())
        .toEqual('Step Details');
  });

  it('should render steps', () => {
    expect(de.query(By.css('td.kind')).nativeElement.textContent)
        .toEqual('kind');
    const sub = de.queryAll(By.css('tr.substep > td:first-child'));
    expect(sub[0].nativeElement.textContent).toEqual('foo');
    expect(sub[1].nativeElement.textContent).toEqual('bar');
  });
});
