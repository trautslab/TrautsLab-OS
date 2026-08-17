# Guía de Contribución — TrautsLab OS

¡Gracias por tu interés en contribuir a **TrautsLab OS**! Este documento describe las normas, el flujo de trabajo y las buenas prácticas para colaborar en este repositorio.

---

## 1. Código de Conducta y Principios

1. **Determinismo y Eficiencia:** Todo código nuevo, *skill* o integración debe priorizar el mínimo consumo de tokens, baja latencia y alta predictibilidad.
2. **Privacidad y Soberanía Local:** Preferir siempre arquitecturas locales (*on-device*) o híbridas seguras antes de depender exclusivamente de servicios externos en la nube.
3. **Calidad Visual y Accesibilidad:** Las interfaces de usuario deben mantener estándares altos de estética (*Glassmorphism*, diseño responsivo, soporte de alto contraste y navegación por teclado).

---

## 2. Flujo de Trabajo con Git (*Git Flow*)

1. **Fork o Clonación Local:**
   ```bash
   git clone https://github.com/jlorenzor/TrautsLab-OS.git
   cd TrautsLab-OS
   ```
2. **Crear una Rama de Trabajo:**
   Utiliza nombres descriptivos siguiendo el prefijo correspondiente:
   - `feat/nombre-funcionalidad` (para nuevas características)
   - `fix/descripcion-error` (para solución de errores)
   - `docs/nombre-documento` (para actualizaciones en la documentación)
   - `refactor/nombre-modulo` (para mejoras de código sin cambio de comportamiento)

   ```bash
   git checkout -b feat/voice-router-integration
   ```

3. **Hacer Commits Semánticos (Conventional Commits):**
   Utilizamos la especificación de **Conventional Commits**:
   - `feat:` Nueva funcionalidad para el usuario.
   - `fix:` Corrección de un bug.
   - `docs:` Cambios exclusivamente en la documentación.
   - `style:` Cambios de formato, CSS, espacios (sin impacto en lógica).
   - `refactor:` Reestructuración de código sin agregar funciones ni arreglar bugs.
   - `test:` Inclusión o ajuste de pruebas unitarias o de integración.
   - `chore:` Tareas de mantenimiento, dependencias o configuración del repositorio.

   *Ejemplo de commit válido:*
   ```bash
   git commit -m "feat(voice): add support for Faster-Whisper local model inference"
   ```

4. **Actualizar el Changelog:**
   Si tu cambio introduce nuevas funcionalidades o corrige errores, añade la entrada correspondiente bajo la sección `[Unreleased]` en `CHANGELOG.md`.

5. **Enviar Pull Request (PR):**
   - Asegúrate de que los diagramas Mermaid compilen correctamente.
   - Describe con claridad el propósito del cambio y los pasos para probarlo.

---

## 3. Estándares de Documentación y Diagramación

* **Diagramas Mermaid:** Todos los diagramas de arquitectura, componentes, secuencia y casos de uso deben estar embebidos en bloques de código markdown con el identificador `mermaid`.
* **Especificaciones de Requisitos:** Toda nueva funcionalidad de envergadura debe documentarse siguiendo la plantilla de Casos de Uso (`docs/requirements/use-cases.md`).
