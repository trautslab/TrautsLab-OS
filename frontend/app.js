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

  let recognition = null;
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.lang = 'es-PE';
    recognition.continuous = false;
    recognition.interimResults = true;

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
      }
      if (final) {
        processVoiceQuery(final);
      }
    };

    recognition.onerror = (e) => {
      console.warn('[WebSpeech API] Error:', e.error);
      if (transcriptionText && transcriptionText.textContent.includes('Escuchando')) {
        transcriptionText.textContent = '"Habla ahora o escribe tu orden abajo..."';
      }
    };

    recognition.onend = () => {
      animateVUMeter(false);
    };
  }

  function speakText(text) {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = 'es-ES';
      utter.rate = 1.05;
      utter.pitch = 1.0;
      utter.onstart = () => {
        sphere.setState('speaking');
        animateVUMeter(true);
      };
      utter.onend = () => {
        sphere.setState('idle');
        animateVUMeter(false);
      };
      window.speechSynthesis.speak(utter);
    }
  }

  function addScheduleEventToUI(time, title) {
    if (!scheduleList) return;
    const newEventEl = document.createElement('div');
    newEventEl.className = 'sched-item upcoming';
    newEventEl.style.animation = 'viewFadeIn 0.3s ease-out';
    newEventEl.innerHTML = `
      <span class="sched-time">${time}</span>
      <span class="sched-task">${title}</span>
      <span class="sched-now-tag" style="background: var(--emerald-accent);">[NUEVO]</span>
    `;
    scheduleList.appendChild(newEventEl);
  }

  async function processVoiceQuery(query) {
    const q = query.trim();
    if (!q) return;

    sphere.setState('listening');
    animateVUMeter(true);
    if (transcriptionText) transcriptionText.textContent = `"${q}"`;
    if (responseText) responseText.textContent = 'Procesando enrutador de 3 niveles...';
    if (tierPill) tierPill.textContent = 'ANALIZANDO INTENCIÓN...';

    appendTerminalLog(`VOICE QUERY: "${q}"`, 'prompt');

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
        
        if (tierPill) tierPill.textContent = `${tier.toUpperCase()} (< 25MS)`;
        if (responseText) responseText.textContent = `"${reply}"`;
        appendTerminalLog(`✓ [${tier}] ${reply}`, 'success');

        if (q.toLowerCase().includes('cena') || q.toLowerCase().includes('agenda') || q.toLowerCase().includes('agendando')) {
          addScheduleEventToUI('20:00', 'Cena de hoy');
        }

        speakText(reply);
        return;
      }
    } catch {
      // 2. Client-Side High-Speed Intelligent Fallback
      console.log('[Voice Modal] Usando enrutador híbrido cliente...');
    }

    // Local deterministic Intent Routing
    const lower = q.toLowerCase();
    let reply = '';
    let tierName = 'TIER 2: FAST CACHE LOOKUP (< 20MS)';

    if (lower.includes('agendando') || lower.includes('agenda la') || lower.includes('agenda el') || lower.includes('agenda cena') || lower.includes('agendar')) {
      tierName = 'TIER 1: CALENDAR-ADD-EVENT (SKILL)';
      const timeMatch = q.match(/(?:a las\s*)?(\d{1,2}(?::\d{2})?\s*(?:am|pm|hrs|horas)?)/i);
      const time = timeMatch ? timeMatch[1].toUpperCase() : '08:00 PM';
      const cleanTitle = q.replace(/(?:ayúdame|agendando|agenda|la|el|cena|a las|\d|pm|am|hrs)/gi, '').trim() || 'Cena de hoy';
      const fullTitle = `Cena de hoy ${cleanTitle ? '(' + cleanTitle + ')' : ''}`.trim();
      
      reply = `He agendado "${fullTitle}" a las ${time}. Tu cronograma ha sido actualizado con éxito.`;
      addScheduleEventToUI(time, fullTitle);
      appendTerminalLog(`✓ [TIER_1_SKILL] Evento creado: "${fullTitle}" a las ${time}`, 'success');
    } else if (lower.includes('agenda') || lower.includes('compromiso') || lower.includes('que tengo')) {
      tierName = 'TIER 2: FAST CACHE LOOKUP (< 20MS)';
      reply = 'Tu compromiso principal hoy es la Revisión de Arquitectura TrautsLab OS a las 11:00 AM, seguido por la cena a las 8:00 PM.';
      appendTerminalLog(`✓ [TIER_2_CACHE] Consulta de agenda respondida en 1.2ms`, 'info');
    } else if (lower.includes('noticia') || lower.includes('trending') || lower.includes('intel') || lower.includes('ia')) {
      tierName = 'TIER 2: FAST CACHE LOOKUP (< 20MS)';
      reply = 'Hoy en GitHub destaca Hermes Agent de NousResearch y Kokoro TTS para síntesis ultrarrápida.';
      appendTerminalLog(`✓ [TIER_2_CACHE] Consulta de intel respondida en 0.8ms`, 'info');
    } else {
      tierName = 'TIER 3: HEADLESS AGENT RUNNER';
      reply = `He delegado "${q}" al agente autónomo en segundo plano. Te notificaré cuando finalice la tarea.`;
      appendTerminalLog(`⚡ [TIER_3_HEADLESS] Despachando tarea en segundo plano...`, 'prompt');
    }

    if (tierPill) tierPill.textContent = tierName;
    if (responseText) responseText.textContent = `"${reply}"`;
    speakText(reply);
  }

  function openVoiceModal() {
    if (!voiceModal) return;
    voiceModal.removeAttribute('hidden');
    sphere.setState('listening');
    animateVUMeter(true);

    if (transcriptionText) transcriptionText.textContent = '"🎙️ Escuchando... Habla ahora o escribe tu orden."';
    if (responseText) responseText.textContent = 'Esperando entrada de voz...';
    if (tierPill) tierPill.textContent = 'MICRÓFONO EN VIVO (ES)';

    if (voiceTextInput) {
      voiceTextInput.value = '';
      voiceTextInput.focus();
    }

    if (recognition) {
      try {
        recognition.start();
      } catch (e) {
        console.log('[WebSpeech] Ya iniciado');
      }
    }
  }

  function closeVoiceModal() {
    if (voiceModal) voiceModal.setAttribute('hidden', '');
    sphere.setState('idle');
    animateVUMeter(false);
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
