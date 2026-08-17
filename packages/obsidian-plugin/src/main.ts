import { Plugin, WorkspaceLeaf } from 'obsidian';
import { TrautsLabPluginSettings, DEFAULT_SETTINGS, TrautsLabSettingTab } from './settings.js';
import { TrautsLabView, TRAUTSLAB_VIEW_TYPE } from './view.js';

export default class TrautsLabPlugin extends Plugin {
  settings: TrautsLabPluginSettings = DEFAULT_SETTINGS;
  private statusBarEl: HTMLElement | null = null;

  async onload() {
    await this.loadSettings();

    // 1. Register Custom View Type
    this.registerView(
      TRAUTSLAB_VIEW_TYPE,
      (leaf: WorkspaceLeaf) => new TrautsLabView(leaf, this)
    );

    // 2. Add Ribbon Icon
    this.addRibbonIcon('layout-dashboard', 'Abrir TrautsLab OS Command Center', () => {
      this.activateView();
    });

    // 3. Add Status Bar Item
    this.statusBarEl = this.addStatusBarItem();
    this.updateStatusBar(true);

    // 4. Add Command Palette Shortcuts
    this.addCommand({
      id: 'open-trautslab-command-center',
      name: 'Abrir Command Center Dashboard',
      callback: () => this.activateView()
    });

    this.addCommand({
      id: 'trigger-voice-assistant',
      name: 'Activar Asistente de Voz 3-Tier',
      callback: () => {
        const view = this.getActiveCommandCenterView();
        if (view) {
          view.openVoiceModal();
        } else {
          this.activateView().then(() => {
            setTimeout(() => this.getActiveCommandCenterView()?.openVoiceModal(), 300);
          });
        }
      }
    });

    this.addCommand({
      id: 'run-morning-intel',
      name: 'Ejecutar Escaneo Matutino (Morning Intel)',
      callback: async () => {
        const view = this.getActiveCommandCenterView();
        if (view) {
          await view.runSkill('morning-intel-scan');
        }
      }
    });

    // 5. Add Settings Tab
    this.addSettingTab(new TrautsLabSettingTab(this.app, this));

    console.log('[TrautsLab OS] Plugin de Obsidian inicializado correctamente.');
  }

  onunload() {
    console.log('[TrautsLab OS] Plugin descargado.');
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
    this.updateStatusBar(true);
  }

  updateStatusBar(isOnline: boolean) {
    if (!this.statusBarEl) return;
    this.statusBarEl.empty();
    const dot = this.statusBarEl.createSpan({ cls: 'trautslab-status-dot' });
    dot.style.display = 'inline-block';
    dot.style.width = '7px';
    dot.style.height = '7px';
    dot.style.borderRadius = '50%';
    dot.style.backgroundColor = isOnline ? '#10b981' : '#ef4444';
    dot.style.marginRight = '6px';
    dot.style.boxShadow = isOnline ? '0 0 6px #10b981' : 'none';

    this.statusBarEl.createSpan({ text: 'TrautsLab OS (GPU)' });
  }

  async activateView() {
    const { workspace } = this.app;
    let leaf: WorkspaceLeaf | null = null;
    const leaves = workspace.getLeavesOfType(TRAUTSLAB_VIEW_TYPE);

    if (leaves.length > 0) {
      leaf = leaves[0];
    } else {
      leaf = workspace.getLeaf('tab');
      if (leaf) {
        await leaf.setViewState({ type: TRAUTSLAB_VIEW_TYPE, active: true });
      }
    }

    if (leaf) {
      workspace.revealLeaf(leaf);
    }
  }

  getActiveCommandCenterView(): TrautsLabView | null {
    const leaves = this.app.workspace.getLeavesOfType(TRAUTSLAB_VIEW_TYPE);
    if (leaves.length > 0) {
      return leaves[0].view as TrautsLabView;
    }
    return null;
  }
}
