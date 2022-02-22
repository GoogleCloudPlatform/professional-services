import {
  Component,
  ElementRef,
  OnInit,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import { MatDialog } from '@angular/material';
import { EntityModalComponent } from '../entity-modal/entity-modal.component';
import { ResultsService } from '../results.service';
import { ToxicityTextSection } from '../toxicity-text-section';

@Component({
  selector: 'app-analysis',
  templateUrl: './analysis.component.html',
  styleUrls: ['./analysis.component.css'],
  encapsulation: ViewEncapsulation.None,
})

/** Class that displays the full output data for reviewing a particular file. */
export class AnalysisComponent implements OnInit {
  phrases: ToxicityTextSection[] = [];
  fullTranscript: string = '';
  @ViewChild('slider') slider: ElementRef;
  sliderValue: number;
  resultsService = new ResultsService();
  fileName: string;
  showSliderFilter: boolean = false;
  histogramData: number[] = [];
  readonly sortOptions = [
    {
      value: ['toxicity', 'ASC'],
      viewValue: 'Toxicity: Low to High',
    },
    {
      value: ['toxicity', 'DESC'],
      viewValue: 'Toxicity: High to Low',
    },
    {
      value: ['start_time', 'ASC'],
      viewValue: 'Start Time: Low to High',
    },
  ];
  selectedSort: string[];
  readonly toxicityLevels = [
    {
      shape: 'lens',
      backgroundColor: '#388E3C',
      max: 1 / 3,
      label: 'Low',
    },
    {
      shape: 'stop',
      backgroundColor: '#FFE57F',
      max: 2 / 3,
      label: 'Mid',
    },
    {
      shape: 'warning',
      backgroundColor: '#E53935',
      max: 1,
      label: 'High',
    },
  ];

  constructor(private readonly dialog: MatDialog) {}

  ngOnInit() {
    this.phrases = this.resultsService.getSegmentToxicity();
    this.sliderValue =
      this.getToxicityBucketIndex(this.phrases[0].toxicity) + 1;
    this.fullTranscript = this.resultsService.getFullTranscript();
    this.fileName = this.resultsService.getFileName();
    this.histogramData = this.mapPhrasesToDataTable();
    this.selectedSort = this.sortOptions[1].value;
  }

  private mapPhrasesToDataTable() {
    let toxicityScoreList: number[] = [];
    this.phrases.forEach((phrase: ToxicityTextSection) => {
      toxicityScoreList.push(phrase.toxicity);
    });
    return toxicityScoreList;
  }

  public toggleFilterSlider() {
    this.showSliderFilter = !this.showSliderFilter;
  }

  private getToxicityBuckets() {
    let toxicityBuckets = [0, 0, 0];
    this.phrases.forEach((phrase: ToxicityTextSection) => {
      const index = this.getToxicityBucketIndex(phrase.toxicity);
      toxicityBuckets[index] += 1;
    });
    return toxicityBuckets;
  }

  private getToxicityBucketIndex(percentile: number) {
    if (percentile <= 1 / 3) {
      return 0;
    } else if (percentile > 1 / 3 && percentile <= 2 / 3) {
      return 1;
    } else {
      return 2;
    }
  }

  private openEntityAnalysis(text: string) {
    const dialogRef = this.dialog.open(EntityModalComponent, {
      width: '70%',
      data: { text: text, fileName: this.fileName },
    });
  }

  public getPhrases() {
    const percentile = this.sliderValue / this.toxicityLevels.length;
    return this.phrases.filter(
      (phrase: ToxicityTextSection) => phrase.toxicity <= percentile
    );
  }

  private formatLabel = (phrases: ToxicityTextSection[]) => {
    return (label: string) => {
      const percentile = this.sliderValue / this.toxicityLevels.length;
      const index = this.getToxicityBucketIndex(percentile);
      return this.toxicityLevels[index].label;
    };
  };

  private getTextPreview(text: string) {
    return text
      .split(/\s+/)
      .slice(0, 20)
      .join(' ');
  }

  private getToxicityColor(toxicity: number) {
    if (toxicity < 1 / 3) {
      return this.toxicityLevels[0].backgroundColor;
    } else if (toxicity >= 1 / 3 && toxicity < 2 / 3) {
      return this.toxicityLevels[1].backgroundColor;
    } else {
      return this.toxicityLevels[2].backgroundColor;
    }
  }

  private getIcon(toxicity: number) {
    if (toxicity < 1 / 3) {
      return this.toxicityLevels[0].shape;
    } else if (toxicity >= 1 / 3 && toxicity < 2 / 3) {
      return this.toxicityLevels[1].shape;
    } else {
      return this.toxicityLevels[2].shape;
    }
  }

  public sortResults() {
    const sortAttribute = this.selectedSort[0];
    const sortDirection = this.selectedSort[1];
    if (sortDirection == 'ASC') {
      this.phrases.sort(
        (obj1: ToxicityTextSection, obj2: ToxicityTextSection) => {
          if (obj1[sortAttribute] > obj2[sortAttribute]) {
            return 1;
          }
          if (obj1[sortAttribute] < obj2[sortAttribute]) {
            return -1;
          } else {
            return 0;
          }
        }
      );
    } else {
      this.phrases.sort(
        (obj1: ToxicityTextSection, obj2: ToxicityTextSection) => {
          if (obj1[sortAttribute] < obj2[sortAttribute]) {
            return 1;
          }
          if (obj1[sortAttribute] > obj2[sortAttribute]) {
            return -1;
          } else {
            return 0;
          }
        }
      );
    }
  }
}
