/* ==========================================================================
   TrautsLab OS — Interactive Frontend Application Logic
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const tabs = document.querySelectorAll('.nav-tab');
  const views = document.querySelectorAll('.view-panel');
  const clockEl = document.getElementById('current-clock');
  const dateEl = document.getElementById('current-date');
  const voiceOrbInteractive = document.getElementById('voice-orb-interactive');
  const btnTriggerVoiceHeader = document.getElementById('btn-trigger-voice-header');
  const voiceModal = document.getElementById('voice-modal');
  const btnCloseVoice = document.getElementById('btn-close-voice');
  const voiceTranscriptionText = document.getElementById('voice-transcription-text');
  const tierPill = document.getElementById('tier-pill');
  const tierActionDesc = document.getElementById('tier-action-desc');
  const voiceResponseText = document.getElementById('voice-response-text');
  const voiceResponseCard = document.getElementById('voice-response-card');
  const executionLog = document.getElementById('execution-log');
  const btnToggleTerminal = document.getElementById('btn-toggle-terminal');
  const terminalDrawer = document.getElementById('terminal-drawer');
  const btnCloseTerminal = document.getElementById('btn-close-terminal');
  const btnHighContrast = document.getElementById('btn-high-contrast');
  const skillButtons = document.querySelectorAll('.skill-btn, .btn-small-run');

  // 1. Clock & Date Initialization
  function updateClock() {
    const now = new Date();
    if (clockEl) {
      clockEl.textContent = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    }
    if (dateEl) {
      const options = { weekday: 'short', day: 'numeric', month: 'short' };
      dateEl.textContent = now.toLocaleDateString('es-ES', options);
    }
  }
  updateClock();
  setInterval(updateClock, 1000);

  // 2. Tab Navigation Logic
  function switchTab(viewId) {
    tabs.forEach(tab => {
      const isActive = tab.getAttribute('data-view') === viewId;
      tab.classList.toggle('active', isActive);
      tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });

    views.forEach(view => {
      const isTarget = view.id === `view-${viewId}`;
      view.classList.toggle('active', isTarget);
    });
  }

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const viewId = tab.getAttribute('data-view');
      switchTab(viewId);
    });
  });

  // 3. High Contrast Mode Toggle
  btnHighContrast?.addEventListener('click', () => {
    document.body.classList.toggle('high-contrast');
  });

  // 4. Terminal Drawer Toggle
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

  // 5. Voice Interaction Simulation Pipeline
  const voiceDemoScenarios = [
    {
      query: "¿Qué es lo más importante en mi agenda hoy?",
      tier: "Tier 2: Consulta de Reporte en Caché",
      tierClass: "tier-2",
      action: "Accediendo a OUTPUT/daily-agenda-2026-08-17.md (Latencia: 140ms)",
      response: "Tu compromiso principal hoy es la 'Revisión de Arquitectura TrautsLab OS' a las 11:00 AM, seguido por la grabación del demo a las 3:30 PM."
    },
    {
      query: "¿Cuál es la noticia de IA más importante de hoy?",
      tier: "Tier 2: Consulta de Reporte en Caché",
      tierClass: "tier-2",
      action: "Consultando WIKI/morning-intel-2026-08-17.md",
      response: "Claude implementó marcas de agua invisibles a nivel de modelo que sobreviven a transformaciones, y DeepSeek-V3 superó 110k estrellas en GitHub."
    },
    {
      query: "Ejecuta el escaneo de inteligencia matutino",
      tier: "Tier 1: Ejecución de Skill Directa",
      tierClass: "tier-1",
      action: "Disparando script skills/morning-intel-scan.sh en background",
      response: "Ejecutando el escaneo matutino. Los reportes estarán disponibles en RAW y WIKI en aproximadamente 15 segundos."
    },
    {
      query: "Planifica una investigación profunda sobre arquitecturas de voz local",
      tier: "Tier 3: Agente Headless Desatendido",
      tierClass: "tier-3",
      action: "Iniciando subagente headless CLI (Claude Code / Local Runner)",
      response: "He lanzado el agente headless para investigar arquitecturas de Faster-Whisper y Kokoro. Te avisaré por voz en cuanto el documento esté listo en OUTPUT/."
    }
  ];

  let scenarioIndex = 0;

  function openVoiceModal() {
    if (!voiceModal) return;
    voiceModal.removeAttribute('hidden');
    
    // Pick current scenario
    const currentScenario = voiceDemoScenarios[scenarioIndex];
    scenarioIndex = (scenarioIndex + 1) % voiceDemoScenarios.length;

    // Simulation steps
    const modalOrb = document.getElementById('modal-voice-orb');
    modalOrb?.classList.add('active');
    
    voiceTranscriptionText.textContent = "Escuchando audio...";
    tierPill.textContent = "Analizando con Router...";
    tierActionDesc.textContent = "Faster-Whisper transcribiendo...";
    voiceResponseCard.style.opacity = '0.3';
    voiceResponseText.textContent = "...";

    setTimeout(() => {
      voiceTranscriptionText.textContent = `"${currentScenario.query}"`;
      tierPill.textContent = currentScenario.tier;
      tierActionDesc.textContent = currentScenario.action;
    }, 600);

    setTimeout(() => {
      voiceResponseCard.style.opacity = '1';
      voiceResponseText.textContent = `"${currentScenario.response}"`;
      logActivity(`VOICE (${currentScenario.tier.split(':')[0]}): "${currentScenario.query}" &rarr; Respondido.`);
    }, 1200);
  }

  function closeVoiceModal() {
    if (voiceModal) {
      voiceModal.setAttribute('hidden', '');
    }
  }

  voiceOrbInteractive?.addEventListener('click', openVoiceModal);
  btnTriggerVoiceHeader?.addEventListener('click', openVoiceModal);
  btnCloseVoice?.addEventListener('click', closeVoiceModal);

  // 6. Skill Execution Simulation
  function logActivity(text) {
    if (!executionLog) return;
    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0];
    const line = document.createElement('div');
    line.className = 'log-line running';
    line.innerHTML = `[${timeStr}] ${text}`;
    executionLog.appendChild(line);
    executionLog.scrollTop = executionLog.scrollHeight;
  }

  skillButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const skillName = btn.getAttribute('data-skill') || btn.getAttribute('data-run') || 'skill';
      logActivity(`EJECUTANDO SKILL: <span style="color:#6366f1;">${skillName}</span> (Disparo manual)`);
      
      const originalText = btn.innerHTML;
      btn.style.opacity = '0.7';
      btn.textContent = 'Corriendo...';

      setTimeout(() => {
        btn.innerHTML = originalText;
        btn.style.opacity = '1';
        logActivity(`✓ Skill <strong>${skillName}</strong> finalizada exitosamente.`);
      }, 1500);
    });
  });

  // 7. Global Keyboard Shortcuts
  document.addEventListener('keydown', (e) => {
    // If typing in an input, ignore
    if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;

    // Numbers 1-4 for tabs
    if (e.key === '1') switchTab('overview');
    if (e.key === '2') switchTab('intel');
    if (e.key === '3') switchTab('skills');
    if (e.key === '4') switchTab('memory');

    // 't' or 'T' for terminal
    if (e.key.toLowerCase() === 't') {
      e.preventDefault();
      toggleTerminal();
    }

    // 'v' or 'V' or Spacebar for voice
    if (e.key.toLowerCase() === 'v' || (e.code === 'Space' && voiceModal.hasAttribute('hidden'))) {
      e.preventDefault();
      openVoiceModal();
    }

    // Escape to close modals
    if (e.key === 'Escape') {
      closeVoiceModal();
      if (!terminalDrawer.hasAttribute('hidden')) {
        terminalDrawer.setAttribute('hidden', '');
      }
    }
  });

  console.log("TrautsLab OS Command Center Frontend initialized successfully.");
});
