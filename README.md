# FITCORE — Design Handoff para Claude Code

## Overview

Handoff completo del diseño de **FITCORE**, app móvil de fitness integral para entrenamiento en casa. Incluye mockups hi-fi, wireframes de flujo completo y especificaciones técnicas listas para implementar en React Native + Expo.

---

## Sobre los archivos de diseño

Los archivos `.html` en este bundle son **referencias de diseño creadas como prototipos HTML** — muestran la apariencia y comportamiento exactos de la UI. La tarea es **recrear estos diseños en React Native + Expo**, usando el design system documentado en `CLAUDE.md`, no copiar el HTML directamente.

## Fidelidad

**Alta fidelidad (hi-fi)** — Los mockups en `FITCORE Mockup.html` son pixel-accurate con colores, tipografía, espaciado e interacciones finales. Implementar con máxima fidelidad al diseño. Los wireframes en `Fitness App Wireframes.html` son para referencia de flujo y estructura.

---

## Pantallas y especificaciones

### ① LOGIN

**`app/(auth)/login.tsx`**

Layout: fondo `#080808`, centrado verticalmente. Stack vertical con logo, botones sociales, separador, formulario email/password, link a forgot-password.

| Elemento | Especificación |
|----------|----------------|
| Logo | `FITCORE` — Space Grotesk 700, letter-spacing 6px, color `#CCFF00` |
| Subtítulo | 11px, color `#888`, letter-spacing 0.5px |
| Botones sociales | Glass card (`rgba(255,255,255,0.05)`) + border `rgba(255,255,255,0.09)`, border-radius 16, padding 12px 16px |
| Separador | `1px solid rgba(255,255,255,0.09)` + texto "o con email" color `#444` |
| Inputs | bg `rgba(255,255,255,0.04)`, border `rgba(255,255,255,0.09)`, radius 12, padding 11px 14px, font 15px |
| CTA principal | bg `#CCFF00`, color `#111`, border-radius 999, padding 13px, font 700 16px, shadow `0 0 20px #CCFF0044` |
| Link recovery | color `#CCFF00`, 13px |

Navegación: CTA → `(tabs)/index`, Google/Apple → OAuth flow → `(onboarding)/biometrics` o `(tabs)/index`

---

### ② ONBOARDING — OBJETIVO

**`app/(onboarding)/goal.tsx`**

Progress dots: 4 dots, dot activo = `#CCFF00` ancho 22px border-radius 2px, inactivos = `rgba(255,255,255,0.12)` 8px.

Opciones de objetivo (4 cards):

| Opción | Icono | Subtítulo |
|--------|-------|-----------|
| Perder grasa ✓ | 🔥 | Déficit calórico inteligente |
| Ganar músculo | 💪 | Superávit + proteína alta |
| Rendimiento | ⚡ | Fuerza y resistencia |
| Bienestar | 🧘 | Equilibrio y salud general |

Card activa: `glassNeon` (bg `rgba(204,255,0,0.07)`, border `rgba(204,255,0,0.35)`), checkmark `#CCFF00` con glow.
Card inactiva: `glass` standard.

---

### ③ DASHBOARD

**`app/(tabs)/index.tsx`**

Secciones verticales (ScrollView):

1. **Header** — Nombre usuario + avatar con badge de notificaciones (bg `#FF6B35`)
2. **Streak card** — Glass card con emoji 🔥, texto "X días de racha", 7 dots de días (completados = `#CCFF00` filled con glow, pendientes = `rgba(255,255,255,0.06)`)
3. **Activity rings** — 3 cards en row: Movimiento (`#CCFF00`), Ejercicio (`#FF6B35`), Hidratación (`#3DFFA0`). Ring SVG con stroke-dasharray/dashoffset. Tamaño 64px.
4. **Macros card** — Ring 90px + barras de progreso por macro. Calorías en `#CCFF00`, carbos en `#3DFFA0`, grasas en `#FF6B35`.
5. **Workout CTA** — `glassOrange`, flex-row con info rutina + botón circular play `#FF6B35`

Bottom nav: 5 items, activo en `#CCFF00` con glow `drop-shadow(0 0 6px #CCFF00)`.

---

### ④ WORKOUT ACTIVO + IA

**`app/workout/active.tsx`**

| Elemento | Especificación |
|----------|----------------|
| Timer | 64px font, weight 700, color `#CCFF00`, text-shadow `0 0 30px #CCFF0066` |
| Vista cámara | bg `#0d0d0d`, border `rgba(255,255,255,0.09)`, radius 16, height ~148px. Overlay con corner markers en `#CCFF00` (2px, 16px). |
| Badge IA activa | Pill: bg `#CCFF0018`, border `#CCFF0044`, radius 20, font 11px weight 600 |
| Alert postura | bg `rgba(255,107,53,0.15)`, border `#FF6B3566`, radius 8, color `#FF6B35`, posición absolute bottom |
| Rep dots | Círculos 26px: completados = `#CCFF00` filled + glow `#CCFF0066`, pendientes = `rgba(255,255,255,0.04)` |
| Accuracy % | Font 12px, color `#CCFF00` para el valor |
| CTA descanso | bg `#FF6B35`, shadow `0 0 20px #FF6B3544` |

Implementación IA pose: MediaPipe Pose en hilo separado, overlay React Native Skia para dibujar skeleton en tiempo real.

---

### ⑤ NUTRICIÓN

**`app/(tabs)/nutrition.tsx`**

Ring calórico: 90px, color `#CCFF00`. Texto interior: valor en kcal grande + "kcal" pequeño.

Barras de macros: height 4px, border-radius 10, con glow sutil. Proteína `#CCFF00`, carbos `#3DFFA0`, grasas `#FF6B35`.

Cards de comida (4: Desayuno, Almuerzo, Merienda, Cena):
- Completadas: opacity 1, muestra items con "·" prefix
- Pendientes: opacity 0.65, botón "+ Añadir" color `#FF6B35`

---

### ⑥ MODO DESPENSA

**`app/nutrition/pantry.tsx`**

Header: título en `#CCFF00` (no en `#F2F2F2`).

Items de ingredientes: glass card con nombre/cantidad a la izquierda, macros P/C/G a la derecha en colores respectivos.

Botón añadir: glass card con border dashed `#444`, texto centrado `#444`.

CTA generar recetas: bg `#CCFF00`, color `#111`, llamada a Claude API.

Receta resultado: `glassNeon`, pill "RECETA · 520 KCAL", dos botones: "Ver receta" (glass) + "Registrar" (bg `#CCFF00`).

---

### ⑦ POST-ENTRENO — RESUMEN

**`app/workout/summary.tsx`**

Header celebración: emoji 🎉 + título color `#CCFF00` + text-shadow glow.

3 stats en row (min / kcal / ejerc.): glass cards con número grande en color específico (`#CCFF00` / `#FF6B35` / `#3DFFA0`).

Card rendimiento IA: `glassNeon`, porcentaje 44px bold con glow, barra de progreso.

Card XP: gradient bg `rgba(204,255,0,0.08) → rgba(204,255,0,0.03)`, border `rgba(204,255,0,0.35)`.

CTAs: "Elongación guiada" (primary neon) + "Saltar" (ghost).

---

### ⑧ ELONGACIÓN GUIADA

**`app/workout/stretch.tsx`**

Estructura igual al workout activo pero sin timer grande. Vista de ilustración/cámara 148px.

Card ejercicio activo: `glassNeon`. Lista debajo con estados: done (opacity 0.45 + tachado), active (glassNeon + icono ▶), pending (glass + icono ○).

---

### ⑨ RECUPERACIÓN

**`app/workout/recovery.tsx`**

Score card: glass con Ring 80px color `#3DFFA0`, título + subtítulo.

4 cards de recomendación (hidratación/proteína/crioterapia/sueño): glass cards con icono en círculo tintado, título bold, cuerpo muted, pill de timing.

Colores de pills: teal/neon/azul/purple según tipo de recomendación.

---

### ⑩ PERFIL

**`app/(tabs)/profile.tsx`**

Avatar: 72px círculo con border 2px `#CCFF00` + glow `0 0 20px #CCFF0033`.

Stats en row: 3 glass cards.

Biométricos: glass card con 4 valores en row.

Goal progress: `glassNeon` con barra de progreso.

Menu items: glass cards con icono + label + chevron `›`.

---

### ⑪ LOGROS & LIGA

**`app/(tabs)/progress.tsx`**

Level card: gradient bg + border `rgba(204,255,0,0.35)`, emoji 🏆, texto nivel en `#CCFF00`, XP bar.

Achievement rows: glass cards, completadas con icono en bg `#CCFF0018` + star `#CCFF00` con glow. Incompletas con opacity 0.7 + mini progress bar.

Liga rows: bg `#CCFF000d` + border `rgba(204,255,0,0.35)` para "Tú". Posición 1 en `#FFD700`.

---

## Interacciones y animaciones

| Interacción | Especificación |
|-------------|----------------|
| Tap buttons | `scale(0.97)` + opacity 0.9, duration 100ms |
| Cards appear | Fade-in + translateY(12px→0), duration 300ms, stagger 60ms por card |
| Progress bars | Width animada desde 0%, duration 600ms, easing `ease-out` |
| Rings | stroke-dashoffset animado desde `circ` a valor final, duration 800ms |
| Streak dots | Pop scale(0→1.2→1), stagger 80ms |
| Rep counter | Cada dot: scale pop al completar rep |
| Workout timer | useInterval cada 1s, color pulsa al llegar a 0 |

---

## Design Tokens completos

```ts
// Shadows con glow neon
export const shadows = {
  neon:   { shadowColor: '#CCFF00', shadowOffset: {width:0,height:0}, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8 },
  orange: { shadowColor: '#FF6B35', shadowOffset: {width:0,height:0}, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8 },
  card:   { shadowColor: '#000',    shadowOffset: {width:0,height:8}, shadowOpacity: 0.4, shadowRadius: 20, elevation: 12 },
};
```

---

## Assets y fuentes

- **Fuente:** `@expo-google-fonts/space-grotesk` (weights: 400, 500, 600, 700)
- **Iconos:** `expo-vector-icons` (Ionicons o MaterialCommunityIcons)
- **Imágenes:** placeholder hasta tener assets reales — usar `View` tintado con border dashed
- **Videos ejercicios:** Cloudinary o Supabase Storage

---

## Archivos en este bundle

| Archivo | Tipo | Descripción |
|---------|------|-------------|
| `FITCORE Mockup.html` | Hi-fi mockup | Fuente de verdad visual — todas las pantallas |
| `fitcore-screens.jsx` | Componentes | Design system completo en React/HTML |
| `Fitness App Wireframes.html` | Wireframes | Flujo completo de todas las pantallas |
| `CLAUDE.md` | Contexto | Arquitectura, tokens, modelos de datos, convenciones |
| `design-canvas.jsx` | Infra | Canvas interactivo (solo para el mockup, no para producción) |

---

## Top 5 skills para trabajar con Claude Code en este proyecto

Basado en las mejores prácticas actuales:

### 1. 🗺️ Plan Mode antes de implementar
> *"Separate research and planning from implementation"* — Claude Code Docs

Antes de cualquier pantalla nueva: `Shift+Tab` dos veces para entrar en Plan Mode. Pedir a Claude que lea `CLAUDE.md` + los archivos de diseño, proponga el árbol de componentes y el approach antes de escribir una sola línea. Confirmar el plan antes de ejecutar.

```
Prompt: "Lee CLAUDE.md y FITCORE Mockup.html. Estoy implementando app/(tabs)/index.tsx (Dashboard). 
Propón el árbol de componentes, los hooks necesarios y el approach de animaciones. 
No escribas código hasta que confirme el plan."
```

### 2. 📋 CLAUDE.md como fuente de verdad
> *"A good rule: if a new developer would need to know it, put it in CLAUDE.md"* — AgentsRoom

El `CLAUDE.md` de este proyecto ya incluye: tokens de color, tipografía, arquitectura de carpetas, modelos de datos y convenciones. Mantenerlo actualizado después de cada feature. Claude lo lee en cada sesión automáticamente.

```
Prompt: "Después de implementar la pantalla X, actualiza CLAUDE.md con los 
patrones nuevos que usaste (hooks, componentes reutilizables, etc.)"
```

### 3. 🎯 Prompts con referencias a archivos específicos
> *"Reference specific files, mention constraints, and point to example patterns"* — Claude Code Docs

Siempre referenciar el archivo de diseño y el archivo destino. Incluir restricciones explícitas.

```
Prompt: "@FITCORE Mockup.html @fitcore-screens.jsx 
Implementa el componente <Ring> de fitcore-screens.jsx en React Native con Skia. 
Constraints: no usar librerías externas de charts, usar Reanimated 3 para la animación."
```

### 4. 🔨 Commits frecuentes por componente
> *"Commit early and often with meaningful messages"* — Best Practices consensus

Pedir a Claude que haga commit después de cada componente funcional, no después de toda una pantalla.

```
Prompt: "Implementa el componente GlassCard base. Cuando funcione y los tests pasen, 
haz commit con mensaje 'feat: add GlassCard base component with blur support'."
```

### 5. 🤖 Sub-agentes especializados por dominio
> *"Split work: one agent for the API, one for the frontend, one for tests"* — AgentsRoom

Para este proyecto, separar las sesiones por dominio:
- **Sesión UI:** solo pantallas React Native + design system
- **Sesión Backend:** solo Supabase schema + RLS + Edge Functions
- **Sesión IA:** solo integración MediaPipe + Claude API (Modo Despensa)
- **Sesión Tests:** solo unit tests + E2E con Detox

```
# Sesión Backend
Prompt: "Contexto: solo trabajamos en el backend hoy. 
Lee CLAUDE.md sección 'Modelos de datos'. 
Crea el schema SQL completo en Supabase con RLS policies para la tabla food_log."
```

---

*Generado con Claude Projects — Design Handoff FITCORE v1.0*
