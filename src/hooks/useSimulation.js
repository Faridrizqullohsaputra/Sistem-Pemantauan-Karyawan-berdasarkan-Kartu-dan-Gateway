import { useState, useEffect, useCallback, useRef } from 'react';
import {
  GATEWAYS,
  CARD_HOLDERS,
  INITIAL_DETECTIONS,
  generateHistoryRecords,
  EXTRA_CARDS_FOR_SIM,
  getCardHolder,
  getGateway,
} from '../data/simulationData';

export const useSimulation = () => {
  const [gateways, setGateways] = useState(GATEWAYS);
  const [activeDetections, setActiveDetections] = useState(INITIAL_DETECTIONS);
  const [historyRecords, setHistoryRecords] = useState(generateHistoryRecords());
  const [notifications, setNotifications] = useState([]);
  const [isSimRunning, setIsSimRunning] = useState(true);
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
      addNotification('warning', 'Simulasi', 'Semua kartu sudah dalam jangkauan.');
      return;
    }

    const cardId = available[Math.floor(Math.random() * available.length)];
    const connectedGateways = gateways.filter(g => g.status === 'connected');
    if (connectedGateways.length === 0) {
      addNotification('error', 'Simulasi', 'Tidak ada Gateway aktif.');
      return;
    }

    const gateway = connectedGateways[Math.floor(Math.random() * connectedGateways.length)];
    const holder = getCardHolder(cardId);
    const newId = ++histIdRef.current;

    const detection = {
      id: `DET-SIM-${newId}`,
      cardId,
      gatewayId: gateway.id,
      detectedAt: new Date().toISOString(),
      distanceAvailable: true,
      distance: 50,
      isActive: true,
      isSimulated: true,
    };

    const histRecord = {
      id: `HIST-SIM-${newId}`,
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
      isSimulated: true,
    };

    setActiveDetections(prev => [...prev, detection]);
    setHistoryRecords(prev => [histRecord, ...prev]);
    setTotalDetectionsToday(prev => prev + 1);
    setGateways(prev => prev.map(g =>
      g.id === gateway.id ? { ...g, detectedCount: g.detectedCount + 1, lastSeen: new Date().toISOString() } : g
    ));

    addNotification('success', 'Kartu Terdeteksi [SIM]',
      `${holder?.name || cardId} terdeteksi di ${gateway.name}`);
  }, [activeDetections, gateways, addNotification]);

  const simulateCardLeave = useCallback(() => {
    if (activeDetections.length === 0) {
      addNotification('warning', 'Simulasi', 'Tidak ada kartu aktif untuk dihapus.');
      return;
    }
    const idx = Math.floor(Math.random() * activeDetections.length);
    const det = activeDetections[idx];
    const holder = getCardHolder(det.cardId);
    const gw = getGateway(det.gatewayId);

    setActiveDetections(prev => prev.filter((_, i) => i !== idx));
    addNotification('info', 'Kartu Keluar Jangkauan [SIM]',
      `${holder?.name || det.cardId} keluar dari jangkauan ${gw?.name || det.gatewayId}`);
  }, [activeDetections, addNotification]);

  const updateDetectionTimes = useCallback(() => {
    // No-op: times are computed from stored ISO strings; components derive relative time on render
    // Just trigger a re-render for live clock feel
    setActiveDetections(prev => [...prev]);
  }, []);

  // Auto simulation tick
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
      // Update gateway statuses occasionally
      setGateways(prev => prev.map(g => ({
        ...g,
        lastSeen: g.status === 'connected' ? new Date().toISOString() : g.lastSeen,
        signalStrength: g.status === 'connected'
          ? Math.max(60, Math.min(99, g.signalStrength + Math.floor(Math.random() * 7) - 3))
          : g.signalStrength,
      })));
    }, 8000);

    return () => clearInterval(simIntervalRef.current);
  }, [isSimRunning, simulateNewDetection, simulateCardLeave]);

  const toggleSimulation = () => setIsSimRunning(prev => !prev);

  const connectedGateways = gateways.filter(g => g.status === 'connected').length;
  const totalRegistered = CARD_HOLDERS.length;

  return {
    gateways,
    setGateways,
    activeDetections,
    historyRecords,
    notifications,
    removeNotification,
    isSimRunning,
    toggleSimulation,
    simulateNewDetection,
    simulateCardLeave,
    totalDetectionsToday,
    connectedGateways,
    totalRegistered,
    addNotification,
  };
};
