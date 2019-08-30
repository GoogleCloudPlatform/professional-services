import { SelectionModel } from '@angular/cdk/collections';
import { Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog, MatPaginator, MatTableDataSource } from '@angular/material';
import { Router } from '@angular/router';
import { Restangular } from 'ngx-restangular';
import { ResultsService } from '../results.service';
import { ErrorModalComponent } from '../error-modal/error-modal.component';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.css'],
})

/** Class for the main landing page, which displays processed files. */
export class MainComponent implements OnInit {
  isLoading: boolean = false;
  fileName: string = '';
  readonly displayedColumns: string[] = ['fileName', 'fileType'];
  dataSource: any = [];
  @ViewChild(MatPaginator) paginator: MatPaginator;
  initialSelection: object[] = [];
  readonly allowMultiSelect: boolean = false;
  selection = new SelectionModel<any>(
    this.allowMultiSelect,
    this.initialSelection
  );
  resultsService = new ResultsService();

  constructor(
    private readonly restangular: Restangular,
    private readonly router: Router,
    private readonly dialog: MatDialog
  ) {}

  ngOnInit() {
    this.isLoading = true;
    this.restangular
      .one('files')
      .get()
      .toPromise()
      .then(
        (response: any) => {
          if ('error' in response) {
            let errorMessage = response.plain()['message'];
            this.openErrorModal(errorMessage);
          } else {
            this.dataSource = new MatTableDataSource<any>(
              response.plain()['files']
            );
            this.dataSource.paginator = this.paginator;
            this.isLoading = false;
          }
        },
        (response: any) => {
          this.isLoading = false;
          this.openErrorModal('There was an error retrieving files.');
        }
      );
  }

  getFileName() {
    return this.fileName;
  }

  private setFileName(name: string) {
    this.fileName = name;
  }

  private getSelectedRow() {
    return this.selection.selected[0];
  }

  private selectFileToAnalyze(row: object) {
    this.selection.selected[0] = row;
    const selectedFile = this.selection.selected[0];
    this.getAnalysis(selectedFile.name);
  }

  private openErrorModal(error: string) {
    const dialogRef = this.dialog.open(ErrorModalComponent, {
      width: '70%',
      data: { error_message: error },
    });
  }

  private getAnalysis(fileName: string) {
    this.isLoading = true;
    const params = {
      file_name: fileName,
    };
    this.restangular
      .one('analysis')
      .customGET('', params)
      .toPromise()
      .then(
        (response: any) => {
          if ('error' in response) {
            let errorMessage = response.plain()['message'];
            this.openErrorModal(errorMessage);
          } else {
            this.resultsService.setSegmentToxicity(
              response.plain()['per_segment_toxicity']
            );
            this.resultsService.setFullTranscript(
              response.plain()['transcript']
            );
            this.resultsService.setFileName(response.plain()['file_name']);
            this.isLoading = false;
            this.router.navigate(['/analysis'], { skipLocationChange: true });
          }
        },
        (response: any) => {
          this.isLoading = false;
          this.openErrorModal('There was an error retrieving the analysis.');
          console.log('An error occurred retrieving the analysis.');
        }
      );
  }
}
