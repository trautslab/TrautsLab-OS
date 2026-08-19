# ADR-005: Telegram Assistant Bridge, Notificaciones Push y Temporizadores Diferidos

> **Estado:** ACEPTADO  
> **Fecha:** 2026-08-18 (PET / UTC-5 - Hora Perú)  
> **Autores:** Jhonny Lorenzo (`jlorenzor`)  
> **Dominio:** Integraciones Móviles / Notificaciones / Mensajería

---

## 1. Contexto y Planteamiento del Problema

El usuario necesita interactuar con TrautsLab OS mientras se encuentra fuera de su escritorio o en movilidad (caminando, en el transporte o en la calle). La interacción por texto o notas de voz debe mantener la misma inteligencia que el asistente de escritorio, y el sistema debe ser capaz de emitir notificaciones push proactivas y gestionar recordatorios temporales (ej: *"notifícame dentro de 2 minutos para votar la basura"*).

---

## 2. Decisión Arquitectónica

Implementar un paquete dedicado `@trautslab/telegram-bridge` conectado al bot institucional `@TrautsLabBot`:

1. **Demonio de Long-Polling y Webhooks:**
   - Escucha continua de mensajes y notas de voz filtrando por el ID exclusivo de Jhonny Lorenzo (`8431939545`).
2. **Habilidad `telegram-notify` (Push y Temporizadores):**
   - Registrada como Skill Tier 1 en `SkillRegistry` para que el LLM pueda invocarla deterministamente.
   - Soporte para ejecución inmediata o programada mediante `setTimeout` / temporizadores en segundo plano.
3. **Pipeline Acústico de Voz en Telegram:**
   - Descarga de archivos Opus `.oga` -> Conversión FFmpeg a WAV -> Whisper Large v3 Turbo en GPU Metal -> Pipeline de Voz -> Respuesta auditiva / texto.

---

## 3. Consecuencias

### Positivas:
- **Acceso móvil instantáneo** sin necesidad de abrir puertos hacia internet pública.
- **Recordatorios naturales y fiables:** El asistente programa recordatorios diferidos sin necesidad de apps de alarmas de terceros.
- Respuestas en audio sintético y texto formateado con Markdown enriquecido.

### Negativas / Retos:
- Dependencia de la disponibilidad de la API de Telegram Bot.

---

## 4. Estrategia de Escalabilidad

1. **Soporte multi-canal de mensajería:** Abstraer el motor de notificaciones para soportar canales adicionales como WhatsApp Cloud API, Apple APNs o Web Push PWA.
2. **Persistencia de recordatorios en base de datos:** Guardar los temporizadores pendientes en SQLite / JSON persistente para resistir reinicios de la máquina sin perder recordatorios a largo plazo.
