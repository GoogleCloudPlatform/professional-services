import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import * as d3 from 'd3';

@Component({
  selector: 'app-histogram',
  templateUrl: './histogram.component.html',
  styleUrls: ['./histogram.component.css'],
  encapsulation: ViewEncapsulation.None,
})
/** Class to create histogram using D3 library. */
export class HistogramComponent implements AfterViewInit {
  @ViewChild('chart') private chartContainer: ElementRef;
  @Input() private readonly histogramData: number[] = [];
  private readonly margin: any = { top: 20, bottom: 20, left: 20, right: 20 };
  private chart: any;
  private svg: any;
  private width: number = 0;
  private height: number = 0;
  private data: number[];

  constructor() {}

  private createChart() {
    const element = this.chartContainer.nativeElement;
    this.width = element.offsetWidth - this.margin.left - this.margin.right;
    this.height = 220 - this.margin.top - this.margin.bottom;
    this.svg = d3
      .select(element)
      .append('svg')
      .attr('width', this.width + this.margin.left + this.margin.right)
      .attr('height', this.height + this.margin.top + this.margin.bottom);

    this.chart = this.svg
      .append('g')
      .attr(
        'transform',
        'translate(' + this.margin.left + ',' + this.margin.top + ')'
      );
  }

  private updateChart() {
    this.data = this.histogramData;
    const x = d3.scaleLinear<number>().rangeRound([0, this.width]);

    const datagenerator = d3
      .histogram<number, number>()
      .domain([x.domain()[0], x.domain()[1]])
      .thresholds([
        0,
        1 / 9,
        2 / 9,
        3 / 9,
        4 / 9,
        5 / 9,
        6 / 9,
        7 / 9,
        8 / 9,
        9 / 9,
        10 / 9,
      ]);

    const bins = datagenerator(this.data);

    const y = d3
      .scaleLinear<number>()
      .domain([
        0,
        d3.max(bins, (d: any[]) => {
          return d.length;
        }),
      ])
      .range([this.height, 0]);

    const bar = this.chart
      .selectAll('.bar')
      .data(bins)
      .enter()
      .append('g')
      .attr('class', 'bar')
      .attr('transform', (d: any) => {
        return 'translate(' + x(d.x0) + ',' + y(d.length) + ')';
      });

    const barWidth = x(bins[0].x1) - x(bins[0].x0) - 1;

    bar
      .append('rect')
      .attr('class', (d: any) => {
        return 'bar-' + this.getToxicityBucketIndex(d.x1);
      })
      .attr('x', 1)
      .attr('width', barWidth)
      .attr('height', (d: any) => {
        return this.height - y(d.length);
      });

    const textLoc = (x(bins[0].x1) - x(bins[0].x0)) / 2;

    bar
      .append('text')
      .attr('class', (d: any) => {
        return 'text-' + this.getToxicityBucketIndex(d.x1);
      })
      .attr('dy', '.75em')
      .attr('y', 6)
      .attr('x', textLoc)
      .attr('text-anchor', 'middle')
      .text((d: any) => {
        return this.formatBucketCount(d.length);
      });

    const xaxis = d3
      .axisBottom(x)
      .tickValues(d3.range(0, 11 / 9, 1 / 9))
      .tickFormat((d: any) => {
        return (d * 100).toFixed(2) + '%';
      });

    this.chart
      .append('g')
      .attr('class', 'axis axis--x')
      .attr('transform', 'translate(0,' + this.height + ')')
      .call(xaxis);
  }

  private formatBucketCount(count: number) {
    if (count > 0) {
      return count;
    } else {
      return '';
    }
  }

  private getToxicityBucketIndex(percentile: number) {
    if (percentile <= 1 / 3) {
      return '0';
    } else if (percentile > 1 / 3 && percentile <= 2 / 3) {
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
