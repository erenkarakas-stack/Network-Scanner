import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Shield, Activity, Wifi, Terminal, AlertTriangle, FileText, Globe, Clock, BrainCircuit, CheckCircle2 } from 'lucide-react';
import { NetworkSimulator } from './utils/mockNetwork';
import { NetworkDevice } from './types';
import { DeviceTable } from './components/DeviceTable';
import { ScanRadar } from './components/ScanRadar';
import { analyzeNetworkSecurity } from './services/geminiService';
import ReactMarkdown from 'react-markdown';

// Constants
const SUBNET = "192.168.1";
const NEW_DEVICE_THRESHOLD = 3; // Trigger analysis after 3 new devices

interface NetworkEvent {
  id: number;
  time: string;
  message: string;
  type: 'info' | 'alert' | 'success' | 'warning';
}

export default function App() {
  const [monitoring, setMonitoring] = useState(false);
  const [autoAnalyze, setAutoAnalyze] = useState(false);
  const [devices, setDevices] = useState<NetworkDevice[]>([]);
  const [aiReport, setAiReport] = useState<string>("");
  const [analyzing, setAnalyzing] = useState(false);
  const [logs, setLogs] = useState<NetworkEvent[]>([]);
  
  // Stats
  const onlineCount = devices.filter(d => d.isOnline).length;
  const offlineCount = devices.filter(d => !d.isOnline).length;
  const criticalCount = devices.filter(d => d.isOnline && (d.securityRisk === 'Kritik' || d.securityRisk === 'Yüksek')).length;

  const timerRef = useRef<number | null>(null);
  const simulatorRef = useRef<NetworkSimulator>(new NetworkSimulator(SUBNET));
  
  // Ref to track state at the time of last analysis
  const lastAnalysisRef = useRef<{ deviceIds: Set<string>; count: number }>({
    deviceIds: new Set(),
    count: 0
  });

  const addLog = (message: string, type: 'info' | 'alert' | 'success' | 'warning' = 'info') => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('tr-TR', { hour12: false });
    
    setLogs(prev => {
        const newLogs = [{ id: Date.now() + Math.random(), time: timeStr, message, type }, ...prev];
        return newLogs.slice(0, 50); // Keep last 50 logs
    });
  };

  const toggleMonitoring = () => {
    if (monitoring) {
        if (timerRef.current) clearInterval(timerRef.current);
        setMonitoring(false);
        addLog("İzleme durduruldu.", 'alert');
    } else {
        setMonitoring(true);
        addLog("Canlı ağ izleme başlatıldı...", 'success');
        
        // Immediate first tick
        const { devices: initDevices, events: initEvents } = simulatorRef.current.tick();
        setDevices(initDevices);
        initEvents.forEach(e => addLog(e, e.includes("KOPTU") ? 'alert' : 'success'));

        timerRef.current = window.setInterval(() => {
            const { devices: updatedDevices, events } = simulatorRef.current.tick();
            setDevices(updatedDevices);
            events.forEach(e => addLog(e, e.includes("KOPTU") ? 'alert' : 'success'));
        }, 1500); // Update every 1.5 seconds
    }
  };

  useEffect(() => {
    return () => {
        if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Auto-Analysis Logic
  useEffect(() => {
    if (!monitoring || !autoAnalyze || analyzing || devices.length === 0) return;

    const currentOnlineDevices = devices.filter(d => d.isOnline);
    const lastAnalyzedIds = lastAnalysisRef.current.deviceIds;

    // Condition 1: Check for NEW Critical devices that were not present in last analysis
    const newCriticalDevice = currentOnlineDevices.find(d => 
        (d.securityRisk === 'Kritik' || d.securityRisk === 'Yüksek') && 
        !lastAnalyzedIds.has(d.id)
    );

    // Condition 2: Check for device count threshold (e.g., 3 new devices found since last scan)
    const currentCount = currentOnlineDevices.length;
    const lastCount = lastAnalysisRef.current.count;
    const isThresholdReached = (currentCount - lastCount) >= NEW_DEVICE_THRESHOLD;

    if (newCriticalDevice) {
        addLog(`OTOMATİK TETİKLEYİCİ: Kritik cihaz (${newCriticalDevice.ip}) tespit edildi. Analiz başlatılıyor...`, 'warning');
        handleGeminiAnalysis();
    } else if (isThresholdReached) {
        addLog(`OTOMATİK TETİKLEYİCİ: ${NEW_DEVICE_THRESHOLD}+ yeni cihaz algılandı. Analiz güncelleniyor...`, 'info');
        handleGeminiAnalysis();
    }

  }, [devices, monitoring, autoAnalyze, analyzing]);

  const handleGeminiAnalysis = async () => {
    if (devices.length === 0) return;
    
    // Update ref immediately to prevent double firing
    const currentOnline = devices.filter(d => d.isOnline);
    lastAnalysisRef.current = {
        deviceIds: new Set(currentOnline.map(d => d.id)),
        count: currentOnline.length
    };

    setAnalyzing(true);
    const report = await analyzeNetworkSecurity(devices, SUBNET);
    setAiReport(report);
    setAnalyzing(false);
    addLog("Güvenlik analizi tamamlandı.", 'success');
  };

  return (
    <div className="min-h-screen bg-cyber-900 text-gray-200 font-sans selection:bg-cyber-500 selection:text-cyber-900 flex flex-col">
      {/* Header */}
      <header className="border-b border-cyber-800 bg-cyber-900/90 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Activity className="text-cyber-500 w-6 h-6" />
            <h1 className="text-xl font-bold tracking-tight text-white">
              NET<span className="text-cyber-500">SENTINEL</span>
            </h1>
          </div>
          <div className="flex items-center gap-4">
             <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-yellow-500/10 border border-yellow-500/30 rounded text-yellow-500 text-xs">
                <AlertTriangle className="w-3 h-3" />
                <span>CANLI SİMÜLASYON</span>
             </div>
             <div className="text-xs font-mono text-gray-500">KOCAL-HOST</div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left Sidebar: Controls & Stats */}
        <div className="space-y-6">
            {/* Control Panel */}
            <div className="bg-cyber-800/50 border border-cyber-700 rounded-lg p-6 backdrop-blur-sm shadow-lg">
                <div className="flex justify-between items-start mb-6">
                    <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider">İzleme Merkezi</h2>
                    <Wifi className={`w-5 h-5 ${monitoring ? 'text-cyber-500 animate-pulse' : 'text-gray-600'}`} />
                </div>

                <div className="flex justify-center mb-6 relative">
                    <ScanRadar scanning={monitoring} />
                    {monitoring && (
                         <div className="absolute bottom-0 text-[10px] text-cyber-500 font-mono animate-pulse">
                            TARANIYOR...
                         </div>
                    )}
                </div>

                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3 pt-4">
                        <button 
                            onClick={toggleMonitoring}
                            className={`col-span-2 flex items-center justify-center gap-2 px-4 py-3 rounded font-bold text-sm transition-all
                            ${monitoring 
                                ? 'bg-red-500/10 text-red-500 border border-red-500/50 hover:bg-red-500/20' 
                                : 'bg-cyber-500 text-cyber-900 hover:bg-cyber-400 shadow-[0_0_15px_rgba(0,255,157,0.3)]'
                            }`}
                        >
                            {monitoring ? <><Pause className="w-4 h-4"/> İZLEMEYİ DURDUR</> : <><Play className="w-4 h-4"/> CANLI İZLEME BAŞLAT</>}
                        </button>
                        
                        <button 
                            disabled={!monitoring || devices.length === 0}
                            onClick={handleGeminiAnalysis}
                            className="col-span-2 flex items-center justify-center gap-2 px-4 py-3 rounded font-bold text-sm bg-blue-600/10 text-blue-400 border border-blue-500/30 hover:bg-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            {analyzing ? <Activity className="w-4 h-4 animate-spin"/> : <Shield className="w-4 h-4"/>}
                            {analyzing ? 'ANALİZ EDİLİYOR...' : 'GÜVENLİK ANALİZİ'}
                        </button>

                        {/* Auto Analysis Toggle */}
                        <div 
                            onClick={() => setAutoAnalyze(!autoAnalyze)}
                            className={`col-span-2 flex items-center justify-between px-3 py-2 rounded cursor-pointer border transition-all ${
                                autoAnalyze 
                                ? 'bg-purple-900/20 border-purple-500/50 text-purple-300' 
                                : 'bg-gray-800/30 border-gray-700 text-gray-500'
                            }`}
                        >
                            <div className="flex items-center gap-2">
                                <BrainCircuit className={`w-4 h-4 ${autoAnalyze ? 'animate-pulse' : ''}`} />
                                <span className="text-xs font-bold">OTOMATİK AI TETİKLEYİCİ</span>
                            </div>
                            <div className={`w-3 h-3 rounded-full border ${autoAnalyze ? 'bg-purple-500 border-purple-400 shadow-[0_0_8px_#a855f7]' : 'bg-transparent border-gray-600'}`}></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-cyber-800/30 border border-cyber-700 p-4 rounded-lg">
                    <div className="text-2xl font-mono font-bold text-cyber-500 mb-1">{onlineCount}</div>
                    <div className="text-xs text-gray-500 uppercase flex items-center gap-1">
                        <Globe className="w-3 h-3"/> Online
                    </div>
                </div>
                <div className="bg-cyber-800/30 border border-cyber-700 p-4 rounded-lg">
                    <div className="text-2xl font-mono font-bold text-red-500 mb-1">{criticalCount}</div>
                    <div className="text-xs text-gray-500 uppercase flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3"/> Riskli
                    </div>
                </div>
                <div className="bg-cyber-800/30 border border-cyber-700 p-4 rounded-lg col-span-2">
                    <div className="flex justify-between items-center">
                        <div>
                             <div className="text-xl font-mono font-bold text-gray-400 mb-1">{devices.length}</div>
                             <div className="text-xs text-gray-500 uppercase">Toplam Veritabanı</div>
                        </div>
                        <div className="text-right">
                             <div className="text-xl font-mono font-bold text-gray-600 mb-1">{offlineCount}</div>
                             <div className="text-xs text-gray-500 uppercase">Offline</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Event Log - New Feature */}
            <div className="bg-black/40 border border-cyber-800 rounded-lg p-4 h-[300px] flex flex-col">
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-cyber-800">
                    <Clock className="w-4 h-4 text-cyber-500" />
                    <h3 className="text-xs font-bold text-gray-400 uppercase">Ağ Olay Günlüğü</h3>
                </div>
                <div className="flex-1 overflow-y-auto scrollbar-hide space-y-2 font-mono text-xs">
                    {logs.length === 0 ? (
                        <div className="text-gray-600 text-center italic mt-10">Olay bekleniyor...</div>
                    ) : (
                        logs.map((log) => (
                            <div key={log.id} className="flex gap-2 animate-fade-in">
                                <span className="text-gray-600">[{log.time}]</span>
                                <span className={`${
                                    log.type === 'alert' ? 'text-red-400' : 
                                    log.type === 'success' ? 'text-cyber-500' : 
                                    log.type === 'warning' ? 'text-purple-400' : 'text-blue-400'
                                }`}>
                                    {log.message}
                                </span>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>

        {/* Right Area: Results & Analysis */}
        <div className="lg:col-span-3 space-y-6 flex flex-col h-full">
            
            {/* Device List */}
            <div className="bg-cyber-800/30 border border-cyber-700 rounded-lg flex-1 flex flex-col overflow-hidden min-h-[500px]">
                <div className="p-4 border-b border-cyber-700 bg-cyber-800/50 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <Terminal className="w-4 h-4 text-cyber-500" />
                        <h3 className="font-mono text-sm font-bold text-gray-300">CANLI CİHAZ LİSTESİ</h3>
                    </div>
                    <span className="text-xs font-mono text-gray-500 animate-pulse">
                        {monitoring ? '● Canlı Veri Akışı' : '○ Beklemede'}
                    </span>
                </div>
                
                <div className="flex-1 overflow-auto scrollbar-hide relative bg-cyber-900/50">
                    {devices.length === 0 && !monitoring ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-600">
                            <Wifi className="w-16 h-16 mb-4 opacity-10" />
                            <p className="text-sm font-mono">İzleme başlatılmadı</p>
                            <p className="text-xs opacity-50 mt-2">"Canlı İzleme Başlat" butonuna tıklayın</p>
                        </div>
                    ) : (
                        <DeviceTable devices={devices} />
                    )}
                </div>
            </div>

            {/* AI Analysis Result */}
            {aiReport && (
                <div className="bg-gradient-to-br from-blue-900/10 to-purple-900/10 border border-blue-500/20 rounded-lg p-6 relative overflow-hidden animate-fade-in mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-blue-500/10 rounded-lg">
                                <FileText className="w-5 h-5 text-blue-400" />
                            </div>
                            <h3 className="text-lg font-bold text-blue-100">NetSentinel AI Raporu</h3>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-blue-400/60">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Son Güncelleme: {new Date().toLocaleTimeString()}</span>
                        </div>
                    </div>
                    
                    <div className="prose prose-invert prose-sm max-w-none prose-headings:text-blue-200 prose-a:text-blue-400 prose-strong:text-white">
                        <ReactMarkdown>{aiReport}</ReactMarkdown>
                    </div>
                </div>
            )}

        </div>
      </main>
    </div>
  );
}