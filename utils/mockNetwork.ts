import { NetworkDevice, DeviceType, OpenPort } from '../types';

const VENDORS = ['Apple', 'Dell', 'Samsung', 'Hikvision', 'Cisco', 'Espressif', 'Huawei', 'Intel', 'Xiaomi', 'TP-Link'];
const OS_LIST = ['Windows 11', 'Ubuntu 22.04', 'iOS 17', 'Android 14', 'HikOS', 'Cisco IOS', 'macOS Sonoma'];

const generateMac = (): string => {
  return "XX:XX:XX:XX:XX:XX".replace(/X/g, function() {
    return "0123456789ABCDEF".charAt(Math.floor(Math.random() * 16));
  });
};

const getRandomPorts = (type: DeviceType): OpenPort[] => {
  const ports: OpenPort[] = [];
  // Common ports
  if (Math.random() > 0.8) ports.push({ port: 80, service: 'HTTP' });
  if (Math.random() > 0.9) ports.push({ port: 443, service: 'HTTPS' });
  
  if (type === DeviceType.SERVER || type === DeviceType.COMPUTER) {
    if (Math.random() > 0.5) ports.push({ port: 22, service: 'SSH' });
    if (Math.random() > 0.7) ports.push({ port: 445, service: 'SMB', vulnerability: 'SMBv1 Potansiyel Risk' });
    if (Math.random() > 0.8) ports.push({ port: 3389, service: 'RDP' });
  }
  
  if (type === DeviceType.CAMERA) {
    ports.push({ port: 554, service: 'RTSP' });
    if (Math.random() > 0.6) ports.push({ port: 8000, service: 'Hikvision-SDK', vulnerability: 'Varsayılan Şifre Riski' });
  }

  return ports;
};

const determineRisk = (ports: OpenPort[]): 'Düşük' | 'Orta' | 'Yüksek' | 'Kritik' => {
  if (ports.some(p => p.vulnerability)) return 'Yüksek';
  if (ports.some(p => p.port === 23)) return 'Kritik'; // Telnet
  if (ports.some(p => p.port === 3389 || p.port === 445)) return 'Orta';
  return 'Düşük';
};

// Stateful Simulator Class
export class NetworkSimulator {
  private devices: Map<string, NetworkDevice>;
  private subnet: string;

  constructor(subnet: string) {
    this.devices = new Map();
    this.subnet = subnet;
    this.initializeStaticDevices();
  }

  private initializeStaticDevices() {
    // KOCAL HOST (User's Machine Simulation)
    const kocalHost: NetworkDevice = {
      id: 'kocal-main',
      ip: `${this.subnet}.42`,
      mac: 'AA:BB:CC:DD:EE:FF',
      vendor: 'MSI',
      hostname: 'KOCAL-LAPTOP',
      type: DeviceType.COMPUTER,
      os: 'Windows 11 Pro',
      isOnline: true,
      latency: 1,
      firstSeen: new Date(),
      openPorts: [{ port: 445, service: 'SMB' }, { port: 3389, service: 'RDP' }],
      securityRisk: 'Orta'
    };
    this.devices.set(kocalHost.ip, kocalHost);

    // Gateway
    const gateway: NetworkDevice = {
      id: 'gateway',
      ip: `${this.subnet}.1`,
      mac: generateMac(),
      vendor: 'Cisco',
      hostname: 'gateway-router',
      type: DeviceType.ROUTER,
      os: 'Cisco IOS',
      isOnline: true,
      latency: 2,
      firstSeen: new Date(),
      openPorts: [{ port: 80, service: 'HTTP' }, { port: 53, service: 'DNS' }],
      securityRisk: 'Düşük'
    };
    this.devices.set(gateway.ip, gateway);
  }

  // Simulation Tick (Called every interval)
  public tick(): { devices: NetworkDevice[], events: string[] } {
    const events: string[] = [];
    
    // 1. Existing Device Updates (Disconnect/Reconnect)
    this.devices.forEach((device, ip) => {
      // Don't disconnect KOCAL-LAPTOP or Gateway often
      if (device.id === 'kocal-main' || device.id === 'gateway') return;

      const roll = Math.random();
      
      // Simulate cable pull / signal loss (5% chance if online)
      if (device.isOnline && roll < 0.05) {
        device.isOnline = false;
        events.push(`BAĞLANTI KOPTU: ${device.hostname} (${device.ip}) ağdan düştü.`);
      }
      // Simulate reconnect (10% chance if offline)
      else if (!device.isOnline && roll < 0.15) {
        device.isOnline = true;
        device.latency = Math.floor(Math.random() * 100) + 5;
        events.push(`YENİDEN BAĞLANDI: ${device.hostname} (${device.ip}) ağa katıldı.`);
      }
      
      // Update latency for online devices
      if (device.isOnline) {
        device.latency = Math.max(1, device.latency + (Math.random() * 10 - 5));
        device.latency = Math.floor(device.latency);
      }
    });

    // 2. New Device Discovery (Small chance to find new device)
    if (this.devices.size < 20 && Math.random() < 0.1) {
      const ipSuffix = Math.floor(Math.random() * 253) + 2; // 2-254
      const ip = `${this.subnet}.${ipSuffix}`;
      
      if (!this.devices.has(ip)) {
        const typeKeys = Object.values(DeviceType);
        const type = typeKeys[Math.floor(Math.random() * typeKeys.length)];
        const ports = getRandomPorts(type);
        
        const newDevice: NetworkDevice = {
          id: crypto.randomUUID(),
          ip: ip,
          mac: generateMac(),
          vendor: VENDORS[Math.floor(Math.random() * VENDORS.length)],
          hostname: `dev-${type.toLowerCase().substring(0, 3)}-${ipSuffix}`,
          type: type,
          os: OS_LIST[Math.floor(Math.random() * OS_LIST.length)],
          isOnline: true,
          latency: Math.floor(Math.random() * 200) + 10,
          firstSeen: new Date(),
          openPorts: ports,
          securityRisk: determineRisk(ports)
        };
        
        this.devices.set(ip, newDevice);
        events.push(`YENİ CİHAZ: ${newDevice.ip} (${newDevice.type}) tespit edildi.`);
      }
    }

    return {
      devices: Array.from(this.devices.values()).sort((a, b) => {
        // Sort: Online first, then by IP
        if (a.isOnline === b.isOnline) {
             return parseInt(a.ip.split('.')[3]) - parseInt(b.ip.split('.')[3]);
        }
        return a.isOnline ? -1 : 1;
      }),
      events
    };
  }
}