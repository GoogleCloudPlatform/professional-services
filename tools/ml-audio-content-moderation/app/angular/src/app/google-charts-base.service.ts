import { Injectable } from '@angular/core';

declare var google: any;

@Injectable({
  providedIn: 'root'
})
export class GoogleChartsBaseService {

  constructor() {
    google.charts.load('current', {'packages':['corechart']});
  }

  protected buildChart(data: any[], chartFunc: any, options: any) : void {
    var func = (chartFunc, options) => {

      var datatable = google.visualization.arrayToDataTable(data);

      chartFunc().draw(datatable, options);
    };
    var callback = () => func(chartFunc, options);
    google.charts.setOnLoadCallback(callback);
  }


}
