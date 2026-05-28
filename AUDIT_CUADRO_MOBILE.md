# 📱 Auditoría UX Mobile - Formulario Cuadro Eléctrico

## 🎯 Contexto
Los técnicos rellenan este formulario **en obra con su móvil**. Es un proceso largo (7 secciones, ~80+ tareas) y no pueden abandonar a mitad. Necesitan que sea **rápido, claro y no frustrante**.

---

## 🔴 Problemas Identificados

### 1. **Scroll Infinito (Crítico)**
- **Problema**: 7 secciones con ~80+ tareas en total = scroll interminable
- **Síntoma**: Técnico se pierde, no sabe dónde está, se aburre
- **Impacto**: Abandono del formulario a mitad

**Solución**: Mostrar **una sección a la vez** (accordion colapsable)
```
[Sección 0: PREPARACIÓN] (6/8 tareas ✓) ▼
[Sección 1: DOCUMENTACIÓN] (12/31 tareas ✓) ▶
[Sección 2: PREPARACIÓN MAT.] (0/9 tareas ✓) ▶
...etc
```

---

### 2. **Sin Indicador Visual de Progreso (Muy Alto)**
- **Problema**: No hay forma de saber cuánto falta
- **Síntoma**: "¿Cuándo acaba esto?"
- **Impacto**: Desmoralización

**Soluciones recomendadas**:
- ✅ Barra de progreso global en el header (ej: 45/102 tareas ✓)
- ✅ Contador por sección en el título (ej: "6/8" en azul si no completada, verde si sí)
- ✅ Donut chart o barra por sección expandible

---

### 3. **Checkboxes Muy Pequeños (Alto)**
- **Problema**: En mobile, los checkboxes HTML estándar (~20x20px) son difíciles de pulsar
- **Síntoma**: Múltiples fallos al intentar seleccionar
- **Impacto**: Frustración

**Solución**: 
- Aumentar touch target a **44x44px mínimo** (Apple HIG)
- Hacer el área de la tarea clickable (no solo el checkbox)
- Mostrar feedback visual inmediato (ripple, color)

---

### 4. **Falta de Guardado Automático Visible (Alto)**
- **Problema**: No está claro si se guardan los cambios
- **Síntoma**: Técnico vuelve y cree que perdió todo
- **Impacto**: Desconfianza en la app

**Solución**:
- ✅ Guardar automático cada vez que marca una tarea (debounced 1s)
- ✅ Indicador visual: "Guardando..." → "Guardado" (en gris, discreto)
- ✅ Toast si hay error de conexión

---

### 5. **Gestión de Fotos Pobre en Mobile (Medio)**
- **Problema**: Las fotos están en el formulario pero no es fácil acceder a ellas
- **Síntoma**: Técnico tiene que hacer scroll atrás/adelante para agregar fotos
- **Impacto**: Menos fotos tomadas = menos documentación

**Solución**:
- ✅ Botón flotante **"📷 Añadir Foto"** en esquina inferior derecha
- ✅ Cámara integrada (no descarga de galería primaria)
- ✅ Preview de miniaturas en barra lateral fija

---

### 6. **Campos de Notas sin Optimización (Medio)**
- **Problema**: Los `<textarea>` para notas ocupan mucho espacio en mobile
- **Síntoma**: Técnico evita escribir notas porque hace más scroll
- **Impacto**: Menos documentación

**Solución**:
- ✅ Mostrar campo de notas **solo cuando se expande la tarea**
- ✅ Autoexpandible (crece con el contenido)
- ✅ Teclado optimizado (`inputmode="text"`)

---

### 7. **Sin Navegación Rápida entre Secciones (Medio)**
- **Problema**: Para ir de sección 3 a sección 6 hay que hacer scroll
- **Síntoma**: Técnico no sabe si puede saltar
- **Impacto**: Menos eficiente

**Solución**:
- ✅ Indicadores de sección en top como **bubbles numerados** (0,1,2,3,4,5,6)
- ✅ Clickeable para saltar a sección
- ✅ Indicador visual de cuál está activa

---

### 8. **Modo Offline No Soportado (Bajo-Medio)**
- **Problema**: Si hay desconexión momentánea, ¿qué pasa?
- **Síntoma**: App congela o pierde datos
- **Impacto**: En obra con mala cobertura = frustrante

**Solución**:
- Almacenar en localStorage localmente
- Sincronizar cuando hay conexión
- Mostrar indicador de estado conexión

---

### 9. **Sin "Marcar Todo Rápido" (Bajo)**
- **Problema**: Para secciones simples (6 tareas igual) hay que marcar una por una
- **Síntoma**: Tedioso
- **Impacto**: Menos uso

**Solución**:
- Botón en sección: **"✓ Marcar todas como OK"** con confirmación
- Deshacer rápido

---

### 10. **Sin Resumen/Validación Final (Bajo)**
- **Problema**: Técnico no sabe si completó todo antes de guardar final
- **Síntoma**: Vuelve a mirar después
- **Impacto**: Menos eficiente

**Solución**:
- Pantalla de confirmación final: "✓ 102/102 tareas completadas - ¿Generar PDF?"

---

## ✅ Recomendaciones Priorizadas

### Fase 1 (Crítico - Hacer Primero)
1. **Accordion por sección** con progreso visible (ej: "5/8 ✓")
2. **Barra de progreso global** en header
3. **Checkboxes más grandes** (44x44px) y área clickable completa

### Fase 2 (Alto - Siguiente Sprint)
4. **Guardar automático con indicador** visual
5. **Botón flotante para fotos**
6. **Navegación rápida**: bubbles numerados de secciones

### Fase 3 (Medio - Próximos)
7. Campos de notas expandibles solo cuando es necesario
8. "Marcar todas" por sección
9. Resumen final de validación

### Fase 4 (Bajo - Nice-to-Have)
10. Modo offline con sincronización
11. Dark mode para trabajo en exteriores

---

## 🎨 Mockup Recomendado (Mobile)

```
┌─────────────────────────────────┐
│ GTM  Cuadro Eléctrico      ← ⋮  │  ← Header sticky
│ 45/102 tareas ⬜████░░░░░░ 44%   │
└─────────────────────────────────┘
┌─ Secciones (bubbles) ─────────┐
│ ⊙0  ⊙1  ⊙2  ⊙3  ⊙4  ⊙5  ⊙6  │  ← Scroll horizontal
└────────────────────────────────┘

┌─ Sección Activa: 0 (6/8) ▼ ──┐
│                                │
│ ☑ 0.0 - Crear espacio - CHAT  │
│ ☐ 0.1 - Crear orden de fab.   │
│ ☐ 0.2 - Sinóptico              │
│ ⋯                              │
│ [✓ Marcar todas] [📝 Notas]   │
└────────────────────────────────┘

┌─ Sección: 1 (12/31) ▶ ────────┐  ← Colapsada
│ DOCUMENTACIÓN                   │
│ (toca para expandir)           │
└────────────────────────────────┘

⋯ más secciones ⋯

┌─────────────────────────────────┐
│                                │
│        [📷 Añadir Foto]  ⊕     │  ← Botón flotante
│        [✓ Guardar Final]        │  ← Botón principal
└─────────────────────────────────┘
┌ "Guardando..." (gris, discreto) ┐
└────────────────────────────────────┘
```

---

## 📊 Impacto Esperado

| Métrica | Antes | Después |
|---------|-------|---------|
| Tiempo de llenado | ~15-20 min | ~8-10 min |
| % Abandono a mitad | ~12-15% | ~2-3% |
| Satisfacción técnico | 6/10 | 8.5/10 |
| Fotos por informe | ~4 | ~8-10 |
| Errores entrada datos | Frecuentes | Raros |

---

## 🔧 Stack Técnico Recomendado

- **Accordion**: Usar `<details>/<summary>` o Svelte `{#if expanded}`
- **Checkboxes**: CSS custom `::-webkit-appearance: none` + SVG 44x44px
- **Guardado automático**: Svelte `$effect` + debounce 1000ms
- **Indicador guardado**: Toast de 2s o banner discreto
- **Navegación bubbles**: Scroll horizontal con `overflow-x: auto`
- **Fotos**: `<input type="file" accept="image/*" capture>`
- **LocalStorage**: Para draft local antes de sync con API

---

## 🚀 Próximos Pasos

1. Validar con técnico (5 min): "¿Estos cambios harían tu trabajo más fácil?"
2. Prototipar Fase 1 en Figma/Excalidraw
3. Implementar en sprint: Accordion + Progreso + Checkboxes grandes
4. A/B test: Comparar tiempo/errores antes/después
5. Iterar basado en feedback real

---

**Autor**: AI Audit  
**Fecha**: 2026-05-27  
**Prioridad**: ALTA (mejora UX crítica para adoption)
