# FITCORE — Checklist de Push Notifications

> Estado al 2026-06-01. Marca ✅ a medida que avances.
> Objetivo: notificaciones funcionando y aprobables en **Play Store** y **App Store**.

---

## 1. Código (✅ ya implementado en este commit)

- [x] `expo-notifications` + `expo-device` instalados (SDK 54).
- [x] `lib/notifications.ts` — handler en foreground, canal Android, permisos, secuencia de retención de 7 días (local), registro de Expo push token, toggle on/off.
- [x] Plugin `expo-notifications` en `app.json` (color de marca `#CCFF00`).
- [x] Secuencia de retención se agenda al terminar el onboarding (`app/(onboarding)/plan.tsx`).
- [x] `registerForPush()` se llama al restaurar sesión (`app/_layout.tsx`).
- [x] Toggle de notificaciones en Ajustes (`app/profile/settings.tsx`).
- [x] Backend: tabla `push_tokens` + endpoint `POST /profile/push-token`.
- [x] Migración `supabase/migrations/20260601_push_tokens.sql`.

---

## 2. Pasos pendientes ANTES de testear

- [ ] **Aplicar la migración** en Supabase:
  ```bash
  # opción A: SQL editor de Supabase → pegar 20260601_push_tokens.sql
  # opción B: backend/ con drizzle (si usás drizzle como fuente de verdad)
  cd backend && npm run db:generate && npm run db:migrate
  ```
- [ ] **Ícono de notificación Android** (requisito visual): PNG blanco transparente 96×96.
  Guardalo en `assets/notification-icon.png` y referencialo en el plugin:
  ```json
  ["expo-notifications", { "icon": "./assets/notification-icon.png", "color": "#CCFF00" }]
  ```
  Sin esto, Android muestra un cuadrado blanco.
- [ ] **Development build** (las notifs NO funcionan en Expo Go en SDK 53+):
  ```bash
  eas build --profile development --platform android
  eas build --profile development --platform ios
  ```

---

## 3. Android / Play Store (FCM)

- [ ] Crear proyecto en **Firebase Console** → agregar app Android (`com.fitcore.app`).
- [ ] Descargar `google-services.json`.
- [ ] Subir credencial FCM V1 a EAS:
  ```bash
  eas credentials   # Android → Push Notifications (FCM V1) → subir el JSON de service account
  ```
- [ ] En Play Console, el permiso `POST_NOTIFICATIONS` (Android 13+) ya lo agrega el plugin. Verificar en el manifest del build.
- [ ] Data safety form: declarar que se recopilan tokens de push si aplica.

## 4. iOS / App Store (APNs)

- [ ] Cuenta **Apple Developer** activa ($99/año).
- [ ] EAS gestiona el APNs key automáticamente:
  ```bash
  eas credentials   # iOS → Push Notifications → dejar que EAS genere el APNs key
  ```
- [ ] Entitlement `aps-environment` lo inyecta el plugin en el build de producción.
- [ ] En la ficha de App Store: si usás notifs, suele bastar con el flujo estándar (no requiere descripción especial salvo que mandes marketing → entonces sí declarar).

---

## 5. UX / cumplimiento de tiendas

- [ ] **No pedir permiso al primer arranque a quemarropa.** Hoy se pide al terminar onboarding (buen momento, ya hay contexto). Ambas tiendas penalizan el prompt sin contexto.
- [ ] Toggle para desactivar (✅ ya está en Ajustes) — requerido de facto por Apple.
- [ ] Respetar el rechazo: si el user niega permisos, no insistir; ofrecer link a Ajustes del sistema.
- [ ] Notificaciones de retención = informativas/útiles, no spam (✅ 7 en 7 días).

---

## 6. Server-driven push (fase 2 — opcional para MVP)

La infraestructura de token ya está (`push_tokens` + endpoint). Falta el emisor:

- [ ] Endpoint/cron backend que envíe a la **Expo Push API** (`https://exp.host/--/api/v2/push/send`).
- [ ] Disparadores: cambio de puesto en liga, logro desbloqueado, racha en riesgo.
- [ ] Manejar tickets/receipts de Expo y limpiar tokens `DeviceNotRegistered`.

---

## 7. Testing manual (dev build en dispositivo real)

- [ ] Terminar onboarding → confirmar que se agenda la secuencia (log o `getAllScheduledNotificationsAsync`).
- [ ] Cambiar la hora del dispositivo para disparar una notif local.
- [ ] Foreground: la notif aparece como banner.
- [ ] Toggle OFF en Ajustes → `cancelAllNotifications` limpia la cola.
- [ ] Login en device real → `push_tokens` recibe una fila.
