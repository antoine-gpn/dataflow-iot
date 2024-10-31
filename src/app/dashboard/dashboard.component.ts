import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NgClass, TitleCasePipe, UpperCasePipe } from '@angular/common';
import { DevicesService } from '../services/devices.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faShoePrints,
  faBatteryThreeQuarters,
  faFire,
  faHeartPulse,
} from '@fortawesome/free-solid-svg-icons';
import * as d3 from 'd3';
import { Device } from '../models/device';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [NgClass, FontAwesomeModule, TitleCasePipe],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent {
  selectedDevice!: Device;
  selectedTime!: string;
  selectedData!: string;
  datas!: any[];

  chartData!: {}[];
  chartExist: boolean = false;
  private svg: any;
  private margin = 50;
  private width = 500;
  private height = 300;

  // FontAwesomeIcon
  faBatteryThreeQuarters = faBatteryThreeQuarters;
  faShoePrints = faShoePrints;
  faHeartPulse = faHeartPulse;
  faFire = faFire;

  constructor(private devicesService: DevicesService) {}

  ngOnInit(): void {
    this.selectedTime = this.devicesService.getSelectedTime();
    this.selectedData = this.devicesService.getSelectedData();
    this.devicesService
      .getSelectedDevice()
      .subscribe(async (selectedDevice) => {
        this.selectedDevice = selectedDevice;

        const allDatas = await this.devicesService.getAllDatasByDeviceAndTime(
          this.selectedDevice,
          this.selectedTime
        );
        this.datas = Object.entries(allDatas);

        if (this.datas) {
          this.selectedData = this.datas[0][0];
        }

        this.chartData = await this.devicesService.getChartDataFromAPI(
          this.selectedDevice,
          this.selectedData,
          this.selectedTime
        );

        if (this.chartExist) {
          this.updateChartWithNewData();
        } else {
          this.createSvg();
          this.drawBars(this.chartData);
        }
        this.chartExist = true;
      });
  }

  async updateData(newData: string) {
    this.devicesService.setSelectedData(newData);
    this.selectedData = this.devicesService.getSelectedData();
    this.chartData = await this.devicesService.getChartDataFromAPI(
      this.selectedDevice,
      this.selectedData,
      this.selectedTime
    );
    this.updateChartWithNewData();
  }

  updateTime(newTime: string) {
    this.devicesService.setSelectedTime(newTime);
    this.selectedTime = this.devicesService.getSelectedTime();
    this.devicesService
      .getAllDatasByDeviceAndTime(this.selectedDevice, this.selectedTime)
      .then((datas) => {
        this.datas = Object.entries(datas);
      });
    this.devicesService
      .getChartDataFromAPI(
        this.selectedDevice,
        this.selectedData,
        this.selectedTime
      )
      .then((datas) => {
        this.chartData = datas;
        this.updateChartWithNewData();
      });
  }

  createSvg(): void {
    this.svg = d3
      .select('figure#bar')
      .append('svg')
      .attr('width', this.width + this.margin * 2)
      .attr('height', this.height + this.margin * 2)
      .append('g')
      .attr('transform', 'translate(' + this.margin + ',' + this.margin + ')');
  }

  private drawBars(data: any[]): void {
    const x = d3
      .scaleBand()
      .range([0, this.width])
      .domain(data.map((d) => d.Time))
      .padding(0.2);

    const y = d3.scaleLinear().domain([0, 200]).range([this.height, 0]);

    this.svg
      .append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0, ${this.height})`)
      .call(d3.axisBottom(x))
      .selectAll('text')
      .attr('transform', 'translate(-10,0)rotate(-45)')
      .style('text-anchor', 'end');

    this.svg.append('g').attr('class', 'y-axis').call(d3.axisLeft(y));

    this.svg
      .selectAll('rect')
      .data(data)
      .enter()
      .append('rect')
      .attr('x', (d: any) => x(d.Time))
      .attr('y', (d: any) => y(d.Value))
      .attr('width', x.bandwidth())
      .attr('height', (d: any) => this.height - y(d.Value))
      .attr('fill', '#394899');
  }

  updateChartWithNewData(): void {
    const newData: any[] = this.chartData;

    const x = d3
      .scaleBand()
      .range([0, this.width])
      .domain(newData.map((d) => d.Time))
      .padding(0.2);

    const y = d3
      .scaleLinear()
      .domain([0, d3.max(newData, (d: any) => d.Value) as number])
      .range([this.height, 0]);

    this.svg.selectAll('g.x-axis').selectAll('*').remove();

    this.svg
      .select('.x-axis')
      .transition()
      .duration(750)
      .call(d3.axisBottom(x))
      .selectAll('text')
      .attr('transform', 'translate(-10,0)rotate(-45)')
      .style('text-anchor', 'end');

    this.svg.select('.y-axis').transition().duration(750).call(d3.axisLeft(y));

    const bars = this.svg.selectAll('rect').data(newData);

    bars
      .transition()
      .duration(750)
      .attr('x', (d: any) => x(d.Time))
      .attr('y', (d: any) => y(d.Value))
      .attr('width', x.bandwidth())
      .attr('height', (d: any) => this.height - y(d.Value))
      .attr('fill', '#394899');

    bars
      .enter()
      .append('rect')
      .attr('x', (d: any) => x(d.Time))
      .attr('y', this.height)
      .attr('width', x.bandwidth())
      .attr('height', 0)
      .attr('fill', '#394899')
      .transition()
      .duration(750)
      .attr('y', (d: any) => y(d.Value))
      .attr('height', (d: any) => this.height - y(d.Value));

    bars.exit().remove();
  }
}
