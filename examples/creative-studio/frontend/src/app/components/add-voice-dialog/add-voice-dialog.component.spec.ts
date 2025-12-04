import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddVoiceDialogComponent } from './add-voice-dialog.component';

describe('AddVoiceDialogComponent', () => {
  let component: AddVoiceDialogComponent;
  let fixture: ComponentFixture<AddVoiceDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AddVoiceDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddVoiceDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
