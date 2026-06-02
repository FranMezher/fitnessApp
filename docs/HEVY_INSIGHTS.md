# HEVY_INSIGHTS.md — Aprendizajes de Hevy para FitCore

> Documento de referencia para Claude Code. Patrones de producto, UX, marketing
> y arquitectura observados en Hevy (hevyapp.com) para aplicar —con criterio
> propio— a FitCore, que ya está programado.
>
> ⚠️ Aprendizajes de DISEÑO, no contenido a copiar. El catálogo de ejercicios y
> rutinas de FitCore debe construirse desde fuentes propias/abiertas, nunca
> extrayendo datos de Hevy (su API es por-usuario y solo para Hevy Pro).

---

## 0. Contexto de FitCore (CONFIRMADO)
- **Público:** personas que **entrenan en gimnasio Y además hacen deporte o
  actividad física al aire libre** (running, ciclismo, natación, senderismo,
  deportes de equipo, etc.). Público **multimodal: fuerza + cardio/outdoor.**
- **Pilares:** Nutrición con IA · Rutinas/Entrenos · Progreso real · Grupos.
- **Marca:** SIN gamificación (sin puntos, niveles ni ligas). Datos reales.
- **NO es:** ni "solo gym" (como Hevy) ni "entrenar en casa".

### Implicancia estratégica clave (el hueco frente a Hevy)
Hevy SOLO cubre entrenamiento de fuerza en gym. **No registra actividad
outdoor ni deportes.** FitCore debe ser explícitamente el lugar donde conviven
**el levantamiento de pesas Y la actividad deportiva/al aire libre**, todo con
una capa de nutrición. Ese es el diferenciador central de producto y marketing.

---

## 1. Principio rector: "simplicidad con profundidad"
Hevy ofrece muchas features pero las agrupa en 3 pilares mentales (logging,
progreso, social). Lección: pocos pilares, mucha profundidad dentro de cada uno.

**FitCore:** mantener los 4 pilares como columna vertebral. Toda feature nueva
debe colgar de uno; si no encaja, cuestionarla.

---

## 2. Features de PRODUCTO (priorizadas para público multimodal)

### Entrenamiento de fuerza (gym) — paridad con Hevy
- Rest timer automático con notificación.
- Tipos de set: normal, warmup, drop, failure.
- **"Previous values"**: mostrar lo de la última vez (peso/reps). Alto impacto.
- Supersets y agrupación de ejercicios.
- Notas por ejercicio.
- Calculadoras útiles: 1RM, RPE, discos, warm-up.
- Modo rutina guiada + "empezar entreno vacío".

### Actividad outdoor / deportes — ⚠️ AQUÍ FITCORE GANA (Hevy no lo tiene)
- **Registrar sesiones de cardio/deporte**: running, ciclismo, natación,
  caminata, deportes de equipo, etc. (tipo de actividad, duración, distancia).
- **GPS / tracking de recorrido** (al menos distancia, ritmo, tiempo).
- **Integración con Apple Health / Google Fit / wearables** para importar
  actividad, FC y calorías sin doble carga.
- **Vista unificada**: un mismo calendario/historial que mezcle entrenos de
  fuerza Y sesiones de deporte. Que el usuario vea "su semana completa".
- Evaluar integración con **Strava** (Hevy la usa solo para compartir; FitCore
  puede usarla para importar actividad outdoor real).

### Progreso (encaja con "progreso real")
- Gráficos por ejercicio (peso/volumen) + PRs con notificación.
- Medidas corporales + fotos de progreso.
- Streak/consistencia (sin convertirlo en competencia).
- Volumen por grupo muscular / sets por semana.
- **Métricas mixtas**: que el progreso combine fuerza (PRs, volumen) con
  rendimiento outdoor (distancia semanal, ritmo, tiempo activo). Diferenciador.
- "Year in Review" / reporte mensual como re-engagement y contenido compartible.

### Social (⚠️ adaptar a filosofía anti-competencia)
- Hevy: feed, leaderboards, comparación de stats. **FitCore NO copia rankings.**
- Mantener "muro de apoyo" del grupo, compartir rutinas/recetas, comentar.
  La postura "solo apoyo, sin competir" es un activo de marca: protegerla.

### Nutrición — territorio propio (Hevy no tiene nada)
- IA por foto/texto (calorías + macros). Empujar como diferenciador #1.
- Modo Despensa (recetas según ingredientes y macros del día).
- Objetivos calculados por biometría + meta. ⚠️ Ajustar objetivos según gasto
  por actividad (un día de gym + 10 km de running ≠ un día sedentario).
- Agua y macros por comida.

### Tech moderno (bajo esfuerzo, alto engagement)
- Asistente IA. Widgets de home screen. Live Activity (iOS).
- Apple Watch / WearOS con modo offline — especialmente útil para outdoor.

---

## 3. UX / Onboarding
- Onboarding <2 min que calcula objetivos (calorías, macros, plan) según
  biometría, meta **y nivel/tipo de actividad** (gym + deporte).
- Sync incremental (ver sección 5) para caché local sin refetch — clave para
  uso offline en gym y al aire libre.
- Minimizar fricción en las acciones críticas: registrar comida (IA),
  registrar entreno de fuerza y registrar/importar sesión outdoor.

---

## 4. MARKETING y LANDING

### Posicionamiento (titular sugerido)
Comunicar la dualidad: p. ej. *"Levantás y también salís a entrenar. Una sola
app para todo: gym, deporte y nutrición."* Dejar claro lo que Hevy no puede:
fuerza + outdoor + nutrición en un solo lugar, con progreso real.

### Prueba social (mayor brecha actual de FitCore)
- Hevy: "13M+ atletas", "4.9 en ambas stores (467k+ ratings)", logos "Featured
  on", reseñas 5★ repetidas.
- FitCore (honesto): ratings reales de stores, nº real de usuarios/descargas,
  testimonios concretos con resultados. Nunca inventar cifras.

### Estructura de landing recomendada
1. Hero con propuesta dual (gym + deporte) + mockup en acción.
2. **IA de nutrición como diferenciador #1** (demo foto→macros).
3. **Bloque "fuerza + actividad outdoor unificadas"** (lo que Hevy no hace).
4. Bloques por pilar: Rutinas/Entrenos · Progreso · Grupos.
5. "En 3 pasos" (onboarding).
6. Prueba social fuerte.
7. FAQ + CTA descarga.

### SEO / contenido (Hevy invierte muchísimo)
Apuntar a keywords del público multimodal, no solo gym:
- Gym: "registrar entrenamientos", "rutina de fuerza", "app de gimnasio".
- Outdoor/deporte: "app para correr y hacer pesas", "seguir running y gym",
  "entrenamiento híbrido (hybrid training)", "fuerza y resistencia".
- Nutrición: "contar macros con foto", "calorías según actividad".
- Crear guías ("cómo combinar fuerza y cardio", "hybrid athlete", planes mixtos).
El blog SEO es el canal de adquisición orgánica que una app sola no tiene.

### Doble público / vertical de negocio
- Hevy separa B2C (Hevy App) y B2B (Hevy Coach, software para entrenadores).
- Oportunidad FitCore: vertical "FitCore para coaches/entrenadores" (gym +
  preparadores de running/triatlón). Mercado grande en LATAM. Exige versión web.

---

## 5. ARQUITECTURA DE DATOS / API (molde de diseño, no datos)

Modelo de dominio de Hevy como referencia:

| Entidad              | Rol                                                       |
|----------------------|-----------------------------------------------------------|
| `exercise_templates` | Plantilla base de ejercicio, reutilizable. Permite custom.|
| `routines`           | Rutina = combinación de templates.                        |
| `routine_folders`    | Agrupación/orden de rutinas.                              |
| `workouts`           | Instancia ejecutada de una rutina (sets/reps/peso).       |
| `exercise_history`   | Historial por template (gráficos y PRs).                  |
| `body_measurements`  | Mediciones corporales.                                    |
| `user/info`          | Perfil del usuario.                                       |

**Patrones a replicar en el backend de FitCore:**
- Separar **plantilla de ejercicio** (catálogo) de **instancia ejecutada**.
- Permitir ejercicios/rutinas custom además del catálogo base.
- **Endpoint de sync incremental por eventos** (estilo `/workouts/events`).
- Auth con API key/token por usuario si se abre API pública. Paginación.

**Extender el modelo con lo propio de FitCore (Hevy NO lo tiene):**
- ⚠️ **`activity_sessions`**: sesiones de deporte/outdoor (tipo, duración,
  distancia, ritmo, ruta GPS, FC, calorías). Unificar con workouts en un
  historial/calendario común.
- ⚠️ Integraciones de importación (Apple Health / Google Fit / Strava).
- ⚠️ Entidades de **nutrición** (comidas, macros, agua, recetas/Modo Despensa).
- ⚠️ Entidades de **grupos** (membresías, muro diario, invitación por código).

**Fuentes legales para poblar el catálogo de ejercicios:**
- Free Exercise DB (open-source, con imágenes e instrucciones).
- wger (open-source + API + base de ejercicios).
- Datasets de dominio público / licencia abierta + contenido propio.

---

## 6. VERSIÓN WEB — viabilidad
- Hevy tiene web app (móvil-first + web complementaria: patrón validado).
- **Web sirve para:** planificar rutinas, analizar progreso (fuerza + outdoor)
  en pantalla grande, gestionar nutrición/recetas y grupos, SEO y prueba sin
  instalar (mejora conversión).
- **Queda en móvil:** ejecutar entreno, registro de comida por foto IA,
  tracking GPS de actividad outdoor.
- **Orden sugerido:** (1) landing web con contenido/SEO; (2) web app completa,
  prioritaria si se encara la vertical de coaches.
- **Requisito:** API/backend bien diseñada (sección 5) para app y web compartidas.

---

## 7. Checklist accionable para Claude Code
- [ ] Confirmar copy de posicionamiento dual (gym + deporte) en la landing.
- [ ] Auditar qué features de la sección 2 ya existen en el código.
- [ ] Implementar/validar "previous values" en logging de fuerza.
- [ ] Implementar rest timer + tipos de set.
- [ ] ⚠️ Implementar registro de sesiones outdoor/deporte (`activity_sessions`).
- [ ] ⚠️ Integrar importación Apple Health / Google Fit / Strava.
- [ ] ⚠️ Unificar fuerza + outdoor en un historial/calendario común.
- [ ] Ajustar objetivos de nutrición según gasto por actividad.
- [ ] Reporte periódico (mensual/anual) como re-engagement.
- [ ] Separar template vs instancia en el modelo de datos.
- [ ] Endpoint de sync incremental por eventos.
- [ ] Reforzar prueba social real en la landing.
- [ ] Subir la IA de nutrición al hero como diferenciador #1.
- [ ] Plan de contenido/SEO para público híbrido (fuerza + resistencia).
- [ ] Roadmap de versión web (landing primero).
- [ ] Mantener postura anti-gamificación (NO leaderboards/rankings).
