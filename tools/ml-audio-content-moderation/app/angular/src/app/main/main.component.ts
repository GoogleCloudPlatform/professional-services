import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import {MatDialog, MatPaginator, MatTableDataSource} from '@angular/material';
import { Restangular } from 'ngx-restangular';
import { SelectionModel } from '@angular/cdk/collections';
import { Router } from '@angular/router';
import { ResultsService} from '../results.service';
import {ErrorModalComponent} from '../error-modal/error-modal.component';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.css']
})
export class MainComponent implements OnInit {
  loading: boolean = false;
  file_name: string = "";
  displayedColumns: string[] = ['fileName', 'fileType'];
  dataSource: any = [];
  @ViewChild(MatPaginator) paginator: MatPaginator;
  initialSelection = [];
  allowMultiSelect = false;
  selection = new SelectionModel<any>(this.allowMultiSelect, this.initialSelection);
  resultsService = new ResultsService();

  constructor(private restangular: Restangular,
              private router: Router,
              private dialog: MatDialog) { }

  ngOnInit() {
    this.loading = true;
    this.restangular.one('files')
      .get()
      .toPromise()
      .then(
        (response) => {
          if ('error' in response) {
            let error_message = response.plain()['message'];
            this.openErrorModal(error_message);
          }
          else {
            this.dataSource = new MatTableDataSource<any>(response.plain()['files']);
            this.dataSource.paginator = this.paginator;
            this.loading = false;
          }
        }, (response) => {
          this.loading = false;
          this.openErrorModal('There was an error retrieving files.');
        }
      )
  }

  getFileName(){
    return this.file_name;
  }

  setFileName(name){
    this.file_name = name;
  }

  getSelectedRow(){
    return this.selection.selected[0];
  }

  selectFileToAnalyze(row){
    this.selection.selected[0] = row;
    const selectedFile = this.selection.selected[0];
    this.getAnalysis(selectedFile.name);
  }

  openErrorModal(error){
    const dialogRef = this.dialog.open(
      ErrorModalComponent,
      {
        width: '70%',
        data: {error_message: error}});
  }

  getAnalysis(file){
    this.loading = true;
    const params = {
      'file_name': file
    };
    this.restangular.one('analysis')
      .customGET('', params)
      .toPromise()
      .then(
        (response) => {
          if ('error' in response) {
            let error_message = response.plain()['message'];
            this.openErrorModal(error_message);
          }
          else {
            this.resultsService.setSegmentToxicity(response.plain()['per_segment_toxicity']);
            this.resultsService.setFullTranscript(response.plain()['transcript']);
            this.resultsService.setFileName(response.plain()['file_name']);
            this.loading = false;
            this.router.navigate(['/analysis'], {skipLocationChange: true});
          }
        }, (response) => {
          this.loading = false;
          this.openErrorModal(response);
          console.log('An error occurred retrieving the analysis.');
          console.log('There was an error retrieving the analysis.');
        }
      );
  }

}
