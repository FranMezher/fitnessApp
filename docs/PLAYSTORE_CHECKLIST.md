# Play Store Release Checklist — FITCORE

Estado actual del proyecto auditado contra los requisitos de Google Play.
Existe también `FITCORE-PlayStore-Checklist.html` en la raíz con más detalle visual; este doc es la versión markdown actualizada y reducida.

Leyenda: ✅ hecho · 🟡 parcial · ❌ falta · ❓ confirmar manualmente.

---

## 1. Backend / Infra

- ✅ Backend deployado en Vercel (`fitnessapp-ebon-omega.vercel.app`)
- ✅ `eas.json` con perfil `production` (Android `.aab`)
- ✅ `projectId` configurado (`a1ebfcb7-3d41-424c-b1ea-9585b17a414c`)
- ✅ `.env.local` con vars de Supabase + API
- ❌ **EAS Secrets cargados** para el build en la nube:
  ```bash
  eas secret:create --scope project --name EXPO_PUBLIC_API_URL --value "https://fitnessapp-ebon-omega.vercel.app/api"
  eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value "https://kgwdmuvtkqwfkiguedre.supabase.co"
  eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "..."
  eas secret:create --scope project --name EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID --value "..."
  eas secret:create --scope project --name EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID --value "..."
  ```
- ❓ Vars del backend en Vercel (Settings → Environment Variables): `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`, `SUPABASE_JWT_SECRET`, etc.
- ❓ Migraciones Supabase aplicadas en prod (`supabase/migrations/20260601_body_metrics.sql`, `20260601_push_tokens.sql`)

## 2. Autenticación

- ✅ Email/password vía Supabase
- 🟡 Google Sign-In **código wireado** ([app/(auth)/login.tsx:46-71](app/(auth)/login.tsx#L46-L71)) pero falta:
  - ❌ OAuth clients en Google Cloud Console (Web + Android con SHA-1 de EAS)
  - ❌ Provider Google habilitado en dashboard de Supabase
  - ❌ `iosUrlScheme` real en [app.json:44](app.json#L44) (hoy hay placeholder)
  - ❌ Vars `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` / `_IOS_CLIENT_ID` en `.env.local`
- ❌ Apple Sign-In (botón existe en login pero falla igual que Google estaba) — opcional para Android-only

## 3. Configuración de la app (`app.json`)

- ✅ Package name: `com.fitcore.app`
- ✅ Scheme: `fitcore`
- ✅ Plugins: expo-router, expo-font, expo-notifications, google-signin
- ❌ **`versionCode` Android** — agregar antes de buildear:
  ```json
  "android": {
    "package": "com.fitcore.app",
    "versionCode": 1,
    "permissions": ["CAMERA", "READ_MEDIA_IMAGES", "INTERNET", "VIBRATE", "POST_NOTIFICATIONS"],
    ...
  }
  ```
- ❌ **Permisos Android declarados explícitamente** (hoy no hay lista — Expo infiere algunos, mejor declarar solo los reales)
- ❓ Verificar que `com.fitcore.app` no esté tomado en Play Store
- ❓ `version` `1.0.0` está OK para el primer release

## 4. Assets visuales

- ✅ `assets/icon.png` existe — verificar 1024×1024 sin transparencia
- ✅ `assets/adaptive-icon.png` existe
- ✅ `assets/splash.png` existe
- ❌ **Feature Graphic** (1024×500) para el banner del listing
- ❌ **Capturas** (mín 2, recomendado 6-8 a 1080×1920 o superior). Sugeridas:
  - Dashboard / Home
  - Sesión de entrenamiento activa
  - Tracking nutricional
  - Modal "agregar comida" (IA por foto)
  - Resumen post-entreno
  - Progreso real (gráficos, medidas, racha)

## 5. Store Listing

- ❌ **Descripción corta** (≤80 chars)
- ❌ **Descripción completa** (≤4000 chars) — destacar IA de nutrición, rutinas, progreso real, grupos
- ❌ **Política de privacidad en URL pública** (obligatorio). Opciones:
  - Página en Notion publicada
  - GitHub Pages
  - Sección en la landing (`landing/`)
- ❌ Categoría: Health & Fitness
- ❌ Email de contacto público
- ❌ Content Rating (questionnaire dentro de Play Console)
- ❌ Target audience (Google exige declarar si está dirigida a menores)
- ❌ Data Safety form (qué datos colectás, para qué, si se comparten)

## 6. Cuenta de Play Console

- ❓ Cuenta de Google Play Console activa (USD 25 one-time)
- ❓ Verificación de identidad completada (Google la exige 2024+ para nuevas devs)
- ❓ D-U-N-S number si vas como empresa (no necesario si personal)

## 7. Push notifications

- ✅ Código de registro de token ([lib/notifications.ts](lib/notifications.ts))
- ✅ Tabla `push_tokens` en Supabase (`supabase/migrations/20260601_push_tokens.sql`)
- ❓ Permiso `POST_NOTIFICATIONS` en Android 13+ — verificar que `expo-notifications` lo solicite correctamente
- ❓ Sender notifications (Expo Push Service o FCM) — el plugin de expo-notifications usa Expo por defecto, no requiere config extra

## 8. Build de producción

```bash
# 1. Login en EAS
eas login

# 2. Cargar secrets (paso 1)
eas secret:list   # verificar

# 3. Build de prueba primero (APK instalable)
eas build --platform android --profile preview

# 4. Build final (.aab para Play Store)
eas build --platform android --profile production

# 5. Submit directo (opcional, requiere service account de Google)
eas submit --platform android --latest
```

## 9. Testing antes de submit

- ❌ Probar el `.apk` de preview en dispositivo real:
  - Login email/password
  - Login Google (cuando esté configurado en pasos 2)
  - Onboarding completo
  - Entrenamiento activo
  - Registrar comida con foto (IA)
  - Push notification de prueba
  - Logout y vuelta a login

## 10. Post-submit

- ❌ Configurar **Internal Testing track** primero (no producción directa)
- ❌ Invitar 5-10 testers reales
- ❌ Iterar 1-2 semanas antes de pasar a producción

---

## Orden recomendado (lo más crítico primero)

1. EAS Secrets (sección 1)
2. Política de privacidad publicada (sección 5)
3. `versionCode` y permisos en `app.json` (sección 3)
4. Build de preview y testeo real (sección 8-9)
5. Google Sign-In completo (sección 2) — si no es bloqueante, podés lanzar solo con email/password
6. Assets y store listing (secciones 4-5)
7. Submit a Internal Testing (sección 10)
8. Producción
