import { Injectable } from '@angular/core';
import { Device } from '../models/device';
import {
  faClock,
  faLightbulb,
  faTemperatureLow,
  faWind,
  faPersonRunning,
  faWeightScale,
  IconDefinition,
} from '@fortawesome/free-solid-svg-icons';
import { BehaviorSubject, Observable } from 'rxjs';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

@Injectable({ providedIn: 'root' })
export class DevicesService {
  private selectedDevice = new BehaviorSubject<Device>(
    new Device(1, 'Garmin Forerunner 255', 'SmartWatch', faPersonRunning)
  );
  private selectedTime: string = 'today';
  private selectedData: string = 'Number of steps';
  private baseUrl = 'http://localhost:8001/';
  //private baseUrl = 'https://dataflow-iot.onrender.com/';

  getSelectedDevice(): Observable<Device> {
    return this.selectedDevice.asObservable();
  }

  getSelectedTime(): string {
    return this.selectedTime;
  }

  getSelectedData(): string {
    return this.selectedData;
  }

  setSelectedDevice(newDevice: Device) {
    this.selectedDevice.next(newDevice);
  }

  setSelectedTime(newTime: string) {
    this.selectedTime = newTime;
  }

  setSelectedData(newData: string) {
    this.selectedData = newData;
  }

  getDevicesFromAPI(): Device[] {
    var devices: Device[] = [];
    var icons: { [key: string]: IconDefinition } = {
      SportWatch: faPersonRunning,
      SmartWatch: faClock,
      'Smart Balance': faWeightScale,
      'Smart Lightbulb': faLightbulb,
      'Temperature sensor': faTemperatureLow,
      'Air quality sensor': faWind,
    };

    fetch(`${this.baseUrl}getAllDevices`)
      .then((response) => response.json())
      .then((datas) => {
        datas.forEach(
          (device: { _id: number; deviceName: string; deviceType: string }) => {
            devices.push(
              new Device(
                device._id,
                device.deviceName,
                device.deviceType,
                icons[device.deviceType]
              )
            );
          }
        );
      });

    return devices;
  }

  async getAllDatasByDeviceAndTime(device: Device, time: string) {
    const response = await fetch(
      `${this.baseUrl}getAllDatasByDeviceAndTime/${device.deviceId}/${time}`
    );

    const datas = await response.json();
    return datas;
  }

  async getChartDataFromAPI(device: Device, data: string, time: string) {
    const response = await fetch(
      `${this.baseUrl}getSpecificDataByDeviceAndTime/${device.deviceId}/${data}/${time}`
    );

    const datas = await response.json();
    return datas;
  }
}
