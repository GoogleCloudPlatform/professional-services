import {Component, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material';

@Component({
  selector: 'app-error-modal',
  templateUrl: './error-modal.component.html',
  styleUrls: ['./error-modal.component.css']
})
export class ErrorModalComponent implements OnInit {
  error_message: string;

  constructor(public dialogRef: MatDialogRef<ErrorModalComponent>,
              @Inject(MAT_DIALOG_DATA) private data) {
    this.error_message = data.error_message;
  }

  close(){
    this.dialogRef.close();
  }

  ngOnInit() {
  }

}
