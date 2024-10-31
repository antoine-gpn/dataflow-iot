import { IconDefinition } from '@fortawesome/free-solid-svg-icons';

export class Device {
  constructor(
    public deviceId: number,
    public deviceName: string,
    public deviceType: string,
    public icon: IconDefinition
  ) {}
}
