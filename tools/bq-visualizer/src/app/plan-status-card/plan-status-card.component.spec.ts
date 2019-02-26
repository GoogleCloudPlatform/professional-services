import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {FormsModule} from '@angular/forms';
import {MatButtonModule, MatCheckboxModule, MatGridListModule, MatIconModule, MatMenuModule} from '@angular/material';
import {MatCardModule} from '@angular/material/card';
import {MatExpansionModule} from '@angular/material/expansion';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatPaginatorModule} from '@angular/material/paginator';
import {MatSelectModule} from '@angular/material/select';
import {MatTableModule} from '@angular/material/table';
import {MatTabsModule} from '@angular/material/tabs';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {RouterTestingModule} from '@angular/router/testing';
import {PlanStatusCardComponent} from './plan-status-card.component';

describe('PlanStatusCardComponent', () => {
  let component: PlanStatusCardComponent;
  let fixture: ComponentFixture<PlanStatusCardComponent>;

  beforeEach(async(() => {
    TestBed
        .configureTestingModule({
          imports: [
            MatTabsModule,
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
            FormsModule,
            RouterTestingModule,
            BrowserAnimationsModule,
          ],
          declarations: [PlanStatusCardComponent]
        })
        .compileComponents();

    fixture = TestBed.createComponent(PlanStatusCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
