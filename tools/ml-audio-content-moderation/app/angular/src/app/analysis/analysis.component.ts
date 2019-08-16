import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import { ResultsService } from '../results.service';
import {MatDialog } from '@angular/material';
import {EntityModalComponent} from '../entity-modal/entity-modal.component';
import {HistogramChartConfig} from '../histogram-chart-config';


@Component({
  selector: 'app-analysis',
  templateUrl: './analysis.component.html',
  styleUrls: ['./analysis.component.css']
})
export class AnalysisComponent implements OnInit {
  phrases: any = [];
  full_transcript: any = '';
  loading: boolean = false;
  @ViewChild('slider') slider: ElementRef;
  slider_value: number;
  resultsService = new ResultsService();
  file_name: string;
  gcs_uri: string;
  show_slider_filter: boolean = false;
  histogram_config: any;
  histogram_element_id: string;
  histogram_data: any = [];
  sort_options = [
    {
      'value': ['toxicity', 'ASC'],
      'view_value': 'Toxicity: Low to High'
    },
    {
      'value': ['toxicity', 'DESC'],
      'view_value': 'Toxicity: High to Low'
    },
    {
      'value': ['start_time', 'ASC'],
      'view_value': 'Start Time: Low to High'
    }
  ];
  selected_sort: string[];
  toxicity_levels = [{
    'shape':'lens',
    'background_color': '#388E3C',
    'text_color': 'white',
    'max': (1/3),
    'label': 'Low'
  }, {
    'shape': 'stop',
    'background_color': '#FFE57F',
    'text_color': 'black',
    'max': (2/3),
    'label': 'Mid'
  },
    {
      'shape': 'warning',
      'background_color': '#E53935',
      'text_color': 'white',
      'max': 1,
      'label': 'High'
    }
  ];

  constructor(private dialog: MatDialog) { }

  ngOnInit() {
    this.phrases = this.resultsService.getSegmentToxicity();
    this.slider_value = this.getThreshold(this.phrases[0].toxicity) + 1;
    this.full_transcript = this.resultsService.getFullTranscript();
    this.file_name = this.resultsService.getFileName();
    // this.gcs_uri = this.resultsService.getGCSLink();
    this.histogram_config = new HistogramChartConfig('Toxicity Histogram');
    this.histogram_element_id = 'toxicity_histogram';
    this.histogram_data = this.mapPhrasesToDataTable();
    this.selected_sort = this.sort_options[1].value;
  }

  mapPhrasesToDataTable(){
    const data = [];
    this.phrases.forEach((phrase) => {
      data.push(phrase.toxicity);
    });
    return data;
  }


  toggleFilterSlider(){
    this.show_slider_filter = !this.show_slider_filter;
  }

  getToxicityBuckets(){
    const toxicity_buckets = [0, 0, 0];
    this.phrases.forEach( phrase => {
      const index = this.getThreshold(phrase.toxicity);
      toxicity_buckets[index]+= 1;
    });
    return toxicity_buckets;
  }

  getThreshold(percentile){
    if (percentile <= (1/3)) {
      return 0;
    } else if (percentile > (1/3) && percentile <= (2/3)) {
      return 1;
    } else {
      return 2;
    }
  }

  openEntityAnalysis(phrase){
    const dialogRef = this.dialog.open(
      EntityModalComponent,
      {
        width: '70%',
        data: {text: phrase,
               file_name: this.file_name}});
  }

  getPhrases(){
    const percentile = this.slider_value / this.toxicity_levels.length;
    return this.phrases.filter( (phrase) => phrase.toxicity <= percentile );
  }

  formatLabel = (phrases: any) => {
    return (label: string) => {
      const percentile = (this.slider_value / this.toxicity_levels.length);
      const index = this.getThreshold(percentile);
       return this.toxicity_levels[index].label;
    };

  };

  getTextPreview(text){
    return text.split(/\s+/).slice(0,20).join(' ');
  }

  getToxicityColor(toxicity){
    if (toxicity < 0.33) {
      return this.toxicity_levels[0].background_color;
    } else if (toxicity >= 0.33 && toxicity < 0.67){
      return this.toxicity_levels[1].background_color;
    } else {
      return this.toxicity_levels[2].background_color;
    }
  }

  getIcon(toxicity){
    if (toxicity < 0.33) {
      return this.toxicity_levels[0].shape;
    } else if (toxicity >= 0.33 && toxicity < 0.67){
      return this.toxicity_levels[1].shape;
    } else {
      return this.toxicity_levels[2].shape;
    }
  }

  playAudio(){
    let audio = new Audio();
    audio.src = this.gcs_uri;
    audio.load();
    audio.play();
  }

  sortResults(){
    const sort_attribute = this.selected_sort[0];
    const sort_direction = this.selected_sort[1];
    if(sort_direction == 'ASC'){
      this.phrases.sort( (obj1, obj2) => {
        if (obj1[sort_attribute] > obj2[sort_attribute]){
          return 1;
        } if (obj1[sort_attribute] < obj2[sort_attribute]) {
          return -1;
        } else {
          return 0;
        }
      })
    } else {
      this.phrases.sort( (obj1, obj2) => {
        if (obj1[sort_attribute] < obj2[sort_attribute]){
          return 1;
        } if (obj1[sort_attribute] > obj2[sort_attribute]) {
          return -1;
        } else {
          return 0;
        }
      })
    }
  }


}
