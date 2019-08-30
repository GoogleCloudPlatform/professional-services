import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';

@Component({
  selector: 'app-error-modal',
  templateUrl: './error-modal.component.html',
  styleUrls: ['./error-modal.component.css'],
})

/** Class to create modal displaying an error message. */
export class ErrorModalComponent {
  readonly errorMessage: string;

  constructor(
    private readonly dialogRef: MatDialogRef<ErrorModalComponent>,
    @Inject(MAT_DIALOG_DATA) private readonly data: any
  ) {
    this.errorMessage = data.errorMessage;
  }

  close() {
    this.dialogRef.close();
  }
}
