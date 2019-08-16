import {Component, ElementRef, Input, ViewChild, ViewEncapsulation} from '@angular/core';
import * as d3 from 'd3';

declare var google: any;

@Component({
  selector: 'app-histogram',
  templateUrl: './histogram.component.html',
  styleUrls: ['./histogram.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class HistogramComponent {
  @ViewChild('chart') private chartContainer:ElementRef;
  @Input() private histogram_data:Array<number>;

  private margin:any = {top: 20, bottom: 20, left: 20, right: 20};
  private chart:any;
  private svg:any;
  private width;
  private height;
  private data;

  constructor() { }

  createChart() {
    let element = this.chartContainer.nativeElement;
    this.width = element.offsetWidth - this.margin.left - this.margin.right;
    this.height = 220 - this.margin.top - this.margin.bottom;
    this.svg = d3.select(element).append('svg')
      .attr('width', this.width + this.margin.left + this.margin.right)
      .attr('height', this.height + this.margin.top + this.margin.bottom);

    // chart plot area
    this.chart = this.svg.append('g')
      .attr(
        'transform',
        'translate(' + this.margin.left +',' + this.margin.top + ')');
  }

  updateChart() {
    this.data = this.histogram_data;

    let x = d3.scaleLinear<number>().rangeRound([0, this.width]);

    let datagenerator = d3.histogram<number, number>()
      .domain([x.domain()[0], x.domain()[1]])
      .thresholds([0, (1/9), (2/9), (3/9), (4/9), (5/9), (6/9), (7/9), (8/9), (9/9), (10/9)]);

    let bins = datagenerator(this.data);

    let y = d3.scaleLinear<number>()
      .domain([0, d3.max(bins, d => { return d.length; })])
      .range([this.height, 0]);

    let bar = this.chart.selectAll(".bar")
      .data(bins)
      .enter().append("g")
      .attr("class", "bar")
      .attr("transform", d => {
        return "translate(" + x(d.x0) + "," + y(d.length) + ")";
      });

    let barWidth = x(bins[0].x1) - x(bins[0].x0) - 1;

    bar.append("rect")
      .attr('class', d => { return 'bar-' + this.getThreshold(d.x1); })
      .attr("x", 1)
      .attr("width", barWidth)
      .attr("height", d =>  { return this.height - y(d.length); });

    let textLoc = (x(bins[0].x1) - x(bins[0].x0)) / 2;

    bar.append("text")
      .attr('class', d => { return 'text-' + this.getThreshold(d.x1); })
      .attr("dy", ".75em")
      .attr("y", 6)
      .attr("x", textLoc)
      .attr("text-anchor", "middle")
      .text(d => { return this.formatBucketCount(d.length); });


    var xaxis = d3.axisBottom(x)
      .tickValues(d3.range(0, (11/9), (1/9)))
      .tickFormat(d => {return (d * 100).toFixed(2) + '%';});

    this.chart.append("g")
      .attr("class", "axis axis--x")
      .attr("transform", "translate(0," + this.height + ")")
      .call(xaxis);

  }

  formatBucketCount(count){
    if(count > 0){
      return count;
    } else {
      return '';
    }
  }

  getThreshold(percentile){
    if (percentile <= (1/3)) {
      return '0';
    } else if (percentile > (1/3) && percentile <= (2/3)) {
      return '1';
    } else {
      return '2';
    }
  }

  ngAfterViewInit() {
    this.createChart();
    this.updateChart();
  }

}
