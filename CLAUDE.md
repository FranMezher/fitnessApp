# FITCORE — CLAUDE.md
> Contexto completo de la app para Claude Code. Lee esto antes de tocar cualquier archivo.

---

## ¿Qué es FITCORE?

App móvil de fitness integral para **entrenamiento en casa**. Tres pilares:
1. **Nutrición** — tracking diario de macros y calorías
2. **Entrenamiento** — rutinas con corrección de postura por IA
3. **Motivación** — gamificación, racha y liga social

**Target:** Usuarios 20–35 años que entrenan en casa, sin equipo o con equipo básico. app android y ios 

---

## Stack tecnológico recomendado

```
Frontend:     React Native + Expo
Navigation:   Expo Router (file-based)
State:        Zustand + React Query
Backend:      Supabase (auth + db + storage)
AI/ML:        MediaPipe (pose detection) + Claude API (recetas/insights)
Notificaciones: Expo Notifications
Animaciones:  Reanimated 3 + Skia
```

---

## Design System — Tokens

```ts
// colors.ts
export const colors = {
  bg:           '#080808',
  surface:      'rgba(255,255,255,0.05)',
  surfaceHover: 'rgba(255,255,255,0.08)',
  border:       'rgba(255,255,255,0.09)',
  borderAccent: 'rgba(204,255,0,0.35)',
  neon:         '#CCFF00',   // acento primario — energía
  orange:       '#FF6B35',   // CTAs de acción / alertas
  teal:         '#3DFFA0',   // salud / recuperación / hidratación
  purple:       '#B388FF',   // gamificación / niveles
  text:         '#F2F2F2',
  muted:        '#888888',
  dim:          '#444444',
};

// glass card — usar en todas las cards
export const glass = {
  backgroundColor: colors.surface,
  borderWidth: 1,
  borderColor: colors.border,
  borderRadius: 16,
  // iOS: blurRadius via @react-native-community/blur
  // Android: fallback a surface solid
};

export const glassNeon = {
  ...glass,
  backgroundColor: 'rgba(204,255,0,0.07)',
  borderColor: colors.borderAccent,
};

export const glassOrange = {
  ...glass,
  backgroundColor: 'rgba(255,107,53,0.08)',
  borderColor: 'rgba(255,107,53,0.3)',
};
```

```ts
// typography.ts — fuente: Space Grotesk
export const text = {
  hero:    { fontSize: 32, fontWeight: '700', fontFamily: 'SpaceGrotesk_700Bold' },
  title:   { fontSize: 22, fontWeight: '700', fontFamily: 'SpaceGrotesk_700Bold' },
  heading: { fontSize: 18, fontWeight: '700', fontFamily: 'SpaceGrotesk_700Bold' },
  body:    { fontSize: 15, fontWeight: '400', fontFamily: 'SpaceGrotesk_400Regular' },
  label:   { fontSize: 11, fontWeight: '600', fontFamily: 'SpaceGrotesk_600SemiBold', letterSpacing: 1.2, textTransform: 'uppercase' },
  caption: { fontSize: 12, fontWeight: '400', fontFamily: 'SpaceGrotesk_400Regular' },
};
```

```ts
// spacing.ts
export const spacing = {
  xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32,
};

export const radius = {
  sm: 8, md: 12, lg: 16, xl: 24, full: 999,
};
```

---

## Arquitectura de pantallas (Expo Router)

```
app/
├── (auth)/
│   ├── login.tsx           ← Login con email/Google/Apple
│   ├── register.tsx        ← Registro rápido
│   └── forgot-password.tsx ← Recuperar acceso
│
├── (onboarding)/
│   ├── biometrics.tsx      ← Paso 1: datos biométricos
│   ├── goal.tsx            ← Paso 2: objetivo (perder grasa / músculo...)
│   ├── activity.tsx        ← Paso 3: nivel de actividad
│   └── plan.tsx            ← Paso 4: resumen del plan generado
│
├── (tabs)/
│   ├── index.tsx           ← Dashboard principal
│   ├── train.tsx           ← Entrenamiento — lista de ejercicios
│   ├── nutrition.tsx       ← Tracker nutricional
│   ├── progress.tsx        ← Gamificación + liga
│   └── profile.tsx         ← Perfil + ajustes
│
├── workout/
│   ├── [id].tsx            ← Detalle de rutina
│   ├── active.tsx          ← Sesión activa (cámara + IA)
│   ├── summary.tsx         ← Resumen post-entreno
│   ├── stretch.tsx         ← Elongación guiada
│   └── recovery.tsx        ← Protocolo de recuperación
│
├── nutrition/
│   ├── pantry.tsx          ← Modo Despensa (ingredientes → recetas IA)
│   └── meal/[id].tsx       ← Detalle de comida
│
└── profile/
    ├── edit.tsx            ← Editar datos personales
    └── settings.tsx        ← Ajustes y notificaciones
```

---

## Flujos principales

### 1. Onboarding (primer uso)
```
Splash → Login/Registro → Biométricos → Objetivo → Nivel actividad → Plan generado → Dashboard
```

### 2. Sesión de entrenamiento
```
Dashboard (tap CTA) → Detalle rutina → Sesión activa (cámara IA) → Descanso → ... → Resumen → Elongación → Recuperación → Dashboard
```

### 3. Registro de comida
```
Nutrición → Tap comida → Buscar alimento / Escanear / Modo Despensa → Confirmar → Nutrición actualizada
```

### 4. Modo Despensa (innovación)
```
Nutrición → Modo Despensa → Añadir ingredientes → [Claude API] Generar recetas → Ver receta / Registrar
```

---

## Modelos de datos principales (Supabase)

```sql
-- Usuario
users (id, email, name, avatar_url, created_at)
profiles (user_id, weight_kg, height_cm, age, sex, goal, activity_level, target_weight_kg)

-- Entrenamiento
workout_plans (id, name, days_per_week, difficulty)
workout_sessions (id, user_id, plan_id, started_at, ended_at, calories_burned, form_accuracy_pct)
exercises (id, name, muscle_group, instructions, video_url)
session_sets (id, session_id, exercise_id, reps_completed, reps_target, series_num)

-- Nutrición
food_log (id, user_id, date, meal_type, food_name, calories, protein_g, carbs_g, fat_g)
pantry_items (id, user_id, food_name, quantity, unit, protein_g, carbs_g, fat_g)

-- Gamificación
streaks (user_id, current_streak, longest_streak, last_activity_date)
achievements (id, name, description, icon, xp_reward)
user_achievements (user_id, achievement_id, unlocked_at)
league_entries (user_id, week_start, xp_total, rank)
```

---

## 3 Funciones innovadoras — Implementación

### 🤸 Corrección de postura por IA (`workout/active.tsx`)
- Usar **MediaPipe Pose** via `@mediapipe/pose` o `expo-camera` + modelo ONNX
- Detectar keypoints del esqueleto en tiempo real
- Comparar ángulos articulares contra rangos óptimos por ejercicio
- Contar repeticiones automáticamente (valle-a-pico en eje Y de muñeca/rodilla)
- Mostrar overlay SVG del esqueleto + alert de corrección

```ts
// Estructura de corrección
interface PoseFeedback {
  repCount: number;
  accuracy: number;        // 0-100%
  alert?: string;          // e.g. "Codos demasiado abiertos"
  alertSeverity: 'warning' | 'error';
}
```

### 🍽️ Modo Despensa (`nutrition/pantry.tsx`)
- Usuario añade ingredientes disponibles (manual o escaneo de barcode)
- Llamada a Claude API con lista de ingredientes + perfil nutricional del usuario
- Claude genera 3 recetas que encajan en los macros restantes del día
- Usuario puede registrar la receta directamente en el food_log

```ts
// Prompt para Claude API
const pantryPrompt = `
Tengo estos ingredientes: ${ingredients.join(', ')}.
Mi objetivo nutricional restante hoy: ${remainingMacros}.
Genera 3 recetas simples con nombre, instrucciones breves, 
tiempo de preparación y macros estimados. Responde en JSON.
`;
```

### 🏆 Liga semanal gamificada (`progress.tsx`)
- XP se otorga por: completar entreno (+100), racha (+20/día), precisión >80% (+30), log comidas (+10/comida)
- Liga semanal: top 10 usuarios del círculo social del usuario
- Logros desbloqueables con thresholds predefinidos
- Notificaciones push al desbloquear logro o cambiar posición en liga

---

## Sistema de retención — Notificaciones 7 días

```ts
const retentionNotifications = [
  { day: 1, time: '08:00', title: '¡Bienvenido a FITCORE! ⚡', body: 'Tu plan está listo. Primer entreno en 30 min.' },
  { day: 2, time: '09:00', title: 'Racha de 2 días 🔥', body: '¡No la rompas hoy!' },
  { day: 3, time: '17:00', title: 'Hora de entrenar ⏰', body: 'Tu rutina Upper Body te espera. 38 min.' },
  { day: 4, time: '10:00', title: '¡Logro desbloqueado! 🏆', body: '"Sin excusas" — 3 entrenos completados.' },
  { day: 5, time: '20:00', title: 'Tu resumen semanal 📊', body: 'Revisa tu progreso de esta semana.' },
  { day: 6, time: '13:00', title: 'Registra tu comida 🍽️', body: 'Te faltan calorías para cerrar el día bien.' },
  { day: 7, time: '09:00', title: '¡1 semana completa! ⚡', body: 'Eres top 15% en tu liga. ¡Sigue así!' },
];
```

---

## Convenciones de código

- **Componentes:** PascalCase, un componente por archivo
- **Hooks:** camelCase con prefijo `use` (e.g. `useWorkoutSession`)
- **Stores Zustand:** un store por dominio (`useAuthStore`, `useNutritionStore`, `useWorkoutStore`)
- **Tipos:** siempre TypeScript, interfaces > types para objetos, types para unions
- **Estilos:** StyleSheet.create al final del archivo, nunca inline en JSX (excepto valores dinámicos)
- **Commits:** Conventional Commits (`feat:`, `fix:`, `chore:`, `refactor:`)

---

## Archivos de referencia de diseño

| Archivo | Descripción |
|---------|-------------|
| `FITCORE Mockup.html` | Mockup hi-fi completo — fuente de verdad visual |
| `fitcore-screens.jsx` | Componentes del design system (tokens, primitivos, pantallas) |
| `Fitness App Wireframes.html` | Wireframes de flujo completo (baja fidelidad) |

> ⚠️ Los archivos HTML son **referencias de diseño**, no código de producción. Recrear en React Native respetando el design system definido arriba.

---

## Comandos útiles

```bash
# Setup
npx create-expo-app fitcore --template tabs
cd fitcore && npx expo install expo-router expo-camera expo-notifications

# Dev
npx expo start
npx expo start --ios
npx expo start --android

# Tests
npx jest --watchAll
npx tsc --noEmit  # type check

# Build
eas build --platform ios --profile preview
eas build --platform android --profile preview
```
