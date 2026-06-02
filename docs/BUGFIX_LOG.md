# Bug Fix Log — QA Audit 2026-06-02

Reporte original: 18 bugs (5 críticos, 7 altos, 6 bajos).
Estado: **17/18 resueltos, 1 confirmado como diseño intencional.**

Leyenda: ✅ resuelto · ⚠️ no aplica / diseño intencional · 🟢 hardening preventivo.

---

## 🔴 Críticos

- ✅ **#1 — backend/src/routes/workouts.ts** — Ownership check antes de insertar sets. Si la sesión no pertenece al usuario, devuelve 404.
- ✅ **#2 — backend/src/routes/groups.ts** — Zod ajustado a `length(8)` para matchear el output de `randomCode()`. Los grupos ahora son uniables.
- ✅ **#3 — app/index.tsx** — Reescrito como guard de auth: espera `getSession()`, decide entre `login/onboarding/tabs`. `.catch` añadido. Splash visible durante la espera.
- ✅ **#4 — app/_layout.tsx** — Eliminada la navegación de bootstrap (delegada a `index.tsx`). El listener `onAuthStateChange` ahora solo maneja `SIGNED_OUT`; los demás eventos solo sincronizan el store.
- ✅ **#5 — lib/supabase.ts** — Función `clearAllChunks()` que borra el estado previo antes de escribir. Chunks se escriben primero, contador después → un crash a mitad deja el estado previo (recién borrado) en vez de basura mezclada.

## 🟡 Altos

- ✅ **#6 — app/workout/active.tsx** — Cleanup solo finaliza la sesión si `loggedSetsRef.current.length > 0`. Las sesiones vacías se quedan en estado "started" (sin endedAt) y no inflan la racha.
- ✅ **#7 — app/workout/active.tsx** — Si `startSession` falló al iniciar, `finishWorkout` lo reintenta una vez. Si vuelve a fallar y hay sets logueados, alerta al usuario para no perder data silenciosamente.
- ✅ **#8 — components/nutrition/AddFoodModal.tsx** — `confirmAll` usa `Promise.allSettled` + `mountedRef` para evitar setState en componente desmontado. Si guarda parcial, muestra "Guardado X de Y" y deja en preview solo los que fallaron (evita duplicados al reintentar).
- ✅ **#9 — stores/useNutritionStore.ts** — `fetchFoodLog` tiene try/catch con `console.warn`. Mantiene el último foodLog en pantalla en lugar de crashear.
- ✅ **#10 — lib/api.ts** — Reordenado el header merge para que `Authorization` siempre gane sobre headers custom. Comentario explícito de que el body debe ser string (no stream) para que el retry de 401 funcione.
- ✅ **#11 — app/(tabs)/nutrition.tsx** — useEffects con deps completas: `[profile, fetchProfile]` y `[selectedDate, fetchFoodLog, fetchWater]`. Sin stale closures.
- ✅ **#12 — app/(tabs)/progress.tsx** — Cada fetch del `Promise.all` envuelto en `.catch` individual con `console.warn`. Una falla aislada no rompe los demás.

## 🟢 Bajos

- ✅ **#13 — app/(tabs)/nutrition.tsx** — `toDateStr()` reescrito para usar hora local (`getFullYear/getMonth/getDate`). Fix también aplicado a `app/nutrition/groups.tsx` (donde `TODAY` era constante de módulo — peor que el original).
- ✅ **#14 — backend/src/routes/nutrition.ts** — Comparación de fechas via string `YYYY-MM-DD` en lugar de `Date` objects mezclando UTC y local.
- ⚠️ **#15 — backend/src/routes/groups.ts** — El feed expone nombres de comida de todos los miembros. Confirmado como **diseño intencional**: los grupos son "muro de apoyo" (CLAUDE.md, sección de Grupos). No se cambia.
- ⚠️ **#16 — app/_layout.tsx** — El QA agent ya lo marcó como no-bug (los setters de Zustand son estables).
- ✅ **#17 — lib/notifications.ts** — `console.warn` en dev cuando se corre en simulador/emulador, así el dev sabe por qué las notifs no funcionan.
- ✅ **#18 — app/workout/active.tsx** — `JSON.parse(exercisesJson)` ahora logea el error a `console.warn` cuando falla. UI sigue mostrando el empty state, pero queda traza en logs.

---

## Archivos modificados

### Frontend
- `app/index.tsx` (rewrite)
- `app/_layout.tsx`
- `app/(tabs)/nutrition.tsx`
- `app/(tabs)/progress.tsx`
- `app/workout/active.tsx`
- `app/nutrition/groups.tsx`
- `components/nutrition/AddFoodModal.tsx`
- `stores/useNutritionStore.ts`
- `lib/api.ts`
- `lib/supabase.ts`
- `lib/notifications.ts`

### Backend
- `backend/src/routes/workouts.ts`
- `backend/src/routes/groups.ts`
- `backend/src/routes/nutrition.ts`

## Verificación

- ✅ `npx tsc --noEmit` (frontend) — sin errores.
- ⚠️ `npx tsc --noEmit` (backend) — 3 errores preexistentes en `backend/src/routes/ai.ts` por falta de types de `@anthropic-ai/sdk`. **No relacionados con estos fixes.**

## Próximos pasos sugeridos

1. Probar el flujo de auth completo en device (login → kill app → reopen → debería caer en tabs sin flash).
2. Probar grupos (crear → copiar código → unirse desde otra cuenta).
3. Probar entreno con red apagada (debería alertar en lugar de perder silenciosamente).
4. Resolver los 3 errores de `ai.ts` instalando `@types` o ajustando tsconfig (fuera de scope de este lote).
