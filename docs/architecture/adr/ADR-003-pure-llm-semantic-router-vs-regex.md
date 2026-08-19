# ADR-003: Enrutador Semántico Puro con LLM vs Heurísticas Rígidas de Expresiones Regulares

> **Estado:** ACEPTADO  
> **Fecha:** 2026-08-18 (PET / UTC-5 - Hora Perú)  
> **Autores:** Jhonny Lorenzo (`jlorenzor`)  
> **Dominio:** Enrutamiento de Intenciones / Inteligencia Artificial

---

## 1. Contexto y Planteamiento del Problema

El prototipo inicial de enrutamiento contenía más de 140 líneas de expresiones regulares (`regex`) hardcodeadas para intentar capturar fechas, horas, títulos de eventos y comandos. Este enfoque fallaba frecuentemente ante lenguaje natural flexible (ej: *"Oye hermano el jueves en la tarde tengo que pasar por la oficina a recoger los documentos a las 4 y 15"* o *"¿Puedes decirme para votar la basura a las 9 de la noche?"*), ya que las regex no comprendían semántica, contexto temporal relativo ni intenciones implícitas.

---

## 2. Decisión Arquitectónica

Eliminar por completo las heurísticas de expresiones regulares y adoptar un **Enrutador Semántico 100% LLM (`LLMIntentRouter`)**:

1. **Descubrimiento Dinámico de Esquemas de Skills:**
   - En tiempo de ejecución, el enrutador consulta las habilidades registradas en `SkillRegistry` e inyecta sus nombres, descripciones y dominios en el prompt del sistema.
2. **Contexto Temporal de Perú en el Prompt:**
   - Se inyecta la fecha exacta, el día de la semana y la hora local (`PET / UTC-5 - Hora Perú`) para que el LLM calcule automáticamente fechas relativas (*"mañana"*, *"el jueves"*, *"la próxima semana"*).
3. **Extracción Estructurada JSON:**
   - El modelo devuelve un esquema JSON validado con campos tipados: `intent`, `tier`, `confidence`, `parameters` (`title`, `date`, `time`, `location`, `priority`, `action`, `message`).
4. **Optimización con Ollama & Keep-Alive de 60 minutos:**
   - El modelo `qwen2.5:3b` se mantiene cargado en la memoria unificada del Mac (`keep_alive: "60m"`) respondiendo en ~300-600ms.

---

## 3. Consecuencias

### Positivas:
- **Comprensión contextual perfecta** de lenguaje coloquial, variaciones de entonación y estructuras complejas.
- **Cero código regex frágil:** Agregar una nueva skill solo requiere registrarla en `SkillRegistry` y el LLM la descubre automáticamente.
- **Cálculo de fechas precisas:** Resuelve automáticamente ambigüedades temporales relativas.

### Negativas / Retos:
- Dependencia del servicio local de Ollama activo en el puerto 11434.

---

## 4. Estrategia de Escalabilidad

1. **Modelos de razonamiento escalonados:** Usar `qwen2.5:3b` para clasificación rápida y delegar a `qwen2.5:7b` o `claude-3-5-haiku` si la confianza calculada es menor a 0.70.
2. **Gramáticas BNF / JSON Schema restringido:** Forzar la salida de Ollama mediante gramáticas GBNF para garantizar siempre JSON sintácticamente infalible.
