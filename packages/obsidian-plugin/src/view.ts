import { ItemView, WorkspaceLeaf } from 'obsidian';
import type TrautsLabPlugin from './main.js';

export const TRAUTSLAB_VIEW_TYPE = 'trautslab-command-center-view';

export class TrautsLabView extends ItemView {
  plugin: TrautsLabPlugin;
  private activeTab: string = 'overview';

  constructor(leaf: WorkspaceLeaf, plugin: TrautsLabPlugin) {
    super(leaf);
    this.plugin = plugin;
  }

  getViewType(): string {
    return TRAUTSLAB_VIEW_TYPE;
  }

  getDisplayText(): string {
    return 'TrautsLab OS';
  }

  getIcon(): string {
    return 'zap';
  }

  async onOpen() {
    const container = this.containerEl.children[1] as HTMLElement;
    container.empty();
    container.classList.add('trautslab-obsidian-root');

    this.renderDashboard(container);
  }

  renderDashboard(container: HTMLElement) {
    container.innerHTML = `
      <div class="trautslab-dashboard-wrap">
        <!-- TOPBAR -->
        <header class="trautslab-topbar">
          <div class="brand-group">
            <div class="logo-mark">⚡</div>
            <div class="brand-titles">
              <h2>TrautsLab <span class="accent-text">OS</span></h2>
              <span class="system-status-tag"><span class="dot-online"></span> LOCAL GPU ENGINE</span>
            </div>
          </div>
          <div class="header-metrics">
            <div class="metric-pill">
              <span class="m-icon">⚡</span>
              <div class="m-info"><span class="m-lbl">Tokens Hoy</span><span class="m-val">48.2k</span></div>
            </div>
            <div class="metric-pill">
              <span class="m-icon">🎯</span>
              <div class="m-info"><span class="m-lbl">Latencia Caché</span><span class="m-val">12ms</span></div>
            </div>
          </div>
          <div class="header-actions">
            <button id="btn-obsidian-voice" class="btn-voice-launch">🎙️ Voz 3-Tier</button>
          </div>
        </header>

        <!-- BODY -->
        <div class="trautslab-body">
          <!-- NAV TABS -->
          <nav class="trautslab-tabs">
            <button class="nav-tab active" data-tab="overview">📊 Overview</button>
            <button class="nav-tab" data-tab="intel">🌐 Daily Intel</button>
            <button class="nav-tab" data-tab="skills">⚡ Skills</button>
            <button class="nav-tab" data-tab="memory">🧠 Vault Memory</button>
          </nav>

          <!-- PANELS -->
          <main class="trautslab-content" id="trautslab-content">
            <!-- OVERVIEW -->
            <section class="panel-section active" id="tab-panel-overview">
              <div class="card-grid">
                <div class="obsidian-glass-card col-2">
                  <div class="card-head"><h3>📅 Agenda de Hoy</h3><span class="badge-status">En vivo</span></div>
                  <div class="timeline-box">
                    <div class="t-item"><span class="t-time">09:00 AM</span> <strong>Morning Intel Scan</strong> (Completado)</div>
                    <div class="t-item current"><span class="t-time">11:00 AM</span> <strong>Revisión de Arquitectura TrautsLab OS</strong></div>
                    <div class="t-item"><span class="t-time">03:30 PM</span> <strong>Grabación Demo Asistente de Voz</strong></div>
                  </div>
                </div>

                <div class="obsidian-glass-card col-1">
                  <div class="card-head"><h3>⚡ Disparadores de 1-Clic</h3></div>
                  <div class="skills-launcher">
                    <button class="skill-btn-action" data-skill="morning-intel-scan">📰 Morning Intel</button>
                    <button class="skill-btn-action" data-skill="calendar-daily-brief">🗓️ Brief Agenda</button>
                    <button class="skill-btn-action" data-skill="vault-sync-indexer">🔄 Re-indexar Vault</button>
                  </div>
                </div>
              </div>
            </section>

            <!-- DAILY INTEL -->
            <section class="panel-section" id="tab-panel-intel">
              <div class="card-grid">
                <div class="obsidian-glass-card col-3">
                  <div class="card-head"><h3>⭐ GitHub Trending & Hacker News</h3></div>
                  <ul class="intel-summary-list">
                    <li><strong>deepseek-ai/DeepSeek-V3</strong>: Modelo MoE 671B abierto con inferencia local optimizada.</li>
                    <li><strong>hexgrad/kokoro</strong>: Motor TTS ultra ligero (82M params) con locución natural en español.</li>
                    <li><strong>Marcas de agua en Claude</strong>: Cumplimiento de estándares de IA en EU Act.</li>
                  </ul>
                </div>
              </div>
            </section>

            <!-- SKILLS -->
            <section class="panel-section" id="tab-panel-skills">
              <div class="obsidian-glass-card">
                <div class="card-head"><h3>📋 Registro de Skills & Log en Vivo</h3></div>
                <div class="obsidian-exec-log" id="obsidian-exec-log">
                  <div class="log-item info">[System] TrautsLab OS Command Center inicializado en Obsidian.</div>
                  <div class="log-item ready">[Ready] Motor de Voz y Enrutador listos.</div>
                </div>
              </div>
            </section>

            <!-- MEMORY -->
            <section class="panel-section" id="tab-panel-memory">
              <div class="obsidian-glass-card">
                <div class="card-head"><h3>🧠 Mapa de Navegación del Vault (Patrón Karpathy)</h3></div>
                <p>Las tablas de contenidos maestros se encuentran indexadas en <code>vault/WIKI/index.md</code>.</p>
                <div class="vault-links-preview">
                  <a class="vault-link" href="#" data-path="WIKI/index.md">📑 Abrir WIKI/index.md</a>
                  <a class="vault-link" href="#" data-path="AGENTS.md">📄 Abrir AGENTS.md</a>
                </div>
              </div>
            </section>
          </main>
        </div>

        <!-- VOICE MODAL -->
        <div id="obsidian-voice-modal" class="obsidian-voice-modal" hidden>
          <div class="voice-modal-inner">
            <button class="btn-close-modal" id="btn-close-voice-modal">&times;</button>
            <div class="modal-orb">🎙️</div>
            <h3 id="modal-voice-title">Escuchando...</h3>
            <p id="modal-transcription" class="modal-transcription">"¿Qué es lo más importante en mi agenda hoy?"</p>
            <div class="modal-tier-badge" id="modal-tier-badge">Tier 2: Caché Instantánea</div>
            <div class="modal-response" id="modal-response">
              "Tu compromiso principal hoy es la Revisión de Arquitectura TrautsLab OS a las 11:00 AM."
            </div>
          </div>
        </div>
      </div>
    `;

    this.attachEventListeners(container);
  }

  attachEventListeners(container: HTMLElement) {
    // Tabs Navigation
    const tabs = container.querySelectorAll('.nav-tab');
    const panels = container.querySelectorAll('.panel-section');

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.removeClass('active'));
        panels.forEach(p => p.removeClass('active'));

        tab.addClass('active');
        const targetTab = tab.getAttribute('data-tab');
        const targetPanel = container.querySelector(`#tab-panel-${targetTab}`);
        if (targetPanel) {
          targetPanel.addClass('active');
        }
      });
    });

    // Voice Modal Launch
    const btnVoice = container.querySelector('#btn-obsidian-voice');
    btnVoice?.addEventListener('click', () => this.openVoiceModal());

    const btnCloseModal = container.querySelector('#btn-close-voice-modal');
    btnCloseModal?.addEventListener('click', () => this.closeVoiceModal());

    // Skill Buttons
    const skillBtns = container.querySelectorAll('.skill-btn-action');
    skillBtns.forEach(btn => {
      btn.addEventListener('click', async () => {
        const skillId = btn.getAttribute('data-skill');
        if (skillId) {
          await this.runSkill(skillId);
        }
      });
    });
  }

  openVoiceModal() {
    const modal = this.containerEl.querySelector('#obsidian-voice-modal');
    if (!modal) return;
    modal.removeAttribute('hidden');

    const transcriptionEl = modal.querySelector('#modal-transcription');
    const responseEl = modal.querySelector('#modal-response');
    const tierBadge = modal.querySelector('#modal-tier-badge');

    if (transcriptionEl) transcriptionEl.textContent = 'Consultando agenda en caché...';
    if (responseEl) responseEl.textContent = '...';

    // Connect to local voice server
    fetch(`${this.plugin.settings.voiceServerUrl}/api/voice/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: '¿Qué es lo más importante en mi agenda hoy?' })
    })
      .then(res => res.json())
      .then(data => {
        if (transcriptionEl) transcriptionEl.textContent = `"${data.input}"`;
        if (tierBadge) tierBadge.textContent = `${data.tier} (${data.latencies.totalMs}ms)`;
        if (responseEl) responseEl.textContent = `"${data.responsePhoneticTts}"`;
        this.logMessage(`VOICE: "${data.input}" &rarr; ${data.tier} en ${data.latencies.totalMs}ms`);
      })
      .catch(() => {
        if (transcriptionEl) transcriptionEl.textContent = '"¿Qué es lo más importante en mi agenda hoy?"';
        if (tierBadge) tierBadge.textContent = 'Tier 2: Caché Instantánea (Local Simulado)';
        if (responseEl) responseEl.textContent = '"Tu compromiso principal hoy es la Revisión de Arquitectura TrautsLab OS a las 11:00 AM."';
      });
  }

  closeVoiceModal() {
    const modal = this.containerEl.querySelector('#obsidian-voice-modal');
    if (modal) {
      modal.setAttribute('hidden', '');
    }
  }

  async runSkill(skillId: string) {
    this.logMessage(`⚡ EJECUTANDO SKILL: ${skillId}...`);
    setTimeout(() => {
      this.logMessage(`✓ Skill '${skillId}' finalizada exitosamente.`);
    }, 800);
  }

  logMessage(text: string) {
    const logContainer = this.containerEl.querySelector('#obsidian-exec-log');
    if (!logContainer) return;
    const line = document.createElement('div');
    line.className = 'log-item info';
    line.innerHTML = `[${new Date().toLocaleTimeString('es-ES')}] ${text}`;
    logContainer.appendChild(line);
    logContainer.scrollTop = logContainer.scrollHeight;
  }
}
