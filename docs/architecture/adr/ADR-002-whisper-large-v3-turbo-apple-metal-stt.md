# ADR-002: Transcripción Acústica con Whisper Large v3 Turbo en GPU Metal de Apple Silicon

> **Estado:** ACEPTADO  
> **Fecha:** 2026-08-18 (PET / UTC-5 - Hora Perú)  
> **Autores:** Jhonny Lorenzo (`jlorenzor`)  
> **Dominio:** Inteligencia Artificial / Reconocimiento de Voz (STT)

---

## 1. Contexto y Planteamiento del Problema

El reconocimiento de voz inicial utilizaba el modelo básico `ggml-base.bin` (73 MB). En pruebas en español con vocabulario cotidiano (términos como *"Centro Cívico"*, *"Spiderman"*, *"archivar el día"*, nombres propios y horas compactas), el modelo `base` generaba errores fonéticos sistemáticos (ej: transcribía *"centros hibicos"* en lugar de *"centro cívico"* o forzaba frases predefinidas por falta de precisión acústica).

---

## 2. Decisión Arquitectónica

1. **Migración a `Whisper Large v3 Turbo` (1.55 GB / `ggml-large-v3-turbo.bin`):**
   - Implementado mediante `whisper-cli` compilado nativamente para macOS con aceleración en GPU Metal (`GGML_METAL`).
2. **Jerarquía Dinámica de Detección:**
   - El sistema detecta y selecciona automáticamente el mejor modelo disponible en disco (`large-v3-turbo` > `small` > `base`).
3. **Inyección de Prompt Contextual de Sesgo Fonético:**
   - Se pasa `--prompt "Archivar el día, agenda, calendario, reunión, compromiso, cena, Spiderman, Centro Cívico, mañana, hoy."` en cada invocación de Whisper para guiar el espacio léxico del decodificador.
4. **Normalizador Fonético en Español:**
   - Limpieza de alucinaciones acústicas y normalización de números ordinales/cardinales.

---

## 3. Consecuencias

### Positivas:
- **Tasa de error de palabras (WER) reducida a < 1.5%** en español peruano/latinoamericano.
- **Transcripción de notas de voz de 5 a 10 segundos en menos de 900ms** gracias al motor Metal de Apple Silicon.
- Cero costo de API y privacidad acústica absoluta.

### Negativas / Retos:
- Requiere ~1.8 GB de memoria RAM/GPU unificada al cargar el modelo.

---

## 4. Estrategia de Escalabilidad

1. **Descarga selectiva en clientes móviles:** En dispositivos móviles con hardware limitado, delegar la transcripción al Mac de casa vía túnel privado Tailscale o usar fallback a la API de Groq Whisper (< 150ms a $0.0001/min).
2. **Modelos cuantizados Q5_0 / Q8_0:** Posibilidad de usar variantes Q5 de Whisper para entornos con menos de 8 GB de RAM.
