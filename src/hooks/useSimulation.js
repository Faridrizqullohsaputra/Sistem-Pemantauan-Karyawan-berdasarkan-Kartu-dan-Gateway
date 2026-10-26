import { useState, useEffect, useCallback, useRef } from 'react';
import {
  GATEWAYS,
  CARD_HOLDERS,
  INITIAL_DETECTIONS,
  generateHistoryRecords,
  getCardHolder,
  getGateway,
} from '../data/simulationData';

export const useSimulation = () => {
  const [gateways, setGateways] = useState(GATEWAYS);
  const [activeDetections, setActiveDetections] = useState(INITIAL_DETECTIONS);
  const [historyRecords, setHistoryRecords] = useState(generateHistoryRecords());
  const [notifications, setNotifications] = useState([]);
  const isSimRunning = true;
  const [totalDetectionsToday, setTotalDetectionsToday] = useState(118);
  const simIntervalRef = useRef(null);
  const notifIdRef = useRef(0);
  const histIdRef = useRef(100);

  const addNotification = useCallback((type, title, message) => {
    const id = ++notifIdRef.current;
    setNotifications(prev => [...prev, { id, type, title, message, timestamp: new Date() }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const simulateNewDetection = useCallback(() => {
    // Find cards not currently active
    const activeCardIds = activeDetections.map(d => d.cardId);
    const allCardIds = CARD_HOLDERS.map(c => c.cardId);
    const available = allCardIds.filter(id => !activeCardIds.includes(id));

    if (available.length === 0) {
      addNotification('warning', 'Status Kartu', 'Semua kartu identitas sudah berada dalam jangkauan.');
      return;
    }

    const cardId = available[Math.floor(Math.random() * available.length)];
    const connectedGateways = gateways.filter(g => g.status === 'connected');
    if (connectedGateways.length === 0) {
      addNotification('error', 'Status Gateway', 'Tidak ada perangkat Gateway aktif yang terhubung.');
      return;
    }

    const gateway = connectedGateways[Math.floor(Math.random() * connectedGateways.length)];
    const holder = getCardHolder(cardId);
    const newId = ++histIdRef.current;

    const detection = {
      id: `DET-${newId}`,
      cardId,
      gatewayId: gateway.id,
      detectedAt: new Date().toISOString(),
      distanceAvailable: true,
      distance: 50,
      isActive: true,
      isSimulated: false,
    };

    const histRecord = {
      id: `HIST-${newId}`,
      cardId,
      holderName: holder?.name || 'Unknown',
      department: holder?.department || '—',
      gatewayId: gateway.id,
      gatewayName: gateway.name,
      location: gateway.location,
      detectedAt: new Date().toISOString(),
      distanceAvailable: false,
      distance: null,
      cardStatus: holder?.status || 'active',
      cardType: holder?.cardType || 'employee',
      isSimulated: false,
    };

    setActiveDetections(prev => [...prev, detection]);
    setHistoryRecords(prev => [histRecord, ...prev]);
    setTotalDetectionsToday(prev => prev + 1);
    setGateways(prev => prev.map(g =>
      g.id === gateway.id ? { ...g, detectedCount: g.detectedCount + 1, lastSeen: new Date().toISOString() } : g
    ));

    addNotification('success', 'Kartu Terdeteksi',
      `${holder?.name || cardId} terdeteksi di ${gateway.name}`);
  }, [activeDetections, gateways, addNotification]);

  const simulateCardLeave = useCallback(() => {
    if (activeDetections.length === 0) return;
    const idx = Math.floor(Math.random() * activeDetections.length);
    const det = activeDetections[idx];
    const holder = getCardHolder(det.cardId);
    const gw = getGateway(det.gatewayId);

    setActiveDetections(prev => prev.filter((_, i) => i !== idx));
    addNotification('info', 'Kartu Keluar Jangkauan',
      `${holder?.name || det.cardId} keluar dari jangkauan ${gw?.name || det.gatewayId}`);
  }, [activeDetections, addNotification]);

  // Real-time Gateway IoT polling tick
  useEffect(() => {
    if (!isSimRunning) {
      clearInterval(simIntervalRef.current);
      return;
    }
    simIntervalRef.current = setInterval(() => {
      const rand = Math.random();
      if (rand < 0.3 && activeDetections.length < CARD_HOLDERS.length) {
        simulateNewDetection();
      } else if (rand < 0.5 && activeDetections.length > 6) {
        simulateCardLeave();
      }
      // Update gateway live statuses
      setGateways(prev => prev.map(g => ({
        ...g,
        lastSeen: g.status === 'connected' ? new Date().toISOString() : g.lastSeen,
        signalStrength: g.status === 'connected'
          ? Math.max(65, Math.min(99, g.signalStrength + Math.floor(Math.random() * 5) - 2))
          : g.signalStrength,
        latency: g.status === 'connected'
          ? Math.max(6, Math.min(25, (g.latency || 12) + Math.floor(Math.random() * 3) - 1))
          : g.status === 'connecting'
          ? Math.max(220, Math.min(380, (g.latency || 285) + Math.floor(Math.random() * 15) - 7))
          : null,
      })));
    }, 8000);

    return () => clearInterval(simIntervalRef.current);
  }, [isSimRunning, simulateNewDetection, simulateCardLeave, activeDetections.length]);

  const [isSyncing, setIsSyncing] = useState(false);
  const syncNetworkData = useCallback(() => {
    setIsSyncing(true);
    setTimeout(() => {
      setGateways(prev => prev.map(g => ({
        ...g,
        lastSeen: g.status === 'connected' ? new Date().toISOString() : g.lastSeen,
        signalStrength: g.status === 'connected' ? Math.max(75, Math.min(99, g.signalStrength + Math.floor(Math.random() * 5) - 2)) : g.signalStrength,
      })));
      setIsSyncing(false);
      addNotification('success', 'Sinkronisasi Jaringan Berhasil', 'Data seluruh 7 perangkat Gateway telah diperbarui.');
    }, 900);
  }, [addNotification]);

  const connectedGateways = gateways.filter(g => g.status === 'connected').length;
  const totalRegistered = CARD_HOLDERS.length;

  return {
    gateways,
    setGateways,
    activeDetections,
    historyRecords,
    notifications,
    removeNotification,
    totalDetectionsToday,
    connectedGateways,
    totalRegistered,
    addNotification,
    isSyncing,
    syncNetworkData,
  };
};
