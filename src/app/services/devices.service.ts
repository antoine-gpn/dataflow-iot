import { Injectable } from '@angular/core';
import { Device } from '../models/device';
import {
  faVideo,
  faClock,
  faLightbulb,
  faTemperatureLow,
  faWind,
  faPersonRunning,
} from '@fortawesome/free-solid-svg-icons';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class DevicesService {
  private selectedDevice = new BehaviorSubject<string>('SportWatch');
  private selectedTime: string = 'Today';
  private selectedData: string = 'Number of steps';

  getSelectedDevice(): Observable<string> {
    return this.selectedDevice.asObservable();
  }

  getSelectedTime(): string {
    return this.selectedTime;
  }

  getSelectedData(): string {
    return this.selectedData;
  }

  setSelectedDevice(newDevice: string) {
    this.selectedDevice.next(newDevice);
  }

  setSelectedTime(newTime: string) {
    this.selectedTime = newTime;
  }

  setSelectedData(newData: string) {
    this.selectedData = newData;
  }

  private datas: { [key: string]: string[] } = {
    SportWatch: [
      'Number of steps',
      'Calories burned',
      'Heart rate',
      'Remaining battery',
    ],
    'Security camera': ['Test'],
  };

  private devices: Device[] = [
    new Device('Apple Watch', 'SmartWatch', faClock),
    new Device('FitBit', 'SportWatch', faPersonRunning),
    new Device('ikvision DS-2CD2343G0', 'Security camera', faVideo),
    new Device('Phillips Hue', 'Smart Lightbulb', faLightbulb),
    new Device(
      'Netatmo Weather Station',
      'Temperature sensor',
      faTemperatureLow
    ),
    new Device(
      'Xiaomi Mijia Air Quality Monitor',
      'Air quality sensor',
      faWind
    ),
  ];

  getDatas(): {} {
    return this.datas;
  }

  getDatasByType(type: string): string[] {
    return this.datas[type];
  }

  getDevices(): Device[] {
    return this.devices;
  }
}
