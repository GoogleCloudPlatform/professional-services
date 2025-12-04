import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-add-voice-dialog',
  templateUrl: './add-voice-dialog.component.html',
  styleUrls: ['./add-voice-dialog.component.scss']
})
export class AddVoiceDialogComponent {
  voiceName = '';
  file1: File | null = null;
  file2: File | null = null;

  constructor(public dialogRef: MatDialogRef<AddVoiceDialogComponent>) {}

  onFileSelected(event: any, sampleNum: number) {
    const file = event.target.files[0];
    if (file) {
      if (sampleNum === 1) this.file1 = file;
      else this.file2 = file;
    }
  }

  submit() {
    // Here you would usually create FormData to send to backend
    this.dialogRef.close({
      name: this.voiceName,
      sample1: this.file1,
      sample2: this.file2
    });
  }
}
