# All-In-One-App

App familiar "todo en uno" (listas, calendario, presupuesto, comidas, etc.) construida con
[Expo](https://expo.dev) (React Native + TypeScript) y [Expo Router](https://docs.expo.dev/router/introduction/),
con [Supabase](https://supabase.com) como backend (autenticación y base de datos).

Una única base de código para **iOS, Android y Web**.

> Estado actual: solo está listo el **setup inicial** — autenticación (email + contraseña),
> navegación protegida y conexión a Supabase. Los módulos (listas, calendario, presupuesto,
> comidas...) todavía no están implementados.

## Estructura del proyecto

```
app/                  Rutas de Expo Router (file-based routing)
  _layout.tsx          Layout raíz: provee el contexto de auth y decide qué grupo mostrar
  login.tsx             Pantalla de login / registro (pública)
  (app)/                Grupo de pantallas protegidas (requieren sesión)
    _layout.tsx
    index.tsx            Pantalla principal (placeholder) tras iniciar sesión
components/            Componentes de UI reutilizables
lib/                   Lógica compartida no visual
  supabase.ts            Cliente de Supabase (lee las credenciales de las env vars)
  AuthProvider.tsx        Contexto de React con la sesión de Supabase Auth
types/                 Tipos y declaraciones TypeScript compartidas
assets/                Iconos, imágenes, fuentes...
```

## Requisitos previos

- [Node.js](https://nodejs.org/) 20 o superior
- npm (incluido con Node)
- Una cuenta y proyecto de [Supabase](https://supabase.com) (el plan gratuito es suficiente)
- Para compilar de forma nativa (opcional, no necesario para desarrollar con Expo Go):
  - **iOS**: macOS con Xcode
  - **Android**: Android Studio + un emulador o dispositivo físico

## 1. Instalar dependencias

```bash
npm install
```

## 2. Configurar las variables de entorno

Copia el archivo de ejemplo y rellena tus credenciales de Supabase:

```bash
cp .env.example .env
```

Edita `.env` con la **URL del proyecto** y la **anon/public key**, que encuentras en tu
proyecto de Supabase en *Project Settings → API*:

```
EXPO_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
```

> Las variables deben empezar por `EXPO_PUBLIC_` para que Expo las incluya en el bundle del
> cliente. `.env` está en `.gitignore`: nunca subas tus credenciales al repositorio, y nunca
> uses la `service_role key` en el cliente.

En el panel de Supabase, en *Authentication → Providers → Email*, asegúrate de que el
proveedor de Email esté activado para poder registrarte con email + contraseña.

## 3. Ejecutar el proyecto

Inicia el servidor de desarrollo de Expo:

```bash
npx expo start
```

Desde el menú interactivo que aparece puedes elegir la plataforma, o usar directamente:

```bash
npm run web       # Web, en http://localhost:8081
npm run ios       # iOS (requiere macOS + Xcode, o la app Expo Go)
npm run android   # Android (requiere Android Studio, o la app Expo Go)
```

Para probar en un dispositivo físico sin instalar nada nativo, instala la app **Expo Go**
(disponible en App Store / Google Play) y escanea el código QR que muestra `npx expo start`.

## Cómo funciona la autenticación

- `lib/supabase.ts` crea el cliente de Supabase leyendo `EXPO_PUBLIC_SUPABASE_URL` y
  `EXPO_PUBLIC_SUPABASE_ANON_KEY`, y persiste la sesión con `AsyncStorage` (funciona igual en
  iOS, Android y Web).
- `lib/AuthProvider.tsx` expone la sesión actual (`useAuth()`) a toda la app mediante contexto
  de React, escuchando los cambios de `supabase.auth.onAuthStateChange`.
- `app/_layout.tsx` usa rutas protegidas de Expo Router (`Stack.Protected`) para decidir la
  navegación:
  - **Sin sesión activa** → se muestra `app/login.tsx`.
  - **Con sesión activa** → se muestra el grupo `app/(app)/`, con `index.tsx` como pantalla
    principal.

## Próximos pasos

Este setup no incluye todavía ningún módulo funcional. Los siguientes pasos serán construir,
uno a uno, las funcionalidades dentro de `app/(app)/`: listas, calendario, presupuesto,
comidas, etc., junto con sus tablas y políticas de seguridad (RLS) en Supabase.
