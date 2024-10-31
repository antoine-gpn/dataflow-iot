import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { DeviceComponent } from '../device/device.component';
import { Device } from '../models/device';
import { DevicesService } from '../services/devices.service';

@Component({
  selector: 'app-device-list',
  standalone: true,
  imports: [DeviceComponent],
  templateUrl: './device-list.component.html',
  styleUrl: './device-list.component.scss',
})
export class DeviceListComponent implements OnInit {
  devices!: Device[];
  selectedDevice!: Device;

  constructor(private devicesService: DevicesService) {}

  ngOnInit(): void {
    this.devices = this.devicesService.getDevicesFromAPI();
    this.devicesService.getSelectedDevice().subscribe((selectedDevice) => {
      this.selectedDevice = selectedDevice;
    });
  }

  updateSelectedDevice(newDevice: Device) {
    this.devicesService.setSelectedDevice(newDevice);
  }
}
