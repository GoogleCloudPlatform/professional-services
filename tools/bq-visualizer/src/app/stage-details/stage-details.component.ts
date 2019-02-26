import {Component, Input, OnInit} from '@angular/core';

@Component({
  selector: 'app-stage-details',
  templateUrl: './stage-details.component.html',
  styleUrls: ['./stage-details.component.css']
})
export class StageDetailsComponent {
  @Input() details: string = '';
}
