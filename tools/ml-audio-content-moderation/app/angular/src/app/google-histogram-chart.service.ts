import { Injectable } from '@angular/core';
import { GoogleChartsBaseService } from './google-charts-base.service';
import { HistogramChartConfig} from './histogram-chart-config';


declare var google: any;

@Injectable({
  providedIn: 'root'
})
// export class GoogleHistogramChartService extends GoogleChartsBaseService {
export class GoogleHistogramChartService {

  // constructor() { super(); }
  constructor(){
    google.charts.load('current', {'packages':['corechart']});

  }


  public BuildLineChart(elementId: string, data: any[], config: HistogramChartConfig) : void {

    // var chartFunc = () => { return new chart; };
    var options = {
      title: config.title,
      legend: { position: 'none'},
      hAxis: {
        ticks: [0, (100/9).toFixed(2),
          (200/9).toFixed(2),
          (300/9).toFixed(2),
          (400/9).toFixed(2),
          (500/9).toFixed(2),
          (600/9).toFixed(2),
          (700/9).toFixed(2),
          (800/9).toFixed(2),
          100]
      },
      histogram: {
        hideBucketItems: true,
        // bucketSize: 1/9,
        minValue: 0,
        maxValue: (100 - (100/9))
      },
    };



    // this.buildChart(data, chartFunc, options);


//     var callback = () => draw(chartFunc, options);
//     google.charts.setOnLoadCallback(callback);



  }

  // drawChart(data, options, elementId){
  //   var container = document.getElementById(elementId);
  //   var chart = new google.visualization.Histogram(container);
  //   var datatable = google.visualization.arrayToDataTable(data);
  //
  //     google.visualization.events.addListener(chart, 'ready', function () {
  //       console.log('chart ready');
  //       var observer = new MutationObserver(function() {
  //         var index = 0;
  //         Array.prototype.forEach.call(container.getElementsByTagName('rect'), function() {
  //           console.log('rect');
  //         });
  //       });
  //     });
  //
  //     chart.draw(datatable, options);
  //   };

}
