export enum DeviceType {
  COMPUTER = 'Bilgisayar',
  MOBILE = 'Telefon',
  CAMERA = 'Kamera',
  SERVER = 'Sunucu',
  IOT = 'IoT Cihazı',
  ROUTER = 'Yönlendirici'
}

export interface OpenPort {
  port: number;
  service: string;
  vulnerability?: string;
}

export interface NetworkDevice {
  id: string;
  ip: string;
  mac: string;
  vendor: string;
  hostname: string;
  type: DeviceType;
  os: string;
  isOnline: boolean;
  latency: number; // ms
  firstSeen: Date;
  openPorts: OpenPort[];
  securityRisk: 'Düşük' | 'Orta' | 'Yüksek' | 'Kritik';
}

export interface ScanStats {
  totalDevices: number;
  onlineDevices: number;
  portsScanned: number;
  vulnerabilitiesFound: number;
  scanDuration: number;
}