# Changelog

Todos los cambios notables en este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto se adhiere a [Semantic Versioning](https://semver.org/lang/es/).

---

## [Unreleased]

### Added
- Integración de arquitectura de voz en tiempo real con soporte para hotkey global.
- Pipeline de enrutamiento inteligente de 3 niveles (*Tiers 1, 2 y 3*).
- Plugin base de Obsidian para el Dashboard Command Center con soporte de *Hot Reload*.

---

## [0.1.0-alpha.1] - 2026-08-17

### Added
- **Incepción del Proyecto:** Creación del documento fundacional `docs/inception/0-main-idea.md` con la visión de TrautsLab OS y sus 4 pilares fundamentales.
- **Análisis de Acceso Móvil y Costos:** Creación de `docs/inception/1-mobile-remote-access-and-costs.md` detallando la arquitectura PWA, túneles seguros (Tailscale/Cloudflare) y desglose de costes ($3-$8/mes).
- **Prototipo Frontend Accesible:**
  - Estructura semántica en HTML5 (`frontend/index.html`) con roles ARIA, atajos globales de teclado (`1-4`, `Espacio/V`, `T`, `Esc`) y soporte para lectores de pantalla.
  - Hoja de estilos `frontend/style.css` con estética moderna *Glassmorphism*, paleta oscura, animaciones de ondas de audio y modo de Alto Contraste.
  - Lógica interactiva en `frontend/app.js` con simulador de enrutamiento por voz de 3 niveles, reloj en vivo, terminal integrada y visor jerárquico del Vault.
- **Especificaciones de Ingeniería de Software:**
  - Especificación formal de Casos de Uso (UC-01 al UC-05) y Requisitos Funcionales (RF-01 al RF-05) con diagramas Mermaid en `docs/requirements/use-cases.md`.
  - Diagramas de arquitectura, componentes, secuencia y actividades en `docs/architecture/diagrams.md`.
  - Guías de contribución (`CONTRIBUTING.md`), control de cambios (`CHANGELOG.md`) y política de versionado semántico (`VERSIONING.md`).

---

### Tipos de Cambios
- `Added` para características nuevas añadidas.
- `Changed` para cambios en funcionalidades existentes.
- `Deprecated` para funcionalidades que serán removidas en futuras versiones.
- `Removed` para funcionalidades eliminadas.
- `Fixed` para corrección de bugs o errores.
- `Security` para mejoras o parches de vulnerabilidades.
