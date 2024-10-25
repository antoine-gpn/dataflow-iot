import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NgClass } from '@angular/common';
import { DevicesService } from '../services/devices.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faShoePrints,
  faBatteryThreeQuarters,
  faFire,
  faHeartPulse,
} from '@fortawesome/free-solid-svg-icons';
import * as d3 from 'd3';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [NgClass, FontAwesomeModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent {
  selectedDevice!: string;
  selectedTime!: string;
  selectedData!: string;
  datas!: string[];

  chartData!: {}[];
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
    this.devicesService.getSelectedDevice().subscribe((selectedDevice) => {
      this.selectedDevice = selectedDevice;
      this.datas = this.devicesService.getDatasByType(selectedDevice);
    });
    this.chartData = [
      { Framework: 'Lundi', Stars: '8600', Released: '2014' },
      { Framework: 'Mardi', Stars: '4300', Released: '2013' },
      { Framework: 'Mercredi', Stars: '9600', Released: '2016' },
      { Framework: 'Jeudi', Stars: '12620', Released: '2010' },
      { Framework: 'Vendredi', Stars: '6600', Released: '2011' },
      { Framework: 'Samedi', Stars: '4600', Released: '2011' },
      { Framework: 'Dimanche', Stars: '9600', Released: '2011' },
    ];

    this.createSvg();
    this.drawBars(this.chartData);
  }

  updateData(newData: string) {
    this.devicesService.setSelectedData(newData);
    this.selectedData = this.devicesService.getSelectedData();
    this.updateChartWithNewData([
      { Framework: 'Lundi', Stars: '10000', Released: '2014' },
      { Framework: 'Mardi', Stars: '8300', Released: '2013' },
      { Framework: 'Mercredi', Stars: '3600', Released: '2016' },
      { Framework: 'Jeudi', Stars: '9620', Released: '2010' },
      { Framework: 'Vendredi', Stars: '1600', Released: '2011' },
      { Framework: 'Samedi', Stars: '2600', Released: '2011' },
      { Framework: 'Dimanche', Stars: '6600', Released: '2011' },
    ]);
  }

  updateTime(newTime: string) {
    this.devicesService.setSelectedTime(newTime);
    this.selectedTime = this.devicesService.getSelectedTime();
  }

  updateChartData() {
    this.chartData = [];
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
    // Create the X-axis band scale
    const x = d3
      .scaleBand()
      .range([0, this.width])
      .domain(data.map((d) => d.Framework))
      .padding(0.2);

    // Draw the X-axis on the DOM
    this.svg
      .append('g')
      .attr('transform', 'translate(0,' + this.height + ')')
      .call(d3.axisBottom(x))
      .selectAll('text')
      .attr('transform', 'translate(-10,0)rotate(-45)')
      .style('text-anchor', 'end');

    // Create the Y-axis band scale
    const y = d3.scaleLinear().domain([0, 15000]).range([this.height, 0]);

    // Draw the Y-axis on the DOM
    this.svg.append('g').call(d3.axisLeft(y));

    // Create and fill the bars
    this.svg
      .selectAll('bars')
      .data(data)
      .enter()
      .append('rect')
      .attr('x', (d: any) => x(d.Framework))
      .attr('y', (d: any) => y(d.Stars))
      .attr('width', x.bandwidth())
      .attr('height', (d: any) => this.height - y(d.Stars))
      .attr('fill', '#394899');
  }

  updateChartWithNewData(newData: any[]): void {
    // Met à jour les domaines des échelles
    const x = d3
      .scaleBand()
      .range([0, this.width])
      .domain(newData.map((d) => d.Framework))
      .padding(0.2);

    const y = d3
      .scaleLinear()
      .domain([0, d3.max(newData, (d: any) => d.Stars) as number])
      .range([this.height, 0]);

    // Mettre à jour l'axe X avec les nouvelles données
    this.svg
      .selectAll('g.x-axis')
      .transition()
      .duration(750)
      .call(d3.axisBottom(x))
      .selectAll('text')
      .attr('transform', 'translate(-10,0)rotate(-45)')
      .style('text-anchor', 'end');

    // Mettre à jour l'axe Y avec les nouvelles données
    this.svg
      .selectAll('g.y-axis')
      .transition()
      .duration(750)
      .call(d3.axisLeft(y));

    // Sélectionner toutes les barres existantes et les mettre à jour avec une transition
    const bars = this.svg.selectAll('rect').data(newData);

    // Mettre à jour les barres existantes
    bars
      .transition()
      .duration(750)
      .attr('x', (d: any) => x(d.Framework))
      .attr('y', (d: any) => y(d.Stars))
      .attr('width', x.bandwidth())
      .attr('height', (d: any) => this.height - y(d.Stars))
      .attr('fill', '#394899');

    // Ajouter de nouvelles barres s'il y en a de supplémentaires dans les nouvelles données
    bars
      .enter()
      .append('rect')
      .attr('x', (d: any) => x(d.Framework))
      .attr('y', this.height) // Partir du bas pour l'effet de transition
      .attr('width', x.bandwidth())
      .attr('height', 0) // Taille initiale nulle
      .attr('fill', '#394899')
      .transition()
      .duration(750)
      .attr('y', (d: any) => y(d.Stars))
      .attr('height', (d: any) => this.height - y(d.Stars));

    // Supprimer les anciennes barres qui ne sont plus dans les nouvelles données
    bars.exit().remove();
  }
}
