import {HttpClientTestingModule, HttpTestingController} from '@angular/common/http/testing';
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
