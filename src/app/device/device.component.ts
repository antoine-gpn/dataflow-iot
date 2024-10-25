import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Device } from '../models/device';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { NgClass } from '@angular/common';
import { DevicesService } from '../services/devices.service';

@Component({
  selector: 'app-device',
  standalone: true,
  imports: [FontAwesomeModule, NgClass],
  templateUrl: './device.component.html',
  styleUrl: './device.component.scss',
})
export class DeviceComponent {
  @Input() device!: Device;
  @Input() currentDevice!: string;
  @Output() selectedDevice = new EventEmitter<string>();

  constructor(private devicesService: DevicesService) {}

  updateSelectedDevice(newDevice: string) {
    this.selectedDevice.emit(newDevice);
  }
}
