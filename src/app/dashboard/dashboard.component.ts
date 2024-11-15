import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import { NgClass, UpperCasePipe } from '@angular/common';
import { DevicesService } from '../services/devices.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faShoePrints,
  faBatteryThreeQuarters,
  faFire,
  faHeartPulse,
  IconDefinition,
  faDollarSign,
  faBolt,
  faStairs,
  faPersonWalking,
  faVirus,
  faAtom,
  faLungs,
  faTemperatureLow,
  faSun,
  faDroplet,
  faPlugCircleBolt,
  faPowerOff,
  faDumbbell,
  faPersonCircleQuestion,
  faCalculator,
  faScaleUnbalanced,
  faBurger,
} from '@fortawesome/free-solid-svg-icons';
import * as d3 from 'd3';
import { Device } from '../models/device';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [NgClass, FontAwesomeModule, UpperCasePipe],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit, OnDestroy {
  selectedDevice!: Device;
  selectedTime!: string;
  selectedData!: string;
  datas!: any[];
  chartData!: { [key: string]: number }[];
  pieChartData: { [key: string]: any }[] = [];
  chartExist: boolean = false;
  balanceData!: { [key: string]: number };
  private svg: any;
  private pieSvg: any;
  private margin = 50;
  private width!: number;
  private height = 400;

  icons: { [key: string]: IconDefinition } = {
    'Steps walked': faShoePrints,
    'Calories burned': faFire,
    'Heart-rate average': faHeartPulse,
    'Remaining battery': faBatteryThreeQuarters,
    'Estimated costs': faDollarSign,
    'Consumption history': faBolt,
    'Distance traveled': faPersonWalking,
    'Floors climbed': faStairs,
    'Air Quality Index': faLungs,
    'Fine particle levels': faVirus,
    'Oxygen Concentration': faAtom,
    'Average temperature': faTemperatureLow,
    'Sunshine exposure': faSun,
    'Average humidity': faDroplet,
    'Lightning intensity': faPlugCircleBolt,
    'Time on': faPowerOff,
    'Muscle rate': faDumbbell,
    'Body Age': faPersonCircleQuestion,
    'Body Water rate': faDroplet,
    'Body Weight': faScaleUnbalanced,
    'Bodyfat rate': faBurger,
    'Body Mass Index': faCalculator,
  };

  constructor(private devicesService: DevicesService) {}

  ngOnInit(): void {
    window.addEventListener('resize', this.onResize.bind(this));
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
        console.log(this.datas);

        if (this.datas) {
          this.selectedData = this.datas[0][0];
        }

        this.chartData = await this.devicesService.getChartDataFromAPI(
          this.selectedDevice,
          this.selectedData,
          this.selectedTime
        );

        if (selectedDevice.deviceType === 'Smart Balance') {
          this.chartData.forEach((data) => {
            if (data['Time'] === 9) {
              this.balanceData = data;
            }
          });

          let fatRate = this.datas.find(
            (data) => data[0] === 'Bodyfat rate'
          )[1];
          let muscleRate = this.datas.find(
            (data) => data[0] === 'Muscle rate'
          )[1];

          muscleRate = muscleRate.replace(/\D/g, '');
          fatRate = fatRate.replace(/\D/g, '');

          this.pieChartData = [
            { label: 'Fat', value: fatRate },
            { label: 'Muscle', value: muscleRate },
            { label: 'Other', value: 6 },
          ];
          d3.select('figure#pie').select('svg').remove();
          this.createPieSvg();
          this.createPieChart();
        }

        if (this.chartExist) {
          this.updateChartWithNewData();
        } else {
          this.createSvg();
          this.drawBars(this.chartData);
        }
        this.chartExist = true;
      });
  }

  ngOnDestroy(): void {
    window.removeEventListener('resize', this.onResize.bind(this));
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

    if (this.selectedDevice.deviceType === 'Smart Balance') {
      this.chartData.forEach((data) => {
        if (data['Time'] === 8) {
          this.balanceData = data;
        }
      });
    }
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
    const element = document.querySelector('.chart') as HTMLElement;
    this.width = element.clientWidth - this.margin * 2;
    this.height = element.clientHeight - this.margin * 2;

    this.svg = d3
      .select('figure#bar')
      .append('svg')
      .attr(
        'viewBox',
        `0 0 ${this.width + this.margin * 2} ${this.height + this.margin * 2}`
      )
      .attr('preserveAspectRatio', 'xMinYMin meet')
      .append('g')
      .attr('transform', 'translate(' + this.margin + ',' + this.margin + ')');
  }

  createPieSvg(): void {
    this.pieSvg = d3
      .select('figure#pie')
      .append('svg')
      .attr('width', this.width)
      .attr('height', this.height)
      .append('g')
      .attr('transform', 'translate(' + 230 + ',' + this.height / 2 + ')');
  }

  createPieChart(): void {
    const color = d3
      .scaleOrdinal()
      .domain(this.pieChartData.map((d) => d['label']))
      .range(['#d34747', '#3c4c9e', '#a8a8a8']);

    const pie = d3.pie<any>().value((d: any) => d.value);

    const data_ready = pie(this.pieChartData);

    const arc = d3
      .arc()
      .innerRadius(0)
      .outerRadius(Math.min(this.width, this.height) / 2 - this.margin);

    this.pieSvg
      .selectAll('pieces')
      .data(data_ready)
      .enter()
      .append('path')
      .attr('d', arc)
      .attr('fill', (d: any) => color(d.data.label))
      .attr('stroke', '#121926')
      .style('stroke-width', '1px');

    this.pieSvg
      .selectAll('pieces')
      .data(data_ready)
      .enter()
      .append('text')
      .text((d: any) => d.data.label + ' ' + d.data.value + ' %')
      .attr('transform', (d: any) => 'translate(' + arc.centroid(d) + ')')
      .style('text-anchor', 'middle')
      .style('font-size', 15)
      .style('font-weight', 'bold');
  }

  private drawBars(data: any[]): void {
    const x = d3
      .scaleBand()
      .range([0, this.width])
      .domain(data.map((d) => d.Time))
      .padding(0.2);

    const y = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d: any) => d.Value) as number])
      .range([this.height, 0]);

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
      .attr('fill', '#1d2f7c');
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

    const bars = this.svg.selectAll('rect').data(this.chartData);

    bars
      .transition()
      .duration(750)
      .attr('x', (d: any) => x(d.Time))
      .attr('y', (d: any) => y(d.Value))
      .attr('width', x.bandwidth())
      .attr('height', (d: any) => this.height - y(d.Value))
      .attr('fill', '#1d2f7c');

    bars
      .enter()
      .append('rect')
      .attr('x', (d: any) => x(d.Time))
      .attr('y', this.height)
      .attr('width', x.bandwidth())
      .attr('height', 0)
      .attr('fill', '#1d2f7c')
      .transition()
      .duration(750)
      .attr('y', (d: any) => y(d.Value))
      .attr('height', (d: any) => this.height - y(d.Value));

    bars.exit().remove();
  }

  onResize(): void {
    const element = document.querySelector('.chart') as HTMLElement;
    this.width = element.clientWidth - this.margin * 2;
    d3.select('figure#bar svg').remove();
    this.createSvg();
    this.drawBars(this.chartData);
  }
}
