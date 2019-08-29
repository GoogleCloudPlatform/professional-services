import { Component, Inject, AfterViewInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material';
import { Restangular } from 'ngx-restangular';
import { ErrorModalComponent } from '../error-modal/error-modal.component';

@Component({
  selector: 'app-entity-modal',
  templateUrl: './entity-modal.component.html',
  styleUrls: ['./entity-modal.component.css'],
})

/** Class to create a modal which displays the NLP output for text. */
export class EntityModalComponent implements AfterViewInit {
  sentiments: any = [];
  text: string;
  isLoading: boolean = false;
  highlighted_text: any = [];
  fileName: string;
  readonly entityTypeColors = [
    {
      name: 'ORGANIZATION',
      color: '#4285F4',
    },
    {
      name: 'LOCATION',
      color: '#34A853',
    },
    {
      name: 'CONSUMER_GOOD',
      color: '#A142F4',
    },
    {
      name: 'PERSON',
      color: '#EA4335',
    },
    {
      name: 'OTHER',
      color: '#9AA0A6',
    },
    {
      name: 'EVENT',
      color: '#F29900',
    },
    {
      name: 'ADDRESS',
      color: '#F538A0',
    },
    {
      name: 'NUMBER',
      color: '#185ABC',
    },
    {
      name: 'PRICE',
      color: '#B31412',
    },
    {
      name: 'WORK_OF_ART',
      color: '#FA7B17',
    },
    {
      name: 'DATE',
      color: '#008080',
    },
  ];
  readonly sentimentScoreColors = [
    {
      start: -1.0,
      end: -0.25,
      backgroundColor: '#E53935',
      scaleBackgroundColor: '#E53935',
      textColor: 'white',
      text: 'Negative',
    },
    {
      start: -0.25,
      end: 0.25,
      scaleBackgroundColor: '#FFE57F',
      backgroundColor: '#F29900',
      textColor: 'black',
      text: 'Neutral',
    },
    {
      start: 0.25,
      end: 1.0,
      backgroundColor: '#388E3C',
      scaleBackgroundColor: '#388E3C',
      textColor: 'white',
      text: 'Positive',
    },
  ];

  constructor(
    public readonly dialogRef: MatDialogRef<EntityModalComponent>,
    public restangular: Restangular,
    private readonly dialog: MatDialog,
    @Inject(MAT_DIALOG_DATA) private data: any
  ) {
    this.text = data.text;
    this.fileName = data.fileName;
  }

  private getEntityColor(entity: any) {
    return this.entityTypeColors.find(item => item.name === entity.entity_type)
      .color;
  }

  private getSentimentScoreColor(score: number) {
    return this.sentimentScoreColors.find(
      item => score >= item.start && score < item.end
    ).backgroundColor;
  }

  private formatText() {
    let charArray = this.text.split('');
    charArray.forEach(char => {
      this.highlighted_text.push({
        char: char,
        color: 'grey',
      });
    });
    this.sentiments.forEach((sentiment: any) => {
      const start_index = this.text.indexOf(sentiment.entity_name);
      const end_index = start_index + sentiment.entity_name.length;
      const entity_color = this.getSentimentScoreColor(sentiment.score);
      for (let i = start_index; i <= end_index; i++) {
        this.highlighted_text[i].color = entity_color;
      }
    });
  }

  private openErrorModal(error: string) {
    const dialogRef = this.dialog.open(ErrorModalComponent, {
      width: '70%',
      data: { errorMessage: error },
    });
  }

  close() {
    this.dialogRef.close();
  }

  ngAfterViewInit() {
    this.isLoading = true;
    const params = {
      text: this.text,
      file_name: this.fileName,
    };
    this.restangular
      .one('entities')
      .customGET('', params)
      .toPromise()
      .then(
        (response: any) => {
          if ('error' in response) {
            let errorMessage = response.plain()['message'];
            this.openErrorModal(errorMessage);
          } else {
            this.sentiments = response.plain()['sentiment_result'];
            this.formatText();
            this.isLoading = false;
          }
        },
        (response: any) => {
          this.isLoading = false;
          this.openErrorModal('Failed to retrieve entity information.');
        }
      );
  }
}
