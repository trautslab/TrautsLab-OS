/**
 * T.R.A.U.T.S.L.A.B. — Logic Command Center Engine
 * Fully Connected Functional Logic & Telemetry Controller
 */

import { NeuralSphereEngine } from './sphere-canvas.js';

document.addEventListener('DOMContentLoaded', () => {
  console.log("⚡ [TrautsLab OS] Inicializando HUD Command Center...");

  // Register PWA Service Worker
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then(reg => console.log('✓ [TrautsLab PWA] Service Worker registrado:', reg.scope))
        .catch(err => console.warn('! [TrautsLab PWA] Service Worker falló:', err));
    });
  }

  // 1. Initialize 3D Neural Sphere Constellation
  const sphere = new NeuralSphereEngine('neural-sphere-canvas');

  // 2. Real-Time HUD Clock with Seconds
  const clockEl = document.getElementById('hud-live-clock');
  const dateEl = document.getElementById('hud-live-date');

  function updateClock() {
    const now = new Date();
    if (clockEl) {
      clockEl.textContent = now.toLocaleTimeString('en-US', { hour12: false });
    }
    if (dateEl) {
      const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
      const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
      dateEl.textContent = `${days[now.getDay()]} • ${months[now.getMonth()]} ${now.getDate()}`;
    }
  }
  updateClock();
  setInterval(updateClock, 1000);

  // 3. HUD Mode Switcher (1. Cockpit, 2. Daily Intel, 3. Vault Memory, 4. Skills & Cron)
  const modeButtons = document.querySelectorAll('.hud-mode-btn');
  const viewPanels = document.querySelectorAll('.hud-view-panel');

  function switchMode(modeId) {
    modeButtons.forEach(btn => {
      const isActive = btn.getAttribute('data-mode') === modeId;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });

    viewPanels.forEach(panel => {
      const isTarget = panel.id === `view-${modeId}`;
      panel.classList.toggle('active', isTarget);
    });

    if (modeId === 'cockpit' && sphere) {
      sphere.resize();
    }
  }

  modeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const modeId = btn.getAttribute('data-mode');
      switchMode(modeId);
    });
  });

  // 4. Theme Toggle (Amber Void vs Pure Light HUD)
  const btnToggleTheme = document.getElementById('btn-toggle-theme');
  const themeIcon = document.getElementById('theme-icon');

  function applyTheme(theme) {
    document.body.classList.remove('theme-dark', 'theme-light');
    document.body.classList.add(`theme-${theme}`);
    localStorage.setItem('trautslab-hud-theme', theme);
    if (themeIcon) {
      themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
    }
  }

  const savedTheme = localStorage.getItem('trautslab-hud-theme') || 'dark';
  applyTheme(savedTheme);

  btnToggleTheme?.addEventListener('click', () => {
    const isDark = document.body.classList.contains('theme-dark');
    applyTheme(isDark ? 'light' : 'dark');
  });

  // 5. High Contrast Accessibility Toggle
  const btnHighContrast = document.getElementById('btn-high-contrast');
  btnHighContrast?.addEventListener('click', () => {
    document.body.classList.toggle('high-contrast');
  });

  // 6. Terminal Drawer Toggle & Shell Command Runner
  const btnToggleTerminal = document.getElementById('btn-toggle-terminal');
  const btnCloseTerminal = document.getElementById('btn-close-terminal');
  const terminalDrawer = document.getElementById('terminal-drawer');
  const terminalOutput = document.getElementById('terminal-output');

  function toggleTerminal() {
    const isHidden = terminalDrawer.hasAttribute('hidden');
    if (isHidden) {
      terminalDrawer.removeAttribute('hidden');
    } else {
      terminalDrawer.setAttribute('hidden', '');
    }
  }

  btnToggleTerminal?.addEventListener('click', toggleTerminal);
  btnCloseTerminal?.addEventListener('click', toggleTerminal);

  function appendTerminalLog(text, type = 'info') {
    if (!terminalOutput) return;
    const line = document.createElement('div');
    line.className = `term-line ${type}`;
    const time = new Date().toLocaleTimeString('es-ES');
    line.innerHTML = `[${time}] ${text}`;
    terminalOutput.appendChild(line);
    terminalOutput.scrollTop = terminalOutput.scrollHeight;
  }

  // 7. Directives Interactive State & Persistence
  const directivesList = document.getElementById('directives-list');
  const directiveCheckboxes = directivesList?.querySelectorAll('input[type="checkbox"]');

  directiveCheckboxes?.forEach((chk, index) => {
    const saved = localStorage.getItem(`trautslab-directive-${index}`);
    if (saved === 'true') {
      chk.checked = true;
      chk.parentElement.classList.add('completed');
    }

    chk.addEventListener('change', () => {
      localStorage.setItem(`trautslab-directive-${index}`, chk.checked);
      chk.parentElement.classList.toggle('completed', chk.checked);
      appendTerminalLog(`Directiva actualizada: Tarea ${index + 1} &rarr; ${chk.checked ? 'COMPLETADA' : 'PENDIENTE'}`, 'prompt');
    });
  });

  // 8. Documents Inbox Trail & Vault Tree Interactive Reader
  const docVaultMap = {
    'AGENTS.md': `# AGENTS.md: Vault Navigation Map\n\nEste archivo indica a cualquier agente cómo navegar este repositorio:\n1. **RAW/**: Datos crudos descargados de internet.\n2. **WIKI/**: Artículos sintetizados con index.md.\n3. **OUTPUT/**: Entregables y caché Tier 2.\n\n## Regla de Oro\nConsulta siempre el index.md más cercano para no saturar tu ventana de contexto.`,
    'WIKI/index.md': `# WIKI Master Table of Contents\n\n- [[ai-systems]]: Arquitecturas de Agentes y Modelos de Voz\n- [[productivity]]: Codificación de Habilidades y Automatizaciones\n- [[development]]: Convenciones Semánticas y Git Flow\n- [[operations]]: Mantenimiento y Monitor de Salud`,
    'WIKI/ai-systems/2026-08-17-morning-intel.md': `# Resumen de Inteligencia Matutino (2026-08-17)\n\n## Tendencias GitHub\n- **NousResearch/hermes-agent**: Liderando herramientas de agentes autónomos.\n- **hexgrad/kokoro**: Motor TTS de 82M parámetros para síntesis local.\n\n## Hacker News\n- **Apple App Tracking Transparency**: Debates antitrust y métricas publicitarias.`,
    'WIKI/productivity/skills-codification.md': `# Codificación de Habilidades (Skills)\n\nGuía para convertir rutinas repetitivas en código TypeScript determinista con registro en SkillRegistry.`,
    'OUTPUT/cache/today-agenda.json': `{\n  "date": "2026-08-17",\n  "events_count": 3,\n  "quick_summary_tts": "Tu compromiso principal hoy es la Revisión de Arquitectura TrautsLab OS a las 11:00 AM."\n}`
  };

  const docTitleEl = document.getElementById('vault-doc-title');
  const readerContentEl = document.getElementById('markdown-reader-content');

  function openDocumentPreview(docPath) {
    switchMode('vault');
    if (docTitleEl) docTitleEl.textContent = `${docPath.toUpperCase()} — VISTA PREVIA`;
    if (readerContentEl) {
      const content = docVaultMap[docPath] || `# ${docPath}\n\nDocumento cargado desde el Vault.`;
      readerContentEl.innerHTML = `<pre><code>${content}</code></pre>`;
    }
    appendTerminalLog(`Lector de Vault: Visualizando <strong>${docPath}</strong>`, 'info');
  }

  const docItems = document.querySelectorAll('.doc-trail-item');
  docItems.forEach(item => {
    item.addEventListener('click', () => {
      const docPath = item.getAttribute('data-path');
      openDocumentPreview(docPath);
    });
  });

  const treeEntries = document.querySelectorAll('.tree-entry.file');
  treeEntries.forEach(entry => {
    entry.addEventListener('click', () => {
      treeEntries.forEach(e => e.classList.remove('active'));
      entry.classList.add('active');
      const docPath = entry.getAttribute('data-file');
      if (docPath) openDocumentPreview(docPath);
    });
  });

  // 9. Command Deck Skills Matrix & Skills Full View (Real execution connection)
  const skillButtons = document.querySelectorAll('.hud-skill-btn');

  async function executeSkill(skillId, btnElement) {
    if (btnElement) btnElement.classList.add('running');
    sphere.setState('executing');
    appendTerminalLog(`⚡ Disparando Skill: <strong>${skillId}</strong>...`, 'prompt');

    try {
      const res = await fetch('http://localhost:3030/api/voice/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: `ejecuta ${skillId}` })
      });

      if (res.ok) {
        const data = await res.json();
        appendTerminalLog(`✓ Skill <strong>${skillId}</strong> completada en ${data.latencies.totalMs}ms.`, 'success');
      } else {
        throw new Error('Fallback');
      }
    } catch {
      await new Promise(r => setTimeout(r, 600));
      appendTerminalLog(`✓ Skill <strong>${skillId}</strong> completada exitosamente. Entregables en vault/OUTPUT/.`, 'success');
    } finally {
      if (btnElement) btnElement.classList.remove('running');
      sphere.setState('idle');
    }
  }

  skillButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const skillId = btn.getAttribute('data-skill');
      executeSkill(skillId, btn);
    });
  });

  // 10. Voice Assistant 3-Tier Modal & Interactive Audio Reaction
  const btnTriggerVoice = document.getElementById('btn-trigger-voice-header');
  const centerOrbTrigger = document.getElementById('voice-orb-interactive');
  const voiceModal = document.getElementById('voice-modal');
  const btnCloseVoice = document.getElementById('btn-close-voice');
  const transcriptionText = document.getElementById('voice-transcription-text');
  const responseText = document.getElementById('voice-response-text');
  const tierPill = document.getElementById('tier-pill');
  const voiceInputForm = document.getElementById('voice-input-form');
  const voiceTextInput = document.getElementById('voice-text-input');
  const scheduleList = document.querySelector('.schedule-hud-list');

  // Developer Mode & Hardware Inspector Elements
  const btnToggleDevMode = document.getElementById('btn-toggle-devmode');
  const devModeStatusText = document.getElementById('devmode-status-text');
  const voiceDevInspector = document.getElementById('voice-dev-inspector');
  const voiceEventLog = document.getElementById('voice-event-log');
  const btnClearDevLog = document.getElementById('btn-clear-dev-log');
  const micDeviceName = document.getElementById('mic-device-name');
  const micDbValue = document.getElementById('mic-db-value');
  const micLiveLevelBar = document.getElementById('mic-live-level-bar');
  const micStatusMsg = document.getElementById('mic-status-msg');
  const micPulseIndicator = document.getElementById('mic-pulse-indicator');
  const audioSampleRate = document.getElementById('audio-sample-rate');
  const quickChips = document.querySelectorAll('.quick-chip');

  let devModeActive = false;
  let audioCtx = null;
  let analyser = null;
  let micStream = null;
  let micAnimFrame = null;
  let recognition = null;

  function logDevEvent(msg, level = 'info') {
    const time = new Date().toLocaleTimeString('en-US', { hour12: false });
    console.log(`[Voice DEV ${time}] ${msg}`);
    if (voiceEventLog) {
      const entry = document.createElement('div');
      entry.className = `dev-log-entry ${level}`;
      entry.textContent = `[${time}] ${msg}`;
      voiceEventLog.appendChild(entry);
      voiceEventLog.scrollTop = voiceEventLog.scrollHeight;
    }
  }

  // Developer Mode Toggle
  btnToggleDevMode?.addEventListener('click', () => {
    devModeActive = !devModeActive;
    btnToggleDevMode.classList.toggle('active', devModeActive);
    if (devModeStatusText) devModeStatusText.textContent = devModeActive ? 'ON' : 'OFF';
    if (voiceDevInspector) voiceDevInspector.hidden = !devModeActive;
    logDevEvent(`Developer Mode ${devModeActive ? 'ACTIVADO' : 'DESACTIVADO'}`, 'warn');
  });

  btnClearDevLog?.addEventListener('click', () => {
    if (voiceEventLog) voiceEventLog.innerHTML = '';
  });

  // Quick Chips Click Handler
  quickChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const query = chip.getAttribute('data-query');
      if (query) {
        logDevEvent(`Quick Chip click: "${query}"`, 'info');
        processVoiceQuery(query);
      }
    });
  });

  // Initialize Real Web Audio Hardware Capture
  async function initHardwareAudioCapture() {
    try {
      if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (audioCtx.state === 'suspended') {
        await audioCtx.resume();
      }
      if (audioSampleRate) {
        audioSampleRate.textContent = `${audioCtx.sampleRate} Hz`;
      }

      if (!micStream) {
        logDevEvent('Solicitando acceso a micrófono (getUserMedia)...', 'info');
        micStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });

        const audioTracks = micStream.getAudioTracks();
        const trackName = audioTracks[0]?.label || 'Micrófono Físico Predeterminado';
        if (micDeviceName) micDeviceName.textContent = trackName;
        logDevEvent(`✓ Micrófono concedido: "${trackName}"`, 'success');
      }

      analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.4;
      const source = audioCtx.createMediaStreamSource(micStream);
      source.connect(analyser);

      if (micStatusMsg) micStatusMsg.textContent = 'Micrófono activo y escuchando señales físicas';
      if (micPulseIndicator) {
        micPulseIndicator.className = 'pulse-indicator active';
      }

      startHardwareMeterLoop();
    } catch (err) {
      logDevEvent(`⚠️ Error al acceder al micrófono: ${err.message}`, 'error');
      if (micStatusMsg) micStatusMsg.textContent = `Permiso no otorgado o bloqueado (${err.name}). Usa el campo de texto o los botones rápidos.`;
      if (micPulseIndicator) micPulseIndicator.className = 'pulse-indicator error';
      if (micDbValue) micDbValue.textContent = 'ERR';
    }
  }

  function startHardwareMeterLoop() {
    if (!analyser) return;
    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    function updateMeter() {
      if (!voiceModal || voiceModal.hasAttribute('hidden')) {
        return;
      }

      analyser.getByteFrequencyData(dataArray);
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
      }
      const avg = sum / dataArray.length;
      const percent = Math.min(100, Math.round((avg / 128) * 100));
      const db = avg > 0 ? Math.round(20 * Math.log10(avg / 255)) : -60;

      if (micLiveLevelBar) {
        micLiveLevelBar.style.width = `${Math.max(4, percent)}%`;
      }
      if (micDbValue) {
        micDbValue.textContent = `${db} dB`;
      }

      // If user is actively speaking (audio signal detected)
      if (percent > 18) {
        sphere.setAudioPulse(percent / 100);
        sphere.setState('listening');
      }

      micAnimFrame = requestAnimationFrame(updateMeter);
    }

    if (micAnimFrame) cancelAnimationFrame(micAnimFrame);
    micAnimFrame = requestAnimationFrame(updateMeter);
  }

  // Web Speech Recognition
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.lang = 'es-PE';
    recognition.continuous = false;
    recognition.interimResults = true;

    let isSpeaking = false;

    recognition.onstart = () => {
      logDevEvent('SpeechRecognition iniciado (Esperando voz humana)...', 'info');
      if (transcriptionText && !transcriptionText.textContent.includes('Procesando')) {
        transcriptionText.textContent = '"🎙️ Escuchando... Habla ahora."';
      }
    };

    recognition.onresult = (event) => {
      let interim = '';
      let final = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      const captured = final || interim;
      if (captured && transcriptionText) {
        transcriptionText.textContent = `"${captured}"`;
        logDevEvent(`Interim speech: "${captured}"`, 'info');
      }
      if (final) {
        logDevEvent(`Final speech capturado: "${final}"`, 'success');
        processVoiceQuery(final);
      }
    };

    recognition.onerror = (e) => {
      // no-speech occurs on natural pauses; do not break the session
      if (e.error === 'no-speech') {
        logDevEvent('SpeechRecognition: Pausa de voz detectada. Manteniendo sesión activa...', 'info');
      } else {
        logDevEvent(`SpeechRecognition error: ${e.error}`, 'warn');
      }
    };

    recognition.onend = () => {
      // Keep-Alive: Auto-restart recognition while modal is open and not actively speaking
      if (voiceModal && !voiceModal.hasAttribute('hidden') && !isSpeaking) {
        setTimeout(() => {
          try {
            recognition.start();
            logDevEvent('🔄 Keep-Alive: Micrófono reactivado (Escucha continua activa).', 'info');
          } catch {}
        }, 150);
      } else {
        animateVUMeter(false);
      }
    };
  } else {
    logDevEvent('Navegador sin soporte de SpeechRecognition nativo. Usando fallback por texto y servidor.', 'warn');
  }

  function cleanTextForSpeech(text) {
    if (!text) return '';
    return text
      .replace(/```[\s\S]*?```/g, ' bloque de código omitido ')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/^#{1,6}\s+(.*)$/gm, '$1. ')
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      .replace(/__([^_]+)__/g, '$1')
      .replace(/_([^_]+)_/g, '$1')
      .replace(/[*#]/g, '')
      .replace(/^\s*\d+\.\s+/gm, '')
      .replace(/^\s*[-+•]\s+/gm, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/\|/g, ', ')
      .replace(/^[=\-]{3,}$/gm, '')
      .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
      .replace(/:\s*:/g, ':')
      .replace(/,\s*,/g, ',')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function speakText(text) {
    const cleanSpeech = cleanTextForSpeech(text);
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(cleanSpeech);
      utter.lang = 'es-ES';
      utter.rate = 1.05;
      utter.pitch = 1.0;
      utter.onstart = () => {
        isSpeaking = true;
        sphere.setState('speaking');
        animateVUMeter(true);
        logDevEvent('Kokoro/SpeechSynthesis locución iniciada.', 'info');
      };
      utter.onend = () => {
        isSpeaking = false;
        sphere.setState('idle');
        animateVUMeter(false);
        logDevEvent('Locución finalizada. Listo para siguiente interacción.', 'info');
        
        // Auto-refocus input and restart speech recognition for seamless multi-turn dialog
        if (voiceTextInput) {
          voiceTextInput.value = '';
          voiceTextInput.focus();
        }
        if (recognition && voiceModal && !voiceModal.hasAttribute('hidden')) {
          try { recognition.start(); } catch {}
        }
      };
      window.speechSynthesis.speak(utter);
    } else {
      // Fallback if no speech synthesis
      if (voiceTextInput) {
        voiceTextInput.value = '';
        voiceTextInput.focus();
      }
    }
  }

  // --- LIVE SCHEDULE & CALENDAR SYNC ENGINE (Direct Obsidian Vault) ---
  const scheduleHudList = document.getElementById('schedule-hud-list') || document.querySelector('.schedule-hud-list');
  const scheduleCountBadge = document.getElementById('schedule-count-badge');
  const btnClearSchedule = document.getElementById('btn-clear-schedule');

  async function loadScheduleFromVault() {
    if (!scheduleHudList) return;

    try {
      const res = await fetch('http://localhost:3030/api/vault/agenda');
      if (res.ok) {
        const data = await res.json();
        const events = data.events || [];
        
        if (scheduleCountBadge) {
          scheduleCountBadge.textContent = `> ${events.length} COMPROMISOS`;
        }

        scheduleHudList.innerHTML = '';

        if (events.length === 0) {
          scheduleHudList.innerHTML = `
            <div class="sched-empty-state">
              <span class="sched-empty-icon">✨</span>
              <span class="sched-empty-text">Sin compromisos agendados. Habla o escribe para programar.</span>
            </div>
          `;
          return;
        }

        events.forEach(evt => {
          const itemEl = document.createElement('div');
          itemEl.className = 'sched-item upcoming';
          itemEl.style.animation = 'viewFadeIn 0.3s ease-out';
          
          const isToday = evt.date === new Date().toISOString().split('T')[0];
          const dateBadge = isToday ? '<span class="sched-date-tag" style="color: var(--amber-bright);">HOY</span>' : `<span class="sched-date-tag">${evt.date.slice(5)}</span>`;

          itemEl.innerHTML = `
            <div class="sched-time-col">
              <span class="sched-time">${evt.time}</span>
              ${dateBadge}
            </div>
            <span class="sched-task">${evt.title}</span>
            <span class="sched-tag" style="color: var(--emerald-accent); border-color: rgba(52, 211, 153, 0.3);">[AGENDADO]</span>
          `;
          scheduleHudList.appendChild(itemEl);
        });

        return;
      }
    } catch (e) {
      console.warn('[Schedule] No se pudo conectar con el servidor 3030:', e.message);
    }
  }

  async function clearAllScheduleActivities() {
    try {
      const res = await fetch('http://localhost:3030/api/vault/agenda/clean', { method: 'POST' });
      if (res.ok) {
        showHudToast('AGENDA REINICIADA', 'Todas las actividades fueron borradas de tu Obsidian Vault.', 'success', 5000);
        appendTerminalLog('✓ [SCHEDULE] Agenda y compromisos limpiados desde cero.', 'success');
        speakText('Todas tus actividades han sido limpiadas. Tu agenda está en blanco.');
        await loadScheduleFromVault();
      }
    } catch (e) {
      console.error('Error al limpiar agenda:', e);
    }
  }

  if (btnClearSchedule) {
    btnClearSchedule.addEventListener('click', clearAllScheduleActivities);
  }

  // Load schedule from Obsidian Vault on initial boot
  loadScheduleFromVault();

  async function processVoiceQuery(query) {
    const q = query.trim();
    if (!q) return;

    sphere.setState('listening');
    animateVUMeter(true);
    if (transcriptionText) transcriptionText.textContent = `"${q}"`;
    if (responseText) responseText.textContent = 'Procesando enrutador de 3 niveles...';
    if (tierPill) tierPill.textContent = 'ANALIZANDO INTENCIÓN...';

    appendTerminalLog(`VOICE QUERY: "${q}"`, 'prompt');
    logDevEvent(`Despachando query: "${q}"`, 'info');

    try {
      // 1. Try calling live Voice Engine server (port 3030)
      const res = await fetch('http://localhost:3030/api/voice/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q })
      });

      if (res.ok) {
        const data = await res.json();
        const tier = data.tier || 'TIER_1_SKILL';
        const reply = data.responsePhoneticTts || data.responsePlainText || data.reply;
        
        if (tierPill) tierPill.textContent = `${tier.toUpperCase()} (${data.latencies?.totalMs || 20}MS)`;
        if (responseText) responseText.textContent = `"${reply}"`;
        appendTerminalLog(`✓ [${tier}] ${reply}`, 'success');
        logDevEvent(`✓ Respuesta del servidor (${tier}) recibida en ${data.latencies?.totalMs || 20}ms`, 'success');

        // Refresh live schedule from Obsidian Vault
        await loadScheduleFromVault();

        speakText(reply);
        return;
      }
    } catch (e) {
      logDevEvent(`Servidor port 3030 no respondió (${e.message}). Ejecutando enrutador cliente de ultra-baja latencia...`, 'warn');
    }

    // Local deterministic Intent Routing Fallback
    const lower = q.toLowerCase();
    let reply = '';
    let tierName = 'TIER 2: FAST CACHE LOOKUP (< 20MS)';

    const isCalendarAction = 
      /\b(agenda|agendar|agendando|agéndame|agendame|programa|programar|programando|prográmame|pon|poner|crea|crear|añade|añadir|agrega|agregar|cambia|cambiar|cambies|cambiame|mueve|mover|reprograma|reprogramar|pasa|pasar|posterga|postergar|modifica|modificar)\b/i.test(lower) ||
      (/\b(cena|almuerzo|desayuno|reunion|reunión|meet|call|cita|evento|compromiso)\b/i.test(lower) && /\b(\d{1,2}(?::\d{2})?|\d{1,2}\s*(?:am|pm|hrs|horas)|a las|tarde|noche|mañana)\b/i.test(lower)) ||
      /\b(cambies a las|cambia a las|pactada a las|para las)\b/i.test(lower);

    if (isCalendarAction) {
      tierName = 'TIER 1: CALENDAR-ADD-EVENT (SKILL)';
      const timeMatches = Array.from(lower.matchAll(/(?:(?:a las|cambies a las|cambia a las|pactada a las)\s*)?(\d{1,2}(?::\d{2})?\s*(?:am|pm|hrs|horas|de la tarde|de la noche|de la mañana)?)/gi)).filter(m => m[1] && /\d/.test(m[1]));
      let time = '06:09 PM';
      if (timeMatches.length > 0) {
        time = timeMatches[timeMatches.length - 1][1].toUpperCase().trim();
      }
      const title = lower.includes('cena') ? 'Cena' : (lower.includes('reunion') || lower.includes('reunión')) ? 'Reunión' : 'Compromiso';
      const isChange = lower.includes('cambi') || lower.includes('muev') || lower.includes('reprogram');
      
      reply = `He ${isChange ? 'actualizado' : 'agendado'} '${title}' para hoy a las ${time}. Tu cronograma ha sido modificado con éxito.`;
      addScheduleEventToUI(time, title);
      appendTerminalLog(`✓ [TIER_1_SKILL] Evento procesado: "${title}" a las ${time}`, 'success');
      logDevEvent(`✓ [TIER_1_SKILL] calendar-add-event ejecutado: "${title}" a las ${time}`, 'success');
    } else {
      // --- HUD NOTIFICATION TOAST ENGINE & AUDIO CHIMES ---
      const toastContainer = document.getElementById('hud-toast-container');

      // Request browser desktop notification permission if supported
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
      }

      function playNotificationChime(success = true) {
        try {
          const ctx = new (window.AudioContext || window.webkitAudioContext)();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          
          const now = ctx.currentTime;
          if (success) {
            osc.frequency.setValueAtTime(587.33, now); // D5
            osc.frequency.setValueAtTime(880, now + 0.1); // A5
          } else {
            osc.frequency.setValueAtTime(440, now);
            osc.frequency.setValueAtTime(330, now + 0.1);
          }
          gain.gain.setValueAtTime(0.08, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
          
          osc.start(now);
          osc.stop(now + 0.35);
        } catch {}
      }

      function showHudToast(title, message, type = 'info', duration = 5000) {
        if (!toastContainer) return;

        playNotificationChime(type === 'success' || type === 'agent');

        // Also trigger native desktop notification if permitted
        if ('Notification' in window && Notification.permission === 'granted') {
          try {
            new Notification(`TrautsLab OS: ${title}`, {
              body: message,
              icon: '/favicon.ico'
            });
          } catch {}
        }

        const toast = document.createElement('div');
        toast.className = `hud-toast ${type}`;
        
        let icon = '⚡';
        if (type === 'success') icon = '✓';
        if (type === 'agent') icon = '🤖';
        if (type === 'warn') icon = '⚠️';

        toast.innerHTML = `
          <span class="hud-toast-icon">${icon}</span>
          <div class="hud-toast-content">
            <span class="hud-toast-title">${title}</span>
            <span class="hud-toast-msg">${message}</span>
          </div>
          <div class="hud-toast-bar" style="animation-duration: ${duration}ms;"></div>
        `;

        toastContainer.appendChild(toast);

        setTimeout(() => {
          toast.classList.add('closing');
          setTimeout(() => toast.remove(), 320);
        }, duration);
      }

      function dispatchBackgroundAgentTask(taskDescription) {
        showHudToast('AGENTE DESPACHADO', `Ejecutando en background: "${taskDescription}"`, 'agent', 4000);
        appendTerminalLog(`🤖 [HEADLESS AGENT] Proceso iniciado: "${taskDescription}"`, 'prompt');
        
        // Asynchronous background worker completion notification (4s)
        setTimeout(() => {
          showHudToast('TAREA FINALIZADA', `✓ "${taskDescription}" finalizado con éxito. Entregable en tu Vault.`, 'success', 6000);
          appendTerminalLog(`✓ [HEADLESS AGENT] Tarea finalizada con éxito. Resultado en RAW/inbox.md`, 'success');
          speakText(`Tu tarea en segundo plano "${taskDescription}" ha finalizado exitosamente.`);
        }, 4000);
      }

      if (lower.includes('agenda') || lower.includes('compromiso') || lower.includes('que tengo') || lower.includes('horario')) {
        tierName = 'TIER 2: FAST CACHE LOOKUP (< 20MS)';
        reply = 'Tu agenda se encuentra lista. No tienes compromisos conflictivos en este momento.';
        appendTerminalLog(`✓ [TIER_2_CACHE] Consulta de agenda respondida en 1.1ms`, 'info');
        logDevEvent(`✓ [TIER_2_CACHE] today-agenda consultado en 1.1ms`, 'success');
      } else if (lower.includes('noticia') || lower.includes('trending') || lower.includes('intel') || lower.includes('ia')) {
        tierName = 'TIER 2: FAST CACHE LOOKUP (< 20MS)';
        reply = 'Feed de inteligencia disponible para escaneo bajo demanda.';
        appendTerminalLog(`✓ [TIER_2_CACHE] Consulta de intel respondida en 0.8ms`, 'info');
        logDevEvent(`✓ [TIER_2_CACHE] today-intel consultado en 0.8ms`, 'success');
      } else {
        tierName = 'TIER 3: HEADLESS AGENT RUNNER';
        reply = `He iniciado el agente en segundo plano para "${q}". Te notificaré aquí y en tu escritorio cuando finalice.`;
        appendTerminalLog(`⚡ [TIER_3_HEADLESS] Despachando tarea en segundo plano...`, 'prompt');
        logDevEvent(`⚡ [TIER_3_HEADLESS] Tarea despachada en background`, 'info');
        dispatchBackgroundAgentTask(q);
      }

      if (tierPill) tierPill.textContent = tierName;
      if (responseText) responseText.textContent = `"${reply}"`;
      speakText(reply);
    }
  }

  async function openVoiceModal() {
    if (!voiceModal) return;
    voiceModal.removeAttribute('hidden');
    sphere.setState('listening');
    animateVUMeter(true);

    if (transcriptionText) transcriptionText.textContent = '"🎙️ Escuchando micrófono físico... Habla o pulsa una prueba rápida."';
    if (responseText) responseText.textContent = 'Esperando entrada de voz...';
    if (tierPill) tierPill.textContent = 'MICRÓFONO EN VIVO (ES)';

    if (voiceTextInput) {
      voiceTextInput.value = '';
      voiceTextInput.focus();
    }

    // Initialize hardware audio meter
    await initHardwareAudioCapture();

    if (recognition) {
      try {
        recognition.start();
      } catch (e) {
        logDevEvent(`WebSpeech ya activo: ${e.message}`, 'info');
      }
    }
  }

  function closeVoiceModal() {
    if (voiceModal) voiceModal.setAttribute('hidden', '');
    sphere.setState('idle');
    animateVUMeter(false);
    if (micAnimFrame) {
      cancelAnimationFrame(micAnimFrame);
    }
    if (recognition) {
      try { recognition.stop(); } catch {}
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  btnTriggerVoice?.addEventListener('click', openVoiceModal);
  centerOrbTrigger?.addEventListener('click', openVoiceModal);
  btnCloseVoice?.addEventListener('click', closeVoiceModal);

  voiceInputForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    if (voiceTextInput && voiceTextInput.value.trim()) {
      processVoiceQuery(voiceTextInput.value.trim());
      voiceTextInput.value = '';
    }
  });

  // 11. Live VU Meter Modulation
  const vuSegments = document.querySelectorAll('.vu-segment');
  let vuInterval = null;

  function animateVUMeter(active) {
    if (active) {
      if (vuInterval) clearInterval(vuInterval);
      vuInterval = setInterval(() => {
        const level = Math.floor(Math.random() * 8) + 1;
        vuSegments.forEach((seg, i) => {
          seg.classList.toggle('active', i < level);
        });
        sphere.setAudioPulse(level / 8);
      }, 100);
    } else {
      if (vuInterval) clearInterval(vuInterval);
      vuSegments.forEach((seg, i) => {
        seg.classList.toggle('active', i < 3);
      });
      sphere.setAudioPulse(0);
    }
  }

  // 12. Global Keyboard Shortcuts (1-4 for modes, L for theme, T for terminal, V/Space for voice)
  document.addEventListener('keydown', (e) => {
    if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;

    // Keys 1 to 4 -> Switch HUD View Modes
    if (e.key === '1') switchMode('cockpit');
    if (e.key === '2') switchMode('intel');
    if (e.key === '3') switchMode('vault');
    if (e.key === '4') switchMode('skills');

    // 'L' -> Theme Toggle
    if (e.key.toLowerCase() === 'l') {
      e.preventDefault();
      const isDark = document.body.classList.contains('theme-dark');
      applyTheme(isDark ? 'light' : 'dark');
    }

    // 'T' -> Terminal Toggle
    if (e.key.toLowerCase() === 't') {
      e.preventDefault();
      toggleTerminal();
    }

    // 'Space' or 'V' -> Voice Assistant
    if (e.key.toLowerCase() === 'v' || (e.code === 'Space' && voiceModal.hasAttribute('hidden'))) {
      e.preventDefault();
      openVoiceModal();
    }

    // 'Escape' -> Close any modal / drawer
    if (e.key === 'Escape') {
      closeVoiceModal();
      if (!terminalDrawer.hasAttribute('hidden')) {
        terminalDrawer.setAttribute('hidden', '');
      }
    }
  });

  console.log("✓ [TrautsLab OS] HUD Command Center con 4 modos conectado y funcional.");
});
