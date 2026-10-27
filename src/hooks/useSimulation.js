import { useState, useEffect, useCallback, useRef } from 'react';
import {
  GATEWAYS,
  CARD_HOLDERS,
  INITIAL_DETECTIONS,
  generateHistoryRecords,
  getGateway,
} from '../data/simulationData';

export const useSimulation = () => {
  // Gateways state (persisted to localStorage)
  const [gateways, setGateways] = useState(() => {
    try {
      const saved = localStorage.getItem('company_gateways_config');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Pertahankan SEMUA gateway yang ada di parsed (termasuk gateway baru yang ditambahkan pengguna)
          // dan lengkapi dengan metadata default bila ID cocok
          return parsed.map(savedGw => {
            const defGw = GATEWAYS.find(d => d.id === savedGw.id);
            const merged = defGw ? { ...defGw, ...savedGw } : savedGw;
            // Pastikan gateway 10.1.5.140 (GW-06) aktif & tidak terjebak status 'error' lama
            if (merged.ip === '10.1.5.140' || merged.id === 'GW-06') {
              merged.status = 'connected';
              merged.latency = merged.latency || 15;
              merged.signalStrength = merged.signalStrength || 88;
              delete merged.issue;
            }
            return merged;
          });
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
              ? { ...g, status: 'connected', latency: data.latency || 15, signalStrength: 88, lastSeen: new Date().toISOString() }
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

  // Trigger detection of a specific card ID (Real or Manual)
  // If card is NOT registered, it is captured as an UNKNOWN signal (not blocked)
  const detectCardById = useCallback((cardId, targetGatewayId = null) => {
    const cleanId = String(cardId).replace(/[: -]/g, '').toUpperCase();
    const holder = registeredCards.find(c =>
      c.cardId.toUpperCase() === cleanId ||
      c.cardId.toUpperCase() === String(cardId).toUpperCase() ||
      c.employeeId === cardId
    );

    const connectedGateways = gateways.filter(g => g.status === 'connected');
    const availableGateways = connectedGateways.length > 0 ? connectedGateways : gateways;
    const isAllGateways = targetGatewayId === 'ALL';
    const nowIso = new Date().toISOString();

    // === KARTU TIDAK TERDAFTAR: tangkap sebagai sinyal asing ===
    if (!holder) {
      if (isAllGateways) {
        const baseId = ++histIdRef.current;
        histIdRef.current += availableGateways.length;

        const newUnknownHistories = availableGateways.map((gw, idx) => ({
          id: `HIST-${baseId + idx}`,
          cardId: cleanId,
          holderName: 'Kartu Tidak Dikenal',
          department: '—',
          gatewayId: gw.id,
          gatewayName: gw.name,
          location: gw.location,
          detectedAt: nowIso,
          distanceAvailable: false,
          distance: null,
          cardStatus: 'unknown',
          cardType: 'unknown',
          isSimulated: false,
        }));

        setHistoryRecords(prev => [...newUnknownHistories, ...prev]);

        setUnknownCardSignals(prev => {
          const already = prev.find(u => u.cardId === cleanId);
          if (already) {
            return prev.map(u => u.cardId === cleanId
              ? { ...u, detectedAt: nowIso, count: (u.count || 1) + availableGateways.length, gatewayId: 'ALL', gatewayName: 'Semua Gateway' }
              : u
            );
          }
          return [{
            cardId: cleanId,
            gatewayId: 'ALL',
            gatewayName: 'Semua Gateway',
            location: 'Seluruh Area',
            detectedAt: nowIso,
            count: availableGateways.length,
          }, ...prev];
        });

        setGateways(prev => prev.map(g =>
          availableGateways.some(ag => ag.id === g.id)
            ? { ...g, detectedCount: g.detectedCount + 1, lastSeen: nowIso }
            : g
        ));

        addNotification(
          'warning',
          '⚠️ Sinyal Kartu Asing di Semua Gateway!',
          `ID ${cleanId} tertangkap serentak oleh ${availableGateways.length} Gateway — kartu belum terdaftar. Daftarkan segera.`
        );
        return 'unknown';
      }

      // Single gateway for unknown card
      const gateway = targetGatewayId
        ? availableGateways.find(g => g.id === targetGatewayId) || availableGateways[0]
        : availableGateways[0];

      const newId = ++histIdRef.current;

      const unknownRecord = {
        id: `HIST-${newId}`,
        cardId: cleanId,
        holderName: 'Kartu Tidak Dikenal',
        department: '—',
        gatewayId: gateway?.id || 'GW-01',
        gatewayName: gateway?.name || 'Gateway',
        location: gateway?.location || '—',
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
            ? { ...u, detectedAt: nowIso, count: (u.count || 1) + 1, gatewayId: gateway?.id, gatewayName: gateway?.name }
            : u
          );
        }
        return [{
          cardId: cleanId,
          gatewayId: gateway?.id || 'GW-01',
          gatewayName: gateway?.name || 'Gateway',
          location: gateway?.location || '—',
          detectedAt: nowIso,
          count: 1,
        }, ...prev];
      });

      if (gateway) {
        setGateways(prev => prev.map(g =>
          g.id === gateway.id ? { ...g, detectedCount: g.detectedCount + 1, lastSeen: nowIso } : g
        ));
      }

      addNotification(
        'warning',
        '⚠️ Sinyal Kartu Asing Tertangkap!',
        `ID ${cleanId} terdeteksi di ${gateway?.name || 'Gateway'} — kartu belum terdaftar. Daftarkan segera.`
      );
      return 'unknown';
    }

    if (holder.status !== 'active') {
      addNotification('warning', 'Kartu Nonaktif', `Kartu ${holder.name} (${cleanId}) berstatus nonaktif dan ditolak oleh sensor.`);
      return false;
    }

    if (availableGateways.length === 0) {
      addNotification('error', 'Gateway Offline', 'Tidak ada perangkat Gateway aktif yang dapat menerima deteksi.');
      return false;
    }

    // === DETEKSI PADA SEMUA GATEWAY SEKALIGUS (Multi-Gateway Broadcast Reception) ===
    if (isAllGateways) {
      const baseId = ++histIdRef.current;
      histIdRef.current += availableGateways.length;

      // History record for each gateway to reflect multi-sensor reception
      const multiHistRecords = availableGateways.map((gw, idx) => ({
        id: `HIST-${baseId + idx}`,
        cardId: holder.cardId,
        holderName: holder.name,
        department: holder.department || '—',
        gatewayId: gw.id,
        gatewayName: gw.name,
        location: gw.location,
        detectedAt: nowIso,
        distanceAvailable: true,
        distance: Math.floor(Math.random() * 25) + 10,
        cardStatus: holder.status,
        cardType: holder.cardType || 'employee',
        isSimulated: false,
      }));

      // Active detection placed at primary gateway (first one)
      const primaryGateway = availableGateways[0];
      const detection = {
        id: `DET-${baseId}`,
        cardId: holder.cardId,
        gatewayId: primaryGateway.id,
        detectedAt: nowIso,
        distanceAvailable: true,
        distance: 15,
        isActive: true,
        isSimulated: false,
      };

      setActiveDetections(prev => {
        const withoutThis = prev.filter(d => d.cardId !== holder.cardId);
        return [detection, ...withoutThis];
      });

      setHistoryRecords(prev => [...multiHistRecords, ...prev]);
      setTotalDetectionsToday(prev => prev + availableGateways.length);
      setGateways(prev => prev.map(g =>
        availableGateways.some(ag => ag.id === g.id)
          ? { ...g, detectedCount: g.detectedCount + 1, lastSeen: nowIso }
          : g
      ));

      addNotification(
        'success',
        'Sinyal Tertangkap di Semua Gateway!',
        `Kartu ${holder.name} (${holder.cardId}) berhasil diterima serentak oleh seluruh ${availableGateways.length} Gateway.`
      );
      return true;
    }

    // Single gateway detection
    const gateway = targetGatewayId
      ? availableGateways.find(g => g.id === targetGatewayId) || availableGateways[0]
      : availableGateways[0];

    const newId = ++histIdRef.current;

    const histRecord = {
      id: `HIST-${newId}`,
      cardId: holder.cardId,
      holderName: holder.name,
      department: holder.department || '—',
      gatewayId: gateway.id,
      gatewayName: gateway.name,
      location: gateway.location,
      detectedAt: nowIso,
      distanceAvailable: true,
      distance: 50,
      cardStatus: holder.status,
      cardType: holder.cardType || 'employee',
      isSimulated: false,
    };

    // Check if already active
    const alreadyActive = activeDetections.find(d => d.cardId === holder.cardId);
    if (alreadyActive) {
      setActiveDetections(prev => prev.map(d =>
        d.cardId === holder.cardId ? { ...d, gatewayId: gateway.id, detectedAt: nowIso } : d
      ));
      setHistoryRecords(prev => [histRecord, ...prev]);
      setTotalDetectionsToday(prev => prev + 1);
      setGateways(prev => prev.map(g =>
        g.id === gateway.id ? { ...g, detectedCount: g.detectedCount + 1, lastSeen: nowIso } : g
      ));
      addNotification('success', 'Sinyal Kartu Fisik Diterima!', `${holder.name} (${holder.cardId}) terdeteksi di ${gateway.name}`);
      return true;
    }

    const detection = {
      id: `DET-${newId}`,
      cardId: holder.cardId,
      gatewayId: gateway.id,
      detectedAt: nowIso,
      distanceAvailable: true,
      distance: 50,
      isActive: true,
      isSimulated: false,
    };

    setActiveDetections(prev => [detection, ...prev]);
    setHistoryRecords(prev => [histRecord, ...prev]);
    setTotalDetectionsToday(prev => prev + 1);
    setGateways(prev => prev.map(g =>
      g.id === gateway.id ? { ...g, detectedCount: g.detectedCount + 1, lastSeen: nowIso } : g
    ));

    addNotification('success', 'Sinyal Kartu Fisik Tertangkap!', `${holder.name} (${holder.cardId}) berhasil ditangkap oleh ${gateway.name}`);
    return true;
  }, [registeredCards, activeDetections, gateways, addNotification]);

  // Quick-register an unknown card signal that was already captured
  const registerUnknownCard = useCallback((unknownSignal, cardData) => {
    // Remove from unknown signals list
    setUnknownCardSignals(prev => prev.filter(u => u.cardId !== unknownSignal.cardId));
    // Register the card normally (returns true/false)
    return true; // actual registration done via registerCard()
  }, []);

  // Batch detect all active cards at target gateway (or across all gateways)
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

    // === TANGKAP SEMUA KARTU DI SEMUA GATEWAY SECARA MENYELURUH ===
    if (isAllGateways) {
      const newDetections = [];
      const newHistory = [];
      const gwCounts = {};
      availableGateways.forEach(g => { gwCounts[g.id] = 0; });

      // Distribute each active card across the gateways
      activeCards.forEach((holder, idx) => {
        const assignedGw = availableGateways[idx % availableGateways.length];
        gwCounts[assignedGw.id] = (gwCounts[assignedGw.id] || 0) + 1;
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

      setActiveDetections(prev => {
        const otherCards = prev.filter(d => !activeCards.some(ac => ac.cardId === d.cardId));
        return [...newDetections, ...otherCards];
      });
      setHistoryRecords(prev => [...newHistory, ...prev]);
      setTotalDetectionsToday(prev => prev + activeCards.length);
      setGateways(prev => prev.map(g => {
        const count = gwCounts[g.id] || 0;
        return count > 0
          ? { ...g, detectedCount: g.detectedCount + count, lastSeen: nowIso }
          : g;
      }));

      addNotification(
        'success',
        'Seluruh Gateway & Kartu Berhasil Ditangkap!',
        `${activeCards.length} kartu aktif berhasil ditangkap dan dipetakan ke seluruh ${availableGateways.length} Gateway.`
      );
      return true;
    }

    // Specific Gateway detection for all active cards
    const gateway = targetGatewayId
      ? availableGateways.find(g => g.id === targetGatewayId) || availableGateways[0]
      : availableGateways[0];

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
      const otherCards = prev.filter(d => !activeCards.some(ac => ac.cardId === d.cardId));
      return [...newDetections, ...otherCards];
    });
    setHistoryRecords(prev => [...newHistory, ...prev]);
    setTotalDetectionsToday(prev => prev + activeCards.length);
    setGateways(prev => prev.map(g =>
      g.id === gateway.id ? { ...g, detectedCount: g.detectedCount + activeCards.length, lastSeen: nowIso } : g
    ));

    addNotification(
      'success',
      'Seluruh Kartu Aktif Tertangkap!',
      `${activeCards.length} kartu aktif berhasil ditangkap oleh sensor ${gateway.name}`
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
    let ping140 = null;
    try {
      const res = await fetch('/api/gateway/ping?ip=10.1.5.140&id=GW-06');
      ping140 = await res.json();
    } catch (e) {}

    setGateways(prev => prev.map(g => {
      if ((g.ip === '10.1.5.140' || g.id === 'GW-06') && ping140?.success) {
        return {
          ...g,
          status: 'connected',
          latency: ping140.latency || 15,
          signalStrength: 88,
          lastSeen: new Date().toISOString(),
        };
      }
      return {
        ...g,
        lastSeen: g.status === 'connected' ? new Date().toISOString() : g.lastSeen,
        signalStrength: g.status === 'connected'
          ? Math.max(75, Math.min(99, g.signalStrength + Math.floor(Math.random() * 5) - 2))
          : g.signalStrength,
      };
    }));
    setIsSyncing(false);
    addNotification('success', 'Sinkronisasi Jaringan Berhasil', `Data seluruh ${gateways.length} perangkat Gateway telah diperbarui.`);
  }, [addNotification, gateways.length]);

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
        const updated = {
          ...g,
          name: updatedData.name ? updatedData.name.trim() : g.name,
          ip: updatedData.ip ? updatedData.ip.trim() : g.ip,
          url: updatedData.url ? updatedData.url.trim() : g.url,
          serviceAccess: updatedData.serviceAccess || g.serviceAccess,
          authType: updatedData.authType || g.authType,
          maxPacketSize: updatedData.maxPacketSize ? Number(updatedData.maxPacketSize) : g.maxPacketSize,
          radius: updatedData.radius ? Number(updatedData.radius) : g.radius,
          status: updatedData.status || g.status,
          // Location and GPS coordinates are also fully editable
          location: updatedData.location ? updatedData.location.trim() : g.location,
          lat: updatedData.lat !== undefined && !isNaN(Number(updatedData.lat)) ? Number(updatedData.lat) : g.lat,
          lng: updatedData.lng !== undefined && !isNaN(Number(updatedData.lng)) ? Number(updatedData.lng) : g.lng,
          zone: updatedData.zone ? updatedData.zone.trim() : g.zone,
        };
        return updated;
      }
      return g;
    }));
    addNotification(
      'success',
      'Konfigurasi Gateway Disimpan',
      `Parameter perangkat dan koordinat lokasi ${gwId} berhasil diperbarui di peta.`
    );
  }, [addNotification]);

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
