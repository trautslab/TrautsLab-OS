import fs from 'node:fs/promises';
import path from 'node:path';
import matter from 'gray-matter';
import fg from 'fast-glob';
import { VaultFileMetadata, DomainIndex } from './types.js';

export class VaultIndexer {
  private vaultRoot: string;

  constructor(vaultRoot: string) {
    this.vaultRoot = path.resolve(vaultRoot);
  }

  /**
   * Scan and parse metadata for all markdown files in the vault
   */
  async scanFiles(): Promise<VaultFileMetadata[]> {
    const pattern = `${this.vaultRoot}/**/*.md`.replace(/\\/g, '/');
    const filePaths = await fg(pattern, {
      ignore: [
        '**/index.md',
        '**/AGENTS.md',
        '**/CLAUDE.md',
        '**/.obsidian/**',
        '**/node_modules/**',
        '**/.git/**'
      ],
      absolute: true
    });

    const metadataList: VaultFileMetadata[] = [];

    for (const filePath of filePaths) {
      const relativePath = path.relative(this.vaultRoot, filePath);
      const fileName = path.basename(filePath, '.md');
      const parts = relativePath.split(path.sep);
      const category = parts[0] || 'ROOT';

      try {
        const rawContent = await fs.readFile(filePath, 'utf-8');
        const parsed = matter(rawContent);
        const data = parsed.data || {};

        const metadata: VaultFileMetadata = {
          filePath,
          relativePath,
          fileName,
          category,
          title: data.title || fileName.replace(/[-_]/g, ' '),
          domain: data.domain || (parts.length > 2 ? parts[1] : category.toLowerCase()),
          createdAt: data.created_at || data.date,
          updatedAt: data.updated_at,
          tags: Array.isArray(data.tags) ? data.tags : [],
          summary: data.summary || (parsed.content.trim().slice(0, 140).replace(/\n/g, ' ') + '...'),
          hasFrontmatter: Object.keys(data).length > 0
        };

        metadataList.push(metadata);
      } catch (err) {
        console.warn(`[VaultIndexer] Warning: Failed to parse frontmatter in ${relativePath}:`, err);
      }
    }

    return metadataList;
  }

  /**
   * Build hierarchical indices across the vault
   */
  async buildIndices(): Promise<{ masterIndex: string; subIndices: Record<string, string> }> {
    const allFiles = await this.scanFiles();
    const wikiFiles = allFiles.filter(f => f.category === 'WIKI');
    const rawFiles = allFiles.filter(f => f.category === 'RAW');
    const outputFiles = allFiles.filter(f => f.category === 'OUTPUT');

    // 1. Group WIKI files by domain
    const domainsMap: Record<string, VaultFileMetadata[]> = {
      'ai-systems': [],
      'productivity': [],
      'development': [],
      'operations': []
    };

    for (const file of wikiFiles) {
      const domainKey = file.domain || 'general';
      if (!domainsMap[domainKey]) {
        domainsMap[domainKey] = [];
      }
      domainsMap[domainKey].push(file);
    }

    // 2. Generate sub-domain index files inside WIKI/[domain]/index.md
    const subIndices: Record<string, string> = {};

    for (const [domain, files] of Object.entries(domainsMap)) {
      const domainDir = path.join(this.vaultRoot, 'WIKI', domain);
      await fs.mkdir(domainDir, { recursive: true });

      const content = this.renderDomainIndexMarkdown(domain, files);
      const subIndexPath = path.join(domainDir, 'index.md');
      await fs.writeFile(subIndexPath, content, 'utf-8');
      subIndices[domain] = subIndexPath;
    }

    // 3. Generate master WIKI/index.md
    const masterWikiContent = this.renderMasterWikiIndex(domainsMap);
    const masterIndexPath = path.join(this.vaultRoot, 'WIKI', 'index.md');
    await fs.writeFile(masterIndexPath, masterWikiContent, 'utf-8');

    // 4. Generate RAW/index.md and OUTPUT/index.md if directories exist
    if (rawFiles.length > 0) {
      const rawIndex = this.renderCategoryIndex('RAW — Datos Crudos e Ingesta', rawFiles);
      await fs.writeFile(path.join(this.vaultRoot, 'RAW', 'index.md'), rawIndex, 'utf-8');
    }

    if (outputFiles.length > 0) {
      const outputIndex = this.renderCategoryIndex('OUTPUT — Entregables y Reportes Finales', outputFiles);
      await fs.writeFile(path.join(this.vaultRoot, 'OUTPUT', 'index.md'), outputIndex, 'utf-8');
    }

    return {
      masterIndex: masterIndexPath,
      subIndices
    };
  }

  private renderDomainIndexMarkdown(domain: string, files: VaultFileMetadata[]): string {
    const titleMap: Record<string, string> = {
      'ai-systems': 'Inteligencia Artificial y Modelos Locales',
      'productivity': 'Productividad, Hábitos y Gestión Personal',
      'development': 'Desarrollo de Software y Arquitectura',
      'operations': 'Operaciones, Infraestructura y Automatizaciones'
    };

    const title = titleMap[domain] || domain.toUpperCase();
    const rows = files.map(f => {
      const tagBadges = (f.tags || []).map(t => `\`#${t}\``).join(' ');
      return `| [${f.title}](./${f.fileName}.md) | ${f.summary || '-'} | ${tagBadges || '-'} | ${f.createdAt || '-'} |`;
    }).join('\n');

    return `# Sub-índice Temático: ${title}

> **Dominio:** \`${domain}\`  
> **Directorio:** \`WIKI/${domain}/\`  
> **Total de Documentos:** ${files.length}  
> **Última Actualización:** ${new Date().toISOString().split('T')[0]}  

---

## 📑 Lista de Documentos

| Título / Enlace | Resumen Ejecutivo | Tags | Creado |
| :--- | :--- | :--- | :--- |
${rows || '| *No hay documentos aún* | - | - | - |'}

---
[⬅️ Volver a la Tabla de Contenidos Maestra](../index.md)
`;
  }

  private renderMasterWikiIndex(domainsMap: Record<string, VaultFileMetadata[]>): string {
    let summaryCards = '';

    for (const [domain, files] of Object.entries(domainsMap)) {
      summaryCards += `### 📂 [${domain.toUpperCase()}](./${domain}/index.md) (${files.length} notas)\n`;
      if (files.length === 0) {
        summaryCards += `- *Sin notas registradas aún*\n\n`;
      } else {
        files.slice(0, 5).forEach(f => {
          summaryCards += `- [${f.title}](./${domain}/${f.fileName}.md) — *${f.summary?.slice(0, 80)}...*\n`;
        });
        if (files.length > 5) {
          summaryCards += `- *... y ${files.length - 5} notas más en el sub-índice.*\n`;
        }
        summaryCards += `\n`;
      }
    }

    return `# WIKI — Tabla de Contenidos Maestra (Vault Navigation Index)

> **Instrucciones para Agentes CLI / LLMs:**  
> Consulta siempre este índice para identificar la rama temática adecuada antes de explorar archivos individuales.  
> Cada subcarpeta contiene su propio \`index.md\` con la lista completa de artículos y metadatos.

---

## 🧭 Dominios de Conocimiento

${summaryCards}

---

## 📌 Reglas de Indexación
1. Toda nueva nota debe agregarse en su respectiva subcarpeta con frontmatter YAML (\`title\`, \`domain\`, \`summary\`, \`tags\`).
2. El observador \`vault-watcher\` actualizará este índice automáticamente al guardar cambios.
`;
  }

  private renderCategoryIndex(title: string, files: VaultFileMetadata[]): string {
    const rows = files.map(f => {
      return `| [${f.title}](./${f.fileName}.md) | ${f.summary || '-'} | ${f.createdAt || '-'} |`;
    }).join('\n');

    return `# ${title}

> **Total de Documentos:** ${files.length}  
> **Última Actualización:** ${new Date().toISOString().split('T')[0]}  

---

| Archivo | Resumen | Fecha |
| :--- | :--- | :--- |
${rows || '| *Sin archivos registrados* | - | - |'}
`;
  }
}
