import { App, PluginSettingTab, Setting } from 'obsidian';
import type TrautsLabPlugin from './main.js';

export interface TrautsLabPluginSettings {
  voiceServerUrl: string;
  autoRefreshMinutes: number;
  enableVoiceOrb: boolean;
  highContrastDefault: boolean;
  sttModelName: string;
  ttsVoice: string;
}

export const DEFAULT_SETTINGS: TrautsLabPluginSettings = {
  voiceServerUrl: 'http://localhost:3030',
  autoRefreshMinutes: 15,
  enableVoiceOrb: true,
  highContrastDefault: false,
  sttModelName: 'faster-whisper-medium',
  ttsVoice: 'es_f_locutora'
};

export class TrautsLabSettingTab extends PluginSettingTab {
  plugin: TrautsLabPlugin;

  constructor(app: App, plugin: TrautsLabPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl('h2', { text: 'Configuración de TrautsLab OS' });

    new Setting(containerEl)
      .setName('Servidor de Voz Local (URL)')
      .setDesc('Dirección HTTP del microservicio de enrutamiento y síntesis de voz.')
      .addText(text => text
        .setPlaceholder('http://localhost:3030')
        .setValue(this.plugin.settings.voiceServerUrl)
        .onChange(async (value) => {
          this.plugin.settings.voiceServerUrl = value.trim();
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Intervalo de Actualización de Datos')
      .setDesc('Minutos entre cada sincronización automática de widgets.')
      .addSlider(slider => slider
        .setLimits(5, 60, 5)
        .setValue(this.plugin.settings.autoRefreshMinutes)
        .setDynamicTooltip()
        .onChange(async (value) => {
          this.plugin.settings.autoRefreshMinutes = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Habilitar Voice Orb Interactivo')
      .setDesc('Muestra el widget de micrófono interactivo en la barra lateral del Command Center.')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.enableVoiceOrb)
        .onChange(async (value) => {
          this.plugin.settings.enableVoiceOrb = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Voz de Síntesis Kokoro TTS')
      .setDesc('Identificador de la voz en español para respuestas habladas.')
      .addDropdown(dropdown => dropdown
        .addOption('es_f_locutora', 'Español Femenino (Locutora Natural)')
        .addOption('es_m_narrador', 'Español Masculino (Narrador)')
        .setValue(this.plugin.settings.ttsVoice)
        .onChange(async (value) => {
          this.plugin.settings.ttsVoice = value;
          await this.plugin.saveSettings();
        }));
  }
}
