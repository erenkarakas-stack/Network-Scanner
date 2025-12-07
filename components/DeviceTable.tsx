import React from 'react';
import { NetworkDevice, DeviceType } from '../types';
import { Laptop, Smartphone, Video, Server, Router, Cpu, Wifi, WifiOff } from 'lucide-react';

interface DeviceTableProps {
  devices: NetworkDevice[];
}

const getIcon = (type: DeviceType) => {
  switch (type) {
    case DeviceType.COMPUTER: return <Laptop className="w-4 h-4" />;
    case DeviceType.MOBILE: return <Smartphone className="w-4 h-4" />;
    case DeviceType.CAMERA: return <Video className="w-4 h-4" />;
    case DeviceType.SERVER: return <Server className="w-4 h-4" />;
    case DeviceType.ROUTER: return <Router className="w-4 h-4" />;
    default: return <Cpu className="w-4 h-4" />;
  }
};

const getRiskColor = (risk: string, isOnline: boolean) => {
  if (!isOnline) return 'text-gray-600 border-gray-700 bg-gray-800/20';
  
  switch (risk) {
    case 'Kritik': return 'text-red-500 bg-red-500/10 border-red-500/20';
    case 'Yüksek': return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
    case 'Orta': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
    default: return 'text-cyber-500 bg-cyber-500/10 border-cyber-500/20';
  }
};

export const DeviceTable: React.FC<DeviceTableProps> = ({ devices }) => {
  return (
    <div className="overflow-x-auto w-full">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-cyber-700 text-gray-400 font-mono text-xs uppercase tracking-wider sticky top-0 bg-cyber-900 z-10">
            <th className="p-4">Durum</th>
            <th className="p-4">Cihaz Türü</th>
            <th className="p-4">IP Adresi</th>
            <th className="p-4">MAC & Host</th>
            <th className="p-4">Açık Portlar</th>
            <th className="p-4">Risk</th>
          </tr>
        </thead>
        <tbody className="font-mono text-sm">
          {devices.map((device) => (
            <tr 
              key={device.id} 
              className={`border-b border-cyber-800 transition-colors ${device.isOnline ? 'hover:bg-cyber-800/50' : 'bg-red-900/5 opacity-60 grayscale-[0.8] hover:grayscale-0'}`}
            >
              <td className="p-4">
                <div className="flex items-center gap-2">
                  <div className="relative">
                     <div className={`w-2.5 h-2.5 rounded-full ${device.isOnline ? 'bg-cyber-500' : 'bg-red-600'}`}></div>
                     {device.isOnline && <div className="absolute inset-0 bg-cyber-500 rounded-full animate-ping opacity-75"></div>}
                  </div>
                  <span className={`text-xs ${device.isOnline ? 'text-gray-300' : 'text-red-400'}`}>
                    {device.isOnline ? `${device.latency}ms` : 'OFFLINE'}
                  </span>
                </div>
              </td>
              <td className="p-4">
                <div className={`flex items-center gap-2 ${device.isOnline ? 'text-gray-300' : 'text-gray-600'}`}>
                  {getIcon(device.type)}
                  <span>{device.type}</span>
                </div>
              </td>
              <td className={`p-4 font-bold ${device.isOnline ? 'text-cyber-400' : 'text-gray-500 decoration-line-through'}`}>{device.ip}</td>
              <td className="p-4">
                <div className="flex flex-col">
                  <span className={device.isOnline ? 'text-white font-semibold' : 'text-gray-500'}>{device.hostname}</span>
                  <span className="text-xs text-gray-600">{device.mac} ({device.vendor})</span>
                </div>
              </td>
              <td className="p-4">
                <div className="flex flex-wrap gap-1">
                  {device.openPorts.length > 0 ? device.openPorts.map((p, idx) => (
                    <span key={idx} className={`px-1.5 py-0.5 rounded text-[10px] border ${
                        !device.isOnline 
                            ? 'border-gray-700 text-gray-600' 
                            : p.vulnerability 
                                ? 'border-red-500/50 text-red-400 bg-red-900/20' 
                                : 'border-cyber-700 text-gray-400'
                    }`}>
                      {p.port}
                    </span>
                  )) : <span className="text-gray-600 text-xs">-</span>}
                </div>
              </td>
              <td className="p-4">
                <span className={`px-2 py-1 rounded text-xs border ${getRiskColor(device.securityRisk, device.isOnline)}`}>
                  {device.securityRisk}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};