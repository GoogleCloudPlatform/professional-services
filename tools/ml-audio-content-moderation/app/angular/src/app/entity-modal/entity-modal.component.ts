import {Component, Inject, AfterViewInit } from '@angular/core';
import {MAT_DIALOG_DATA, MatDialog, MatDialogRef} from '@angular/material';
import {Restangular} from 'ngx-restangular';
import {ErrorModalComponent} from '../error-modal/error-modal.component';

@Component({
  selector: 'app-entity-modal',
  templateUrl: './entity-modal.component.html',
  styleUrls: ['./entity-modal.component.css']
})
export class EntityModalComponent {
  sentiments: any = [];
  text: string;
  loading: boolean = false;
  highlighted_text: any = [];
  file_name: string;

  entity_type_colors = [{
    'name': 'ORGANIZATION',
    'color': '#4285F4'
  },{
    'name': 'LOCATION',
    'color': '#34A853'
  },{
    'name': 'CONSUMER_GOOD',
    'color': '#A142F4'
  }, {
    'name': 'PERSON',
    'color': '#EA4335'
  }, {
    'name': 'OTHER',
    'color': '#9AA0A6'
  },
    {
      'name': 'EVENT',
      'color': '#F29900'
    },
    {
      'name': 'ADDRESS',
      'color': '#F538A0'
    },
    {
      'name': 'NUMBER',
      'color': '#185ABC'
    },
    {
      'name': 'PRICE',
      'color': '#B31412'
    },
    {
      'name': 'WORK_OF_ART',
      'color': '#FA7B17'
    },{
      'name': 'DATE',
      'color': '#008080'
    }
  ];
  sentiment_score_colors = [
    {'start': -1.0,
      'end': -0.25,
      'background_color': '#E53935',
      'scale_background_color': '#E53935',
      'text_color': 'white',
      'text': 'Negative'
    },
    {'start': -0.25,
      'end': 0.25,
      'scale_background_color': '#FFE57F',
      'background_color': '#F29900',
      'text_color': 'black',
      'text': 'Neutral'
    },
    {
      'start': 0.25,
      'end': 1.0,
      'background_color': '#388E3C',
      'scale_background_color': '#388E3C',
      'text_color': 'white',
      'text': 'Positive'
    }
  ];

  constructor(public dialogRef: MatDialogRef<EntityModalComponent>,
              public restangular: Restangular,
              private dialog: MatDialog,
              @Inject(MAT_DIALOG_DATA) private data) {
    this.text = data.text;
    this.file_name = data.file_name;
  }

  getEntityColor(entity){
    return this.entity_type_colors.find(item => item.name === entity.entity_type).color;
  }

  getSentimentScoreColor(score){
    return this.sentiment_score_colors.find(item => score >= item.start && score < item.end).background_color;
  }

  formatText(){
    var charArray = this.text.split('');
    charArray.forEach( char => {
      this.highlighted_text.push({
        'char': char,
        'color': 'grey'
      })
    });
    this.sentiments.forEach( sentiment => {
      const start_index = this.text.indexOf(sentiment.entity_name);
      const end_index = start_index + sentiment.entity_name.length;
      const entity_color = this.getSentimentScoreColor(sentiment.score);
      for (var i=start_index; i <= end_index; i++){
        this.highlighted_text[i].color = entity_color;
      }
    });

  }

  openErrorModal(error){
    const dialogRef = this.dialog.open(
      ErrorModalComponent,
      {
        width: '70%',
        data: {error_message: error}});
  }

  close() {
    this.dialogRef.close();
  }

  ngAfterViewInit() {
    this.loading = true;
    const params = {
      'text': this.text,
      'file_name': this.file_name
    };
    this.restangular.one('entities')
      .customGET('', params)
      .toPromise()
      .then( (response) => {
        if ('error' in response) {
          let error_message = response.plain()['message'];
          this.openErrorModal(error_message);
        }
        else {
          this.sentiments = response.plain()['sentiment_result'];
          this.formatText();
          this.loading = false;
        }
      }, (response) => {
        this.loading = false;
      } )
  }

}
