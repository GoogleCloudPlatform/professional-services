import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EntityModalComponent } from './entity-modal.component';

describe('EntityModalComponent', () => {
  let component: EntityModalComponent;
  let fixture: ComponentFixture<EntityModalComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EntityModalComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EntityModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
