import { useState, useEffect, useCallback, useRef } from 'react';
import {
  GATEWAYS,
  CARD_HOLDERS,
  INITIAL_DETECTIONS,
  generateHistoryRecords,
  getGateway,
} from '../data/simulationData';

// Hitung jarak Euclidean / koordinat meter antar dua Gateway
export const calculateGatewayDistance = (gwA, gwB) => {
  const lat1 = gwA?.lat ?? -6.8678;
  const lng1 = gwA?.lng ?? 112.4168;
  const lat2 = gwB?.lat ?? -6.8678;
  const lng2 = gwB?.lng ?? 112.4168;
  const dLat = (lat2 - lat1) * 111320;
  const dLng = (lng2 - lng1) * 111320 * Math.cos((lat1 * Math.PI) / 180);
  return Math.hypot(dLat, dLng);
};

// Cari Gateway terdekat yang tersedia (status connected)
export const findNearestAvailableGateway = (targetGw, gatewayList) => {
  const available = (gatewayList || []).filter(g => g.id !== targetGw?.id && g.status === 'connected');
  if (available.length === 0) return null;
  let nearest = available[0];
  let minDistance = calculateGatewayDistance(targetGw, nearest);
  for (let i = 1; i < available.length; i++) {
    const dist = calculateGatewayDistance(targetGw, available[i]);
    if (dist < minDistance) {
      minDistance = dist;
      nearest = available[i];
    }
  }
  return { gateway: nearest, distanceMeters: Math.round(minDistance) };
};

export const useSimulation = () => {
  // Gateways state (persisted to localStorage)
  const [gateways, setGateways] = useState(() => {
    try {
      const saved = localStorage.getItem('company_gateways_config');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const existingIds = new Set(parsed.map(g => g.id));
          const mergedList = parsed.map(savedGw => {
            const defGw = GATEWAYS.find(d => d.id === savedGw.id);
            return defGw ? { ...defGw, ...savedGw } : savedGw;
          });
          // Pastikan semua gateway standar (termasuk GW-08) tersedia jika belum ada di localStorage
          for (const defGw of GATEWAYS) {
            if (!existingIds.has(defGw.id)) {
              mergedList.push(defGw);
            }
          }
          return mergedList;
        }
      }
    } catch (e) {
      console.error('Error loading gateways config:', e);
    }
    return GATEWAYS;
  });

  // Save gateways to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('company_gateways_config', JSON.stringify(gateways));
    } catch (e) {
      console.error('Error saving gateways config:', e);
    }
  }, [gateways]);

  // Verifikasi koneksi ping riil ke Gateway 10.1.5.140 saat startup
  useEffect(() => {
    fetch('/api/gateway/ping?ip=10.1.5.140&id=GW-06')
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setGateways(prev => prev.map(g =>
            (g.ip === '10.1.5.140' || g.id === 'GW-06')
              ? { ...g, status: 'connected', latency: data.latency || 15, signalStrength: 88, lastSeen: new Date().toISOString(), issue: undefined }
              : g
          ));
        } else {
          setGateways(prev => prev.map(g =>
            (g.ip === '10.1.5.140' || g.id === 'GW-06')
              ? { ...g, status: 'error', latency: null, signalStrength: 0, issue: 'Koneksi perangkat terputus (RTO)' }
              : g
          ));
        }
      })
      .catch(() => {});
  }, []);

  // Registered cards state (persisted to localStorage)
  const [registeredCards, setRegisteredCards] = useState(() => {
    try {
      const saved = localStorage.getItem('company_registered_cards');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Filter out dummy cards (CARD- prefix, dummy names, and the Alt ID duplicate '562427')
          const DUMMY_NAMES = ['Ahmad Pratama', 'Siti Rahayu', 'Budi Santoso', 'Dewi Lestari',
            'Rendi Wijaya', 'Nia Kurniawan', 'Agus Setiawan', 'Fajar Nugraha',
            'Kartu Beacon K7 (Alt ID)', 'Kartu Beacon K7 (Fisik)'];
          const cleanList = parsed.filter(c =>
            !String(c.cardId).startsWith('CARD-') &&
            c.cardId !== '562427' &&
            !DUMMY_NAMES.includes(c.name)
          );
          // Ensure the canonical K7 card is always present
          const hasK7 = cleanList.some(c => c.cardId === 'BC572914269D');
          const merged = hasK7 ? cleanList : [...CARD_HOLDERS, ...cleanList];
          
          // Deduplicate by cardId to guarantee no duplicate registration ever appears
          const seen = new Set();
          const finalCards = [];
          for (const card of merged) {
            const key = String(card.cardId).toUpperCase().trim();
            if (!seen.has(key)) {
              seen.add(key);
              finalCards.push(card);
            }
          }

          try {
            localStorage.setItem('company_registered_cards', JSON.stringify(finalCards));
          } catch (e) {}
          return finalCards.length > 0 ? finalCards : CARD_HOLDERS;
        }
      }
    } catch (e) {
      console.error('Error loading registered cards:', e);
    }
    return CARD_HOLDERS;
  });

  // Save registered cards to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('company_registered_cards', JSON.stringify(registeredCards));
    } catch (e) {
      console.error('Error saving registered cards:', e);
    }
  }, [registeredCards]);

  const [activeDetections, setActiveDetections] = useState(INITIAL_DETECTIONS);
  const [historyRecords, setHistoryRecords] = useState(generateHistoryRecords());
  const [notifications, setNotifications] = useState([]);
  const [isSimRunning, setIsSimRunning] = useState(false);
  const [totalDetectionsToday, setTotalDetectionsToday] = useState(0);
  const [isScanningBLE, setIsScanningBLE] = useState(false);
  // Unknown card signals captured by gateway but not yet registered
  const [unknownCardSignals, setUnknownCardSignals] = useState([]);
  const simIntervalRef = useRef(null);
  const notifIdRef = useRef(0);
  const histIdRef = useRef(100);

  // Toast notification
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

  // Helper to find a card holder from current registeredCards
  const findCardHolder = useCallback((cardId) => {
    return registeredCards.find(c => c.cardId === cardId);
  }, [registeredCards]);

  // Handle when a gateway errors: apply error status & reassign detected cards to nearest available gateway
  const handleGatewayError = useCallback((gwId, reason = 'Koneksi perangkat gateway terputus (RTO)') => {
    const targetGw = gateways.find(g => g.id === gwId);
    const nowIso = new Date().toISOString();

    // 1. Terapkan status error pada Gateway
    setGateways(prev => prev.map(g =>
      g.id === gwId
        ? { ...g, status: 'error', latency: null, signalStrength: 0, issue: reason, lastSeen: nowIso }
        : g
    ));

    // 2. Alihkan kartu yang sedang terdeteksi di gateway yang error ke gateway terdekat yang aktif
    setActiveDetections(prevDetections => {
      const cardsOnThisGw = prevDetections.filter(d => d.gatewayId === gwId);
      if (cardsOnThisGw.length === 0) {
        return prevDetections;
      }

      // Cari gateway yang sedang aktif (connected) selain yang error
      const currentAvailable = gateways.filter(g => g.id !== gwId && g.status === 'connected');

      if (currentAvailable.length === 0) {
        addNotification(
          'error',
          `Gateway ${targetGw?.name || gwId} Offline`,
          `${cardsOnThisGw.length} kartu dikeluarkan dari jangkauan karena seluruh Gateway sedang offline.`
        );
        return prevDetections.filter(d => d.gatewayId !== gwId);
      }

      // Temukan gateway aktif terdekat berdasarkan koordinat GPS
      const nearestResult = findNearestAvailableGateway(targetGw || { id: gwId }, currentAvailable);
      const nearestGw = nearestResult?.gateway || currentAvailable[0];
      const distInfo = nearestResult?.distanceMeters ? ` (~${nearestResult.distanceMeters}m)` : '';

      // Buat rekaman riwayat pengalihan otomatis
      const newHistories = cardsOnThisGw.map(det => {
        const holder = findCardHolder(det.cardId);
        const newHistId = ++histIdRef.current;
        return {
          id: `HIST-${newHistId}`,
          cardId: det.cardId,
          holderName: holder?.name || 'Pemegang Kartu',
          department: holder?.department || '—',
          gatewayId: nearestGw.id,
          gatewayName: nearestGw.name,
          location: nearestGw.location,
          detectedAt: nowIso,
          distanceAvailable: true,
          distance: 25,
          cardStatus: holder?.status || 'active',
          cardType: holder?.cardType || 'employee',
          isSimulated: false,
          note: `Dialihkan otomatis dari ${targetGw?.name || gwId} karena gateway error (RTO)`,
        };
      });

      setHistoryRecords(prevHist => [...newHistories, ...prevHist]);

      addNotification(
        'warning',
        `⚠️ ${targetGw?.name || gwId} Error (RTO)`,
        `${cardsOnThisGw.length} kartu dialihkan otomatis ke gateway terdekat: ${nearestGw.name} (${nearestGw.id})${distInfo}.`
      );

      // Reassign all cards on this error gateway to the nearest available gateway
      return prevDetections.map(d =>
        d.gatewayId === gwId
          ? { ...d, gatewayId: nearestGw.id, detectedAt: nowIso, distance: 25 }
          : d
      );
    });
  }, [gateways, findCardHolder, addNotification]);

  // Trigger detection of a specific card ID (Real or Manual)
  // Ensures strictly 1 CARD = 1 GATEWAY (tidak pernah terdeteksi ganda di beberapa gateway)
  const detectCardById = useCallback((cardId, targetGatewayId = null) => {
    const cleanId = String(cardId).replace(/[: -]/g, '').toUpperCase();
    const holder = registeredCards.find(c => {
      const cClean = String(c.cardId || '').replace(/[: -]/g, '').toUpperCase();
      return cClean === cleanId || c.employeeId === cardId;
    });

    const nowIso = new Date().toISOString();

    // Tentukan gateway target secara spesifik
    let targetGw = null;
    if (targetGatewayId && targetGatewayId !== 'ALL') {
      targetGw = gateways.find(g => g.id === targetGatewayId);
    }
    if (!targetGw) {
      const connectedGateways = gateways.filter(g => g.status === 'connected');
      targetGw = connectedGateways[0] || gateways[0];
    }

    // Jika gateway target berstatus error/disconnected, alihkan ke gateway aktif terdekat
    let effectiveGw = targetGw;
    if (effectiveGw && (effectiveGw.status === 'error' || effectiveGw.status === 'disconnected')) {
      const activeGateways = gateways.filter(g => g.status === 'connected');
      if (activeGateways.length > 0) {
        const nearestResult = findNearestAvailableGateway(effectiveGw, activeGateways);
        const nearestGw = nearestResult?.gateway || activeGateways[0];
        addNotification(
          'warning',
          `Gateway ${effectiveGw.name} Sedang Error`,
          `Deteksi kartu dialihkan ke gateway aktif terdekat: ${nearestGw.name} (${nearestGw.id}).`
        );
        effectiveGw = nearestGw;
      }
    }

    // === KARTU TIDAK TERDAFTAR: tangkap sebagai sinyal asing ===
    if (!holder) {
      const newId = ++histIdRef.current;
      const unknownRecord = {
        id: `HIST-${newId}`,
        cardId: cleanId,
        holderName: 'Kartu Tidak Dikenal',
        department: '—',
        gatewayId: effectiveGw.id,
        gatewayName: effectiveGw.name,
        location: effectiveGw.location,
        detectedAt: nowIso,
        distanceAvailable: false,
        distance: null,
        cardStatus: 'unknown',
        cardType: 'unknown',
        isSimulated: false,
      };

      setHistoryRecords(prev => [unknownRecord, ...prev]);

      setUnknownCardSignals(prev => {
        const already = prev.find(u => u.cardId === cleanId);
        if (already) {
          return prev.map(u => u.cardId === cleanId
            ? { ...u, detectedAt: nowIso, count: (u.count || 1) + 1, gatewayId: effectiveGw.id, gatewayName: effectiveGw.name }
            : u
          );
        }
        return [{
          cardId: cleanId,
          gatewayId: effectiveGw.id,
          gatewayName: effectiveGw.name,
          location: effectiveGw.location,
          detectedAt: nowIso,
          count: 1,
        }, ...prev];
      });

      setGateways(prev => prev.map(g =>
        g.id === effectiveGw.id ? { ...g, detectedCount: g.detectedCount + 1, lastSeen: nowIso } : g
      ));

      addNotification(
        'warning',
        '⚠️ Sinyal Kartu Asing Tertangkap!',
        `ID ${cleanId} terdeteksi di ${effectiveGw.name} — kartu belum terdaftar. Daftarkan segera.`
      );
      return 'unknown';
    }

    if (holder.status !== 'active') {
      addNotification('warning', 'Kartu Nonaktif', `Kartu ${holder.name} (${cleanId}) berstatus nonaktif dan ditolak oleh sensor.`);
      return false;
    }

    const newId = ++histIdRef.current;

    const histRecord = {
      id: `HIST-${newId}`,
      cardId: holder.cardId,
      holderName: holder.name,
      department: holder.department || '—',
      gatewayId: effectiveGw.id,
      gatewayName: effectiveGw.name,
      location: effectiveGw.location,
      detectedAt: nowIso,
      distanceAvailable: true,
      distance: 50,
      cardStatus: holder.status,
      cardType: holder.cardType || 'employee',
      isSimulated: false,
    };

    const detection = {
      id: `DET-${newId}`,
      cardId: holder.cardId,
      gatewayId: effectiveGw.id,
      detectedAt: nowIso,
      distanceAvailable: true,
      distance: 50,
      isActive: true,
      isSimulated: false,
    };

    // STRICT CARD UNIQUENESS GUARANTEE:
    // Hapus kartu ini dari gateway manapun sebelumnya di activeDetections
    // sehingga kartu HANYA terdeteksi di satu gateway (effectiveGw) saja!
    setActiveDetections(prev => {
      const holderClean = String(holder.cardId).replace(/[: -]/g, '').toUpperCase();
      const withoutThisCard = prev.filter(d => {
        const dClean = String(d.cardId || '').replace(/[: -]/g, '').toUpperCase();
        return dClean !== cleanId && dClean !== holderClean;
      });
      return [detection, ...withoutThisCard];
    });

    setHistoryRecords(prev => [histRecord, ...prev]);
    setTotalDetectionsToday(prev => prev + 1);
    setGateways(prev => prev.map(g =>
      g.id === effectiveGw.id ? { ...g, lastSeen: nowIso } : g
    ));

    addNotification(
      'success',
      'Sinyal Kartu Fisik Tertangkap!',
      `${holder.name} (${holder.cardId}) terdeteksi pada ${effectiveGw.name} (${effectiveGw.id})`
    );
    return true;
  }, [registeredCards, gateways, addNotification]);

  // Quick-register an unknown card signal that was already captured
  const registerUnknownCard = useCallback((unknownSignal, cardData) => {
    // Remove from unknown signals list
    setUnknownCardSignals(prev => prev.filter(u => u.cardId !== unknownSignal.cardId));
    // Register the card normally (returns true/false)
    return true; // actual registration done via registerCard()
  }, []);

  // Batch detect all active cards at target gateway (or across all gateways)
  // Ensures strictly 1 CARD = 1 GATEWAY
  const detectAllActiveCards = useCallback((targetGatewayId = null) => {
    const activeCards = registeredCards.filter(c => c.status === 'active');
    if (activeCards.length === 0) {
      addNotification('warning', 'Tidak Ada Kartu Aktif', 'Belum ada kartu dengan status aktif yang dapat ditangkap.');
      return false;
    }

    const connectedGateways = gateways.filter(g => g.status === 'connected');
    const availableGateways = connectedGateways.length > 0 ? connectedGateways : gateways;
    if (availableGateways.length === 0) {
      addNotification('error', 'Gateway Offline', 'Tidak ada perangkat Gateway aktif yang dapat menerima deteksi.');
      return false;
    }

    const nowIso = new Date().toISOString();
    const isAllGateways = targetGatewayId === 'ALL';

    // === SEBAR KARTU AKTIF KE GATEWAY YANG TERSEDIA SECARA MERATA (1 KARTU = 1 GATEWAY) ===
    if (isAllGateways) {
      const newDetections = [];
      const newHistory = [];

      activeCards.forEach((holder, idx) => {
        const assignedGw = availableGateways[idx % availableGateways.length];
        const newId = ++histIdRef.current;

        newDetections.push({
          id: `DET-${newId}`,
          cardId: holder.cardId,
          gatewayId: assignedGw.id,
          detectedAt: nowIso,
          distanceAvailable: true,
          distance: Math.floor(Math.random() * 30) + 10,
          isActive: true,
          isSimulated: false,
        });

        newHistory.push({
          id: `HIST-${newId}`,
          cardId: holder.cardId,
          holderName: holder.name,
          department: holder.department || '—',
          gatewayId: assignedGw.id,
          gatewayName: assignedGw.name,
          location: assignedGw.location,
          detectedAt: nowIso,
          distanceAvailable: true,
          distance: Math.floor(Math.random() * 30) + 10,
          cardStatus: holder.status,
          cardType: holder.cardType || 'employee',
          isSimulated: false,
        });
      });

      // Filter out old detections of these cards, ensuring each card is only at its assigned gateway
      setActiveDetections(prev => {
        const activeIds = new Set(activeCards.map(c => String(c.cardId).replace(/[: -]/g, '').toUpperCase()));
        const remaining = prev.filter(d => !activeIds.has(String(d.cardId).replace(/[: -]/g, '').toUpperCase()));
        return [...newDetections, ...remaining];
      });

      setHistoryRecords(prev => [...newHistory, ...prev]);
      setTotalDetectionsToday(prev => prev + activeCards.length);

      addNotification(
        'success',
        'Seluruh Kartu Berhasil Dipetakan!',
        `${activeCards.length} kartu aktif berhasil ditangkap dan didistribusikan ke ${availableGateways.length} Gateway.`
      );
      return true;
    }

    // Specific Gateway detection for all active cards
    let gateway = gateways.find(g => g.id === targetGatewayId) || availableGateways[0];
    if (gateway.status === 'error' || gateway.status === 'disconnected') {
      const nearestResult = findNearestAvailableGateway(gateway, availableGateways);
      if (nearestResult) {
        gateway = nearestResult.gateway;
        addNotification('warning', 'Gateway Error', `Gateway ${targetGatewayId} sedang error (RTO), dialihkan ke ${gateway.name} (${gateway.id}).`);
      }
    }

    const newDetections = [];
    const newHistory = [];

    activeCards.forEach(holder => {
      const newId = ++histIdRef.current;
      newDetections.push({
        id: `DET-${newId}`,
        cardId: holder.cardId,
        gatewayId: gateway.id,
        detectedAt: nowIso,
        distanceAvailable: true,
        distance: Math.floor(Math.random() * 30) + 10,
        isActive: true,
        isSimulated: false,
      });

      newHistory.push({
        id: `HIST-${newId}`,
        cardId: holder.cardId,
        holderName: holder.name,
        department: holder.department || '—',
        gatewayId: gateway.id,
        gatewayName: gateway.name,
        location: gateway.location,
        detectedAt: nowIso,
        distanceAvailable: true,
        distance: Math.floor(Math.random() * 30) + 10,
        cardStatus: holder.status,
        cardType: holder.cardType || 'employee',
        isSimulated: false,
      });
    });

    setActiveDetections(prev => {
      const activeIds = new Set(activeCards.map(c => String(c.cardId).replace(/[: -]/g, '').toUpperCase()));
      const remaining = prev.filter(d => !activeIds.has(String(d.cardId).replace(/[: -]/g, '').toUpperCase()));
      return [...newDetections, ...remaining];
    });

    setHistoryRecords(prev => [...newHistory, ...prev]);
    setTotalDetectionsToday(prev => prev + activeCards.length);

    addNotification(
      'success',
      'Seluruh Kartu Aktif Tertangkap!',
      `${activeCards.length} kartu aktif berhasil ditangkap oleh sensor ${gateway.name} (${gateway.id})`
    );
    return true;
  }, [registeredCards, gateways, addNotification]);

  // Card Registration: add new card to system
  const registerCard = useCallback((cardData, autoDetect = false) => {
    // Check duplicate
    const exists = registeredCards.some(
      c => c.cardId.toLowerCase().trim() === cardData.cardId.toLowerCase().trim()
    );
    if (exists) {
      addNotification('error', 'Registrasi Gagal', `ID Kartu "${cardData.cardId}" sudah terdaftar sebelumnya.`);
      return false;
    }

    // Initials & Color
    const names = cardData.name.trim().split(' ');
    const avatarInitials = names.length > 1
      ? `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase()
      : cardData.name.substring(0, 2).toUpperCase();

    const colors = ['#6366f1', '#14b8a6', '#f59e0b', '#ec4899', '#06b6d4', '#8b5cf6', '#10b981'];
    const avatarColor = colors[Math.floor(Math.random() * colors.length)];

    const newCard = {
      cardId: cardData.cardId.trim().toUpperCase(),
      employeeId: (cardData.employeeId || `EMP-${Date.now().toString().slice(-4)}`).trim().toUpperCase(),
      name: cardData.name.trim(),
      department: cardData.department || 'General',
      division: cardData.division || cardData.department || 'Operasional',
      role: cardData.role || 'Staff',
      cardType: cardData.cardType || 'employee',
      status: cardData.status || 'active',
      avatarInitials,
      avatarColor,
      registeredAt: new Date().toISOString().split('T')[0],
    };

    setRegisteredCards(prev => [newCard, ...prev]);
    addNotification(
      'success',
      'Kartu Berhasil Didaftarkan',
      `Kartu ${newCard.cardId} atas nama ${newCard.name} telah terdaftar dan siap dideteksi.`
    );

    // If autoDetect requested and active, trigger detection right away
    if (autoDetect && newCard.status === 'active') {
      setTimeout(() => {
        detectCardById(newCard.cardId);
      }, 600);
    }

    return true;
  }, [registeredCards, addNotification, detectCardById]);

  // Update card data (Edit)
  const updateCard = useCallback((oldCardId, updatedData) => {
    setRegisteredCards(prev => prev.map(c => {
      if (c.cardId === oldCardId) {
        const newName = (updatedData.name || c.name).trim();
        const names = newName.split(' ');
        const avatarInitials = names.length > 1
          ? `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase()
          : newName.substring(0, 2).toUpperCase();

        return {
          ...c,
          ...updatedData,
          name: newName,
          cardId: (updatedData.cardId || c.cardId).trim().toUpperCase(),
          employeeId: (updatedData.employeeId || c.employeeId).trim().toUpperCase(),
          avatarInitials: avatarInitials || c.avatarInitials,
        };
      }
      return c;
    }));

    // If card was active, update references
    if (updatedData.cardId && updatedData.cardId !== oldCardId) {
      setActiveDetections(prev => prev.map(d =>
        d.cardId === oldCardId ? { ...d, cardId: updatedData.cardId.trim().toUpperCase() } : d
      ));
    }

    addNotification('success', 'Data Kartu Diperbarui', `Informasi kartu ${updatedData.name || oldCardId} telah berhasil disimpan.`);
  }, [addNotification]);

  // Purge all dummy data
  const clearAllDummyCards = useCallback(() => {
    setRegisteredCards(CARD_HOLDERS);
    setActiveDetections([]);
    setHistoryRecords([]);
    setTotalDetectionsToday(0);
    try {
      localStorage.setItem('company_registered_cards', JSON.stringify(CARD_HOLDERS));
    } catch (e) {}
    addNotification('info', 'Data Dummy Dihapus', 'Seluruh data dummy berhasil dibersihkan. Hanya tersisa kartu fisik K7.');
  }, [addNotification]);

  // Toggle active/inactive status of a card
  const toggleCardStatus = useCallback((cardId) => {
    setRegisteredCards(prev => prev.map(c => {
      if (c.cardId === cardId) {
        const nextStatus = c.status === 'active' ? 'inactive' : 'active';
        if (nextStatus === 'inactive') {
          // If made inactive, remove from active detections
          setActiveDetections(curr => curr.filter(d => d.cardId !== cardId));
          addNotification('warning', 'Kartu Dinonaktifkan', `Kartu ${c.name} (${c.cardId}) dinonaktifkan dan dikeluarkan dari deteksi.`);
        } else {
          addNotification('success', 'Kartu Diaktifkan', `Kartu ${c.name} (${c.cardId}) kini aktif dan dapat dideteksi kembali.`);
        }
        return { ...c, status: nextStatus };
      }
      return c;
    }));
  }, [addNotification]);

  // Delete card from registry
  const deleteCard = useCallback((cardId) => {
    const card = registeredCards.find(c => c.cardId === cardId);
    setRegisteredCards(prev => {
      const next = prev.filter(c => c.cardId !== cardId);
      try {
        localStorage.setItem('company_registered_cards', JSON.stringify(next));
      } catch (e) {}
      return next;
    });
    setActiveDetections(prev => prev.filter(d => d.cardId !== cardId));
    setHistoryRecords(prev => prev.filter(h => h.cardId !== cardId));
    addNotification('info', 'Kartu Dihapus', `Kartu ${card?.name || cardId} telah dihapus dari sistem registrasi.`);
  }, [registeredCards, addNotification]);

  // Automated detection tick: strictly pick from registeredCards with status === 'active'
  const simulateNewDetection = useCallback(() => {
    const activeCardIds = activeDetections.map(d => d.cardId);
    // ONLY ACTIVE REGISTERED CARDS CAN BE DETECTED
    const eligibleCards = registeredCards.filter(c => c.status === 'active');
    const available = eligibleCards.filter(c => !activeCardIds.includes(c.cardId));

    if (available.length === 0) return;

    const chosenCard = available[Math.floor(Math.random() * available.length)];
    const connectedGateways = gateways.filter(g => g.status === 'connected');
    if (connectedGateways.length === 0) return;

    const gateway = connectedGateways[Math.floor(Math.random() * connectedGateways.length)];
    const newId = ++histIdRef.current;
    const nowIso = new Date().toISOString();

    const detection = {
      id: `DET-${newId}`,
      cardId: chosenCard.cardId,
      gatewayId: gateway.id,
      detectedAt: nowIso,
      distanceAvailable: true,
      distance: 50,
      isActive: true,
      isSimulated: false,
    };

    const histRecord = {
      id: `HIST-${newId}`,
      cardId: chosenCard.cardId,
      holderName: chosenCard.name,
      department: chosenCard.department || '—',
      gatewayId: gateway.id,
      gatewayName: gateway.name,
      location: gateway.location,
      detectedAt: nowIso,
      distanceAvailable: false,
      distance: null,
      cardStatus: chosenCard.status,
      cardType: chosenCard.cardType || 'employee',
      isSimulated: false,
    };

    setActiveDetections(prev => [detection, ...prev]);
    setHistoryRecords(prev => [histRecord, ...prev]);
    setTotalDetectionsToday(prev => prev + 1);
    setGateways(prev => prev.map(g =>
      g.id === gateway.id ? { ...g, detectedCount: g.detectedCount + 1, lastSeen: nowIso } : g
    ));

    addNotification('success', 'Kartu Terdeteksi', `${chosenCard.name} terdeteksi di ${gateway.name}`);
  }, [activeDetections, registeredCards, gateways, addNotification]);

  // Card leave simulation
  const simulateCardLeave = useCallback(() => {
    if (activeDetections.length === 0) return;
    const idx = Math.floor(Math.random() * activeDetections.length);
    const det = activeDetections[idx];
    const holder = findCardHolder(det.cardId);
    const gw = getGateway(det.gatewayId);

    setActiveDetections(prev => prev.filter((_, i) => i !== idx));
    addNotification('info', 'Kartu Keluar Jangkauan',
      `${holder?.name || det.cardId} keluar dari jangkauan ${gw?.name || det.gatewayId}`);
  }, [activeDetections, findCardHolder, addNotification]);

  // Real-time Gateway IoT polling tick
  useEffect(() => {
    if (!isSimRunning) {
      clearInterval(simIntervalRef.current);
      return;
    }
    simIntervalRef.current = setInterval(() => {
      const rand = Math.random();
      const activeEligible = registeredCards.filter(c => c.status === 'active');
      if (rand < 0.35 && activeDetections.length < activeEligible.length) {
        simulateNewDetection();
      } else if (rand < 0.55 && activeDetections.length > 5) {
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
  }, [isSimRunning, simulateNewDetection, simulateCardLeave, activeDetections.length, registeredCards]);

  const [isSyncing, setIsSyncing] = useState(false);
  const syncNetworkData = useCallback(async () => {
    setIsSyncing(true);
    addNotification('info', 'Uji Jaringan Dimulai', `Menguji komunikasi ping ke seluruh ${gateways.length} perangkat Gateway...`);

    const pingResults = await Promise.allSettled(
      gateways.map(async (gw) => {
        try {
          const res = await fetch(`/api/gateway/ping?ip=${encodeURIComponent(gw.ip)}&id=${encodeURIComponent(gw.id)}`);
          const data = await res.json();
          return {
            id: gw.id,
            success: !!data.success,
            latency: data.latency,
            ttl: data.ttl,
          };
        } catch (e) {
          return { id: gw.id, success: false };
        }
      })
    );

    let onlineCount = 0;
    let errorCount = 0;
    const erroredGwIds = [];

    setGateways(prev => prev.map(g => {
      const match = pingResults.find(r => r.status === 'fulfilled' && r.value.id === g.id);
      const isOnline = match && match.value.success;

      if (isOnline) {
        onlineCount++;
        return {
          ...g,
          status: 'connected',
          latency: match.value.latency || 15,
          signalStrength: 88,
          lastSeen: new Date().toISOString(),
          issue: undefined,
        };
      } else {
        errorCount++;
        erroredGwIds.push(g.id);
        return {
          ...g,
          status: 'error',
          latency: null,
          signalStrength: 0,
          issue: 'Koneksi perangkat gateway terputus (RTO)',
          lastSeen: new Date().toISOString(),
        };
      }
    }));

    // Otomatis alihkan kartu pada gateway yang error ke gateway aktif terdekat
    if (erroredGwIds.length > 0) {
      erroredGwIds.forEach(id => {
        handleGatewayError(id, 'Koneksi perangkat gateway terputus (RTO)');
      });
    }

    setIsSyncing(false);
    addNotification(
      errorCount > 0 ? 'warning' : 'success',
      'Diagnostik Jaringan Selesai',
      `Hasil Uji Ping: ${onlineCount} Gateway Online, ${errorCount} Gateway Error.`
    );
  }, [gateways, handleGatewayError, addNotification]);

  // Update specific gateway position & optional radius
  const updateGatewayPosition = useCallback((gwId, lat, lng, radius = null) => {
    setGateways(prev => prev.map(g => {
      if (g.id === gwId) {
        const updated = {
          ...g,
          lat: parseFloat(lat),
          lng: parseFloat(lng),
        };
        if (radius !== null && !isNaN(radius)) {
          updated.radius = Number(radius);
        }
        return updated;
      }
      return g;
    }));
    const target = gateways.find(g => g.id === gwId);
    addNotification(
      'success',
      'Posisi Gateway Disimpan',
      `Koordinat ${target?.name || gwId} diperbarui ke [${Number(lat).toFixed(5)}, ${Number(lng).toFixed(5)}]`
    );
  }, [gateways, addNotification]);

  // Update gateway device parameters & location coordinates
  const updateGatewayDevice = useCallback((gwId, updatedData) => {
    setGateways(prev => prev.map(g => {
      if (g.id === gwId) {
        const nextStatus = updatedData.status || g.status;
        const updated = {
          ...g,
          name: updatedData.name ? updatedData.name.trim() : g.name,
          ip: updatedData.ip ? updatedData.ip.trim() : g.ip,
          url: updatedData.url ? updatedData.url.trim() : g.url,
          serviceAccess: updatedData.serviceAccess || g.serviceAccess,
          authType: updatedData.authType || g.authType,
          maxPacketSize: updatedData.maxPacketSize ? Number(updatedData.maxPacketSize) : g.maxPacketSize,
          radius: updatedData.radius ? Number(updatedData.radius) : g.radius,
          status: nextStatus,
          latency: updatedData.latency !== undefined ? updatedData.latency : (nextStatus === 'error' ? null : g.latency),
          signalStrength: updatedData.signalStrength !== undefined ? updatedData.signalStrength : (nextStatus === 'error' ? 0 : g.signalStrength),
          issue: updatedData.issue !== undefined ? updatedData.issue : (nextStatus === 'error' ? 'Koneksi perangkat terputus' : g.issue),
          location: updatedData.location ? updatedData.location.trim() : g.location,
          lat: updatedData.lat !== undefined && !isNaN(Number(updatedData.lat)) ? Number(updatedData.lat) : g.lat,
          lng: updatedData.lng !== undefined && !isNaN(Number(updatedData.lng)) ? Number(updatedData.lng) : g.lng,
          zone: updatedData.zone ? updatedData.zone.trim() : g.zone,
        };
        return updated;
      }
      return g;
    }));

    // Jika status diatur menjadi error atau disconnected, alihkan kartu di gateway ini ke gateway terdekat
    if (updatedData.status === 'error' || updatedData.status === 'disconnected') {
      handleGatewayError(gwId, updatedData.issue || 'Status Gateway diatur ke Error');
    } else {
      addNotification(
        'success',
        'Konfigurasi Gateway Disimpan',
        `Parameter perangkat ${gwId} berhasil diperbarui.`
      );
    }
  }, [handleGatewayError, addNotification]);

  // Add a brand-new Gateway to the system
  const addGateway = useCallback((newGwData) => {
    let createdGw = null;
    setGateways(prev => {
      const nextNum = prev.length + 1;
      const newId = newGwData.id || `GW-${String(nextNum).padStart(2, '0')}`;
      // Avoid ID collision
      const safeId = prev.some(g => g.id === newId)
        ? `GW-${String(Date.now()).slice(-4)}`
        : newId;

      const gateway = {
        id: safeId,
        name: (newGwData.name || `Gateway Deteksi ${String(nextNum).padStart(2, '0')}`).trim(),
        ip: (newGwData.ip || '10.1.5.10').trim(),
        url: (newGwData.url || `http://${newGwData.ip || '10.1.5.10'}`).trim(),
        location: (newGwData.location || 'Titik Penempatan Baru').trim(),
        zone: (newGwData.zone || 'Shorebase Zone').trim(),
        lat: !isNaN(Number(newGwData.lat)) ? Number(newGwData.lat) : -6.8678,
        lng: !isNaN(Number(newGwData.lng)) ? Number(newGwData.lng) : 112.4168,
        status: newGwData.status || 'connected',
        serviceAccess: newGwData.serviceAccess || 'HTTP',
        authType: newGwData.authType || 'Bearer Token',
        maxPacketSize: Number(newGwData.maxPacketSize) || 1024,
        radius: Number(newGwData.radius) || 50,
        signalStrength: 90,
        latency: 15,
        detectedCount: 0,
        lastSeen: new Date().toISOString(),
      };
      createdGw = gateway;

      const updated = [...prev, gateway];
      try {
        localStorage.setItem('company_gateways_config', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
    addNotification(
      'success',
      'Gateway Baru Ditambahkan!',
      `Gateway "${newGwData.name || 'Gateway Baru'}" berhasil didaftarkan ke sistem dan tersimpan permanen.`
    );
    return createdGw;
  }, [addNotification]);

  // Delete a gateway by ID
  const deleteGateway = useCallback((gwId) => {
    const gw = gateways.find(g => g.id === gwId);
    setGateways(prev => {
      const updated = prev.filter(g => g.id !== gwId);
      try {
        localStorage.setItem('company_gateways_config', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
    // Remove active detections from deleted gateway
    setActiveDetections(prev => prev.filter(d => d.gatewayId !== gwId));
    addNotification(
      'info',
      'Gateway Dihapus',
      `Gateway ${gw?.name || gwId} (${gwId}) telah dihapus dari sistem.`
    );
  }, [gateways, addNotification]);

  // Reset all gateway positions to default Lamongan Shorebase layout
  const resetGatewayPositions = useCallback(() => {
    setGateways(GATEWAYS);
    try {
      localStorage.removeItem('company_gateways_config');
    } catch (e) {}
    addNotification(
      'info',
      'Posisi Gateway Direset',
      'Seluruh titik koordinat Gateway dikembalikan ke tata letak standar Lamongan Shorebase.'
    );
  }, [addNotification]);

  // Scan real Bluetooth BLE device (supports all registered cards)
  const scanBluetoothDevice = useCallback(async (targetGatewayId = 'GW-01', specificCardId = null) => {
    if (!navigator.bluetooth) {
      addNotification(
        'warning',
        'Web Bluetooth API Tidak Didukung',
        'Browser Anda belum mengizinkan Web Bluetooth API. Gunakan Chrome/Edge, atau kirim sinyal kartu melalui HTTP Webhook /api/gateway/report.'
      );
      return false;
    }

    try {
      setIsScanningBLE(true);
      addNotification(
        'info',
        'Memindai Bluetooth...',
        'Pilih perangkat beacon / kartu BLE pada jendela dialog Bluetooth yang muncul.'
      );

      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: ['generic_access', 'battery_service']
      });

      setIsScanningBLE(false);
      
      // Determine which registered card to associate with
      let targetCard = null;
      if (specificCardId && specificCardId !== 'ALL') {
        targetCard = registeredCards.find(c => c.cardId === specificCardId);
      }
      if (!targetCard) {
        // Try to match device name or id with any registered active card
        targetCard = registeredCards.find(c =>
          c.status === 'active' && (
            (device.name && c.name.toLowerCase().includes(device.name.toLowerCase())) ||
            (device.name && device.name.toUpperCase().includes(c.cardId.toUpperCase()))
          )
        ) || registeredCards.find(c => c.status === 'active');
      }

      const cardIdToDetect = targetCard?.cardId || 'BC572914269D';
      detectCardById(cardIdToDetect, targetGatewayId);

      addNotification(
        'success',
        'Sinyal Kartu Fisik Tertangkap!',
        `Kartu ${targetCard?.name || device.name || 'Kartu BLE'} (${cardIdToDetect}) berhasil terdeteksi di ${targetGatewayId}!`
      );
      return true;
    } catch (err) {
      setIsScanningBLE(false);
      if (err.name !== 'NotFoundError') {
        addNotification('error', 'Gagal Memindai BLE', err.message || 'Gagal menangkap sinyal Bluetooth.');
      }
      return false;
    }
  }, [registeredCards, detectCardById, addNotification]);

  // Real IoT Gateway SSE Stream Listener (catches POST /api/gateway/report from real gateways)
  useEffect(() => {
    let eventSource;
    try {
      eventSource = new EventSource('/api/realtime-stream');
      eventSource.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === 'CARD_DETECTION' && payload.cardId) {
            detectCardById(payload.cardId, payload.gatewayId || 'GW-01');
          }
        } catch (err) {
          console.error('Error parsing SSE payload:', err);
        }
      };
    } catch (err) {
      console.warn('Real-time SSE not available:', err);
    }

    return () => {
      if (eventSource) eventSource.close();
    };
  }, [detectCardById]);

  const connectedGateways = gateways.filter(g => g.status === 'connected').length;
  const totalRegistered = registeredCards.length;

  return {
    gateways,
    setGateways,
    handleGatewayError,
    updateGatewayPosition,
    updateGatewayDevice,
    resetGatewayPositions,
    addGateway,
    deleteGateway,
    activeDetections,
    historyRecords,
    registeredCards,
    registerCard,
    updateCard,
    deleteCard,
    toggleCardStatus,
    detectCardById,
    detectAllActiveCards,
    clearAllDummyCards,
    scanBluetoothDevice,
    isScanningBLE,
    isSimRunning,
    setIsSimRunning,
    notifications,
    removeNotification,
    totalDetectionsToday,
    connectedGateways,
    totalRegistered,
    addNotification,
    isSyncing,
    syncNetworkData,
    findCardHolder,
    unknownCardSignals,
    registerUnknownCard,
  };
};
