/**
 * TrautsLab OS — MCP Tools Implementation & Schema Definitions
 * Provides 10 fully-typed tools for LLMs with rich markdown responses.
 */

import fs from 'node:fs';
import path from 'node:path';
import { VaultIndexer, Tier2CacheManager, HybridSearchEngine } from '@trautslab/vault-engine';
import {
  SkillRegistry,
  MorningIntelScanSkill,
  CalendarDailyBriefSkill,
  CalendarAddEventSkill,
  CalendarArchiveEventSkill,
  VaultSyncIndexerSkill,
  TelegramNotifySkill,
  VaultSemanticSearchSkill,
  HyperOrchestrator
} from '@trautslab/skills-engine';
import { sendTelegramNotification } from '@trautslab/telegram-bridge';
import { MCPToolDefinition, MCPToolResult } from './types.js';

export class MCPToolsRegistry {
  private vaultRoot: string;
  private skillRegistry: SkillRegistry;
  private hybridSearch: HybridSearchEngine;
  private cacheManager: Tier2CacheManager;
  private hyperOrchestrator: HyperOrchestrator;

  constructor(vaultRoot: string) {
    this.vaultRoot = vaultRoot;
    this.skillRegistry = new SkillRegistry();
    this.skillRegistry.register(new MorningIntelScanSkill());
    this.skillRegistry.register(new CalendarDailyBriefSkill());
    this.skillRegistry.register(new CalendarAddEventSkill());
    this.skillRegistry.register(new CalendarArchiveEventSkill());
    this.skillRegistry.register(new VaultSyncIndexerSkill());
    this.skillRegistry.register(new TelegramNotifySkill());
    this.skillRegistry.register(new VaultSemanticSearchSkill());

    this.hybridSearch = new HybridSearchEngine(this.vaultRoot);
    this.cacheManager = new Tier2CacheManager(this.vaultRoot);
    this.hyperOrchestrator = new HyperOrchestrator(this.vaultRoot);
  }

  /**
   * Get list of all 10 MCP tool definitions
   */
  public getToolDefinitions(): MCPToolDefinition[] {
    return [
      {
        name: 'trautslab_vault_read',
        description: 'Lee el contenido íntegro y el frontmatter YAML de cualquier nota o documento Markdown del Obsidian Vault.',
        inputSchema: {
          type: 'object',
          properties: {
            relativePath: {
              type: 'string',
              description: 'Ruta relativa del archivo dentro del Vault (ej: "WIKI/ai-systems/local-voice-pipeline.md" o "OUTPUT/daily-agenda-2026-08-19.md").'
            }
          },
          required: ['relativePath']
        }
      },
      {
        name: 'trautslab_vault_search',
        description: 'Búsqueda léxica rápida por palabras clave en títulos, resúmenes y etiquetas del Obsidian Vault.',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Términos de búsqueda a buscar en las notas.'
            },
            limit: {
              type: 'number',
              description: 'Número máximo de resultados a retornar (por defecto 10).'
            }
          },
          required: ['query']
        }
      },
      {
        name: 'trautslab_vault_semantic_search',
        description: 'Búsqueda vectorial híbrida (BM25 + Embeddings locales) para encontrar conceptos semánticos incluso si no coinciden exactamente las palabras clave.',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Pregunta o concepto semántico a buscar en el Vault (ej: "modelos de voz con aceleración en GPU Apple").'
            },
            topK: {
              type: 'number',
              description: 'Cantidad de notas más relevantes a recuperar (por defecto 5).'
            }
          },
          required: ['query']
        }
      },
      {
        name: 'trautslab_vault_reindex',
        description: 'Ejecuta el escaneo del Vault y regenera todas las tablas de contenidos e índices jerárquicos (WIKI/index.md y sub-índices).',
        inputSchema: {
          type: 'object',
          properties: {}
        }
      },
      {
        name: 'trautslab_calendar_get_agenda',
        description: 'Obtiene la lista estructurada de compromisos y actividades para hoy o una fecha específica en formato JSON y Markdown.',
        inputSchema: {
          type: 'object',
          properties: {
            date: {
              type: 'string',
              description: 'Fecha en formato YYYY-MM-DD (por defecto hoy en hora de Perú PET).'
            }
          }
        }
      },
      {
        name: 'trautslab_calendar_add_event',
        description: 'Agrega un nuevo compromiso a la agenda diaria en Obsidian Markdown (OUTPUT/daily-agenda-YYYY-MM-DD.md) y actualiza la caché Tier 2.',
        inputSchema: {
          type: 'object',
          properties: {
            title: {
              type: 'string',
              description: 'Título descriptivo del evento o compromiso.'
            },
            date: {
              type: 'string',
              description: 'Fecha del evento en formato YYYY-MM-DD.'
            },
            time: {
              type: 'string',
              description: 'Hora del evento (ej: "08:00 PM", "16:30", "4:15 PM").'
            },
            location: {
              type: 'string',
              description: 'Lugar del evento si aplica (ej: "Centro Cívico", "Miraflores", "Google Meet").'
            },
            priority: {
              type: 'string',
              enum: ['HIGH', 'NORMAL', 'LOW'],
              description: 'Prioridad del compromiso.'
            }
          },
          required: ['title', 'date', 'time']
        }
      },
      {
        name: 'trautslab_calendar_edit_event',
        description: 'Modifica una fila existente de la agenda diaria en Markdown in-place sin romper la estructura de tabla.',
        inputSchema: {
          type: 'object',
          properties: {
            date: {
              type: 'string',
              description: 'Fecha del archivo de agenda en formato YYYY-MM-DD.'
            },
            originalText: {
              type: 'string',
              description: 'Texto o título actual que se desea buscar y reemplazar.'
            },
            newTitle: {
              type: 'string',
              description: 'Nuevo título para el compromiso.'
            },
            newTime: {
              type: 'string',
              description: 'Nueva hora del compromiso (opcional).'
            },
            newLocation: {
              type: 'string',
              description: 'Nueva ubicación del compromiso (opcional).'
            }
          },
          required: ['date', 'originalText', 'newTitle']
        }
      },
      {
        name: 'trautslab_calendar_archive',
        description: 'Archiva actividades específicas o archiva todas las actividades del día pasándolas a la sección de completadas.',
        inputSchema: {
          type: 'object',
          properties: {
            action: {
              type: 'string',
              enum: ['archive_all', 'archive_one'],
              description: 'Tipo de archivado: "archive_all" para el día completo o "archive_one" para una actividad puntual.'
            },
            date: {
              type: 'string',
              description: 'Fecha de la agenda (YYYY-MM-DD).'
            },
            title: {
              type: 'string',
              description: 'Título de la actividad si es archive_one.'
            }
          },
          required: ['action']
        }
      },
      {
        name: 'trautslab_morning_intel_scan',
        description: 'Ejecuta el scraper matutino de repositorios tendencia en GitHub y debates destacados en Hacker News, generando el reporte en WIKI.',
        inputSchema: {
          type: 'object',
          properties: {}
        }
      },
      {
        name: 'trautslab_telegram_notify',
        description: 'Envía una notificación push inmediata o programa un recordatorio con temporizador al Telegram de Jhonny Lorenzo (@TrautsLabBot).',
        inputSchema: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              description: 'Mensaje de la notificación o recordatorio.'
            },
            title: {
              type: 'string',
              description: 'Título corto de la notificación (opcional).'
            },
            delayMinutes: {
              type: 'number',
              description: 'Minutos de retraso si es un recordatorio diferido (ej: 2 para notificar dentro de 2 minutos).'
            },
            priority: {
              type: 'string',
              enum: ['high', 'normal', 'low'],
              description: 'Prioridad de la alerta push.'
            }
          },
          required: ['message']
        }
      },
      {
        name: 'trautslab_hyperagent_run_task',
        description: 'Delega una tarea compleja de investigación, creación de notas o desarrollo a la cuadrilla de 4 roles HyperAgent (Planner, Navigator, Editor, Executor) con auto-reparación e indexación automática.',
        inputSchema: {
          type: 'object',
          properties: {
            goal: {
              type: 'string',
              description: 'Objetivo o meta compleja a cumplir (ej: "Investigar arquitecturas de voz local y generar reporte en WIKI").'
            }
          },
          required: ['goal']
        }
      }
    ];
  }

  /**
   * Execute an MCP Tool by name with validated arguments
   */
  public async executeTool(name: string, args: Record<string, any> = {}): Promise<MCPToolResult> {
    try {
      switch (name) {
        case 'trautslab_vault_read': {
          const relPath = String(args.relativePath || '').replace(/^\/+/, '');
          const fullPath = path.resolve(this.vaultRoot, relPath);
          if (!fullPath.startsWith(this.vaultRoot) || !fs.existsSync(fullPath)) {
            return {
              isError: true,
              content: [{ type: 'text', text: `Error: El archivo "${relPath}" no existe en el Vault.` }]
            };
          }
          const content = fs.readFileSync(fullPath, 'utf-8');
          return {
            content: [{ type: 'text', text: content }]
          };
        }

        case 'trautslab_vault_search': {
          const query = String(args.query || '').toLowerCase();
          const limit = Number(args.limit) || 10;
          const searchEngine = new HybridSearchEngine(this.vaultRoot);
          const results = await searchEngine.search(query, { topK: limit, alpha: 1.0 }); // Pure BM25
          const formatted = results.map((r, i) => `${i + 1}. [${r.title}](${r.relativePath}) — ${r.excerpt}`).join('\n\n');
          return {
            content: [{ type: 'text', text: formatted || `No se encontraron notas con el término "${query}".` }]
          };
        }

        case 'trautslab_vault_semantic_search': {
          const query = String(args.query || '');
          const topK = Number(args.topK) || 5;
          const res = await this.hybridSearch.search(query, { topK, alpha: 0.5 });
          const formatted = res.map((r, i) => 
            `### ${i + 1}. ${r.title} (Relevancia: ${Math.round(r.score * 100)}%)\n- **Ruta:** \`${r.relativePath}\`\n- **Dominio:** \`${r.domain}\`\n- **Resumen:** ${r.excerpt}`
          ).join('\n\n');
          return {
            content: [{ type: 'text', text: formatted || 'No se encontraron resultados semánticos.' }]
          };
        }

        case 'trautslab_vault_reindex': {
          const res = await this.skillRegistry.execute('vault-sync-indexer', {
            vaultRoot: this.vaultRoot,
            timestamp: new Date(),
            args: {}
          });
          return {
            content: [{ type: 'text', text: res.message }]
          };
        }

        case 'trautslab_calendar_get_agenda': {
          const date = args.date || new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Lima' }).format(new Date());
          const filePath = path.join(this.vaultRoot, 'OUTPUT', `daily-agenda-${date}.md`);
          if (!fs.existsSync(filePath)) {
            return {
              content: [{ type: 'text', text: `No existe cronograma registrado para la fecha ${date}.` }]
            };
          }
          const content = fs.readFileSync(filePath, 'utf-8');
          return {
            content: [{ type: 'text', text: content }]
          };
        }

        case 'trautslab_calendar_add_event': {
          const res = await this.skillRegistry.execute('calendar-add-event', {
            vaultRoot: this.vaultRoot,
            timestamp: new Date(),
            args: {
              title: args.title,
              date: args.date,
              time: args.time,
              location: args.location || 'N/A',
              priority: args.priority || 'NORMAL'
            }
          });
          return {
            content: [{ type: 'text', text: res.message }]
          };
        }

        case 'trautslab_calendar_edit_event': {
          const date = args.date || new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Lima' }).format(new Date());
          const filePath = path.join(this.vaultRoot, 'OUTPUT', `daily-agenda-${date}.md`);
          if (!fs.existsSync(filePath)) {
            return {
              isError: true,
              content: [{ type: 'text', text: `No existe archivo de agenda para la fecha ${date}.` }]
            };
          }

          let content = fs.readFileSync(filePath, 'utf-8');
          const orig = String(args.originalText);
          const regex = new RegExp(`\\|\\s*\`?([^\`|]+)\`?\\s*\\|\\s*\\*\\*([^\\*]+)\\*\\*\\s*\\|\\s*([^\\|]+)\\s*\\|\\s*\`?([^\`|]+)\`?\\s*\\|\\s*([^\\|]+)\\s*\\|`, 'gi');

          let replaced = false;
          content = content.replace(regex, (match, time, title, loc, prio, status) => {
            if (title.toLowerCase().includes(orig.toLowerCase()) || match.toLowerCase().includes(orig.toLowerCase())) {
              replaced = true;
              const nTime = args.newTime || time.trim();
              const nTitle = args.newTitle || title.trim();
              const nLoc = args.newLocation || loc.trim();
              return `| \`${nTime}\` | **${nTitle}** | ${nLoc} | \`${prio.trim()}\` | ${status.trim()} |`;
            }
            return match;
          });

          if (replaced) {
            fs.writeFileSync(filePath, content, 'utf-8');
            return {
              content: [{ type: 'text', text: `✓ Evento "${orig}" actualizado con éxito a "${args.newTitle}".` }]
            };
          } else {
            return {
              isError: true,
              content: [{ type: 'text', text: `No se encontró ninguna fila que coincida con "${orig}".` }]
            };
          }
        }

        case 'trautslab_calendar_archive': {
          const res = await this.skillRegistry.execute('calendar-archive-event', {
            vaultRoot: this.vaultRoot,
            timestamp: new Date(),
            args: {
              action: args.action,
              title: args.title,
              date: args.date
            }
          });
          return {
            content: [{ type: 'text', text: res.message }]
          };
        }

        case 'trautslab_morning_intel_scan': {
          const res = await this.skillRegistry.execute('morning-intel-scan', {
            vaultRoot: this.vaultRoot,
            timestamp: new Date(),
            args: {}
          });
          return {
            content: [{ type: 'text', text: res.message }]
          };
        }

        case 'trautslab_telegram_notify': {
          const res = await this.skillRegistry.execute('telegram-notify', {
            vaultRoot: this.vaultRoot,
            timestamp: new Date(),
            args: {
              message: args.message,
              title: args.title,
              delayMinutes: args.delayMinutes,
              priority: args.priority
            }
          });
          return {
            content: [{ type: 'text', text: res.message }]
          };
        }

        case 'trautslab_hyperagent_run_task': {
          const goal = String(args.goal || '').trim();
          if (!goal) {
            return {
              isError: true,
              content: [{ type: 'text', text: 'Error: El parámetro "goal" es obligatorio para HyperAgent.' }]
            };
          }

          const result = await this.hyperOrchestrator.runTask(goal);
          const report = `# 🚀 Ejecución HyperAgent: "${result.goal}"\n\n` +
            `- **Estado:** ${result.success ? '✅ Éxito' : '⚠️ Advertencia'}\n` +
            `- **Tiempo Total:** ${result.totalTimeMs}ms\n` +
            `- **Pasos Ejecutados:** ${result.plan.tasks.length}\n` +
            `- **Resumen:** ${result.finalSummary}\n\n` +
            `### 📑 Desglose de Pasos:\n` +
            result.plan.tasks.map(t => `${t.stepNumber}. **[${t.role}]** ${t.title}: ${t.status === 'SUCCESS' ? '✓' : '✗'} ${t.result || t.error}`).join('\n') +
            `\n\n### 📦 Artefactos Creados / Actualizados:\n` +
            (result.artifactsCreated.length > 0 ? result.artifactsCreated.map(a => `- \`${a}\``).join('\n') : '- Ninguno');

          return {
            content: [{ type: 'text', text: report }]
          };
        }

        default:
          return {
            isError: true,
            content: [{ type: 'text', text: `Herramienta desconocida: "${name}".` }]
          };
      }
    } catch (err: any) {
      return {
        isError: true,
        content: [{ type: 'text', text: `Error ejecutando ${name}: ${err.message}` }]
      };
    }
  }
}
