# All-In-One-App

App familiar "todo en uno" (listas, calendario, presupuesto, comidas, etc.) construida con
[Expo](https://expo.dev) (React Native + TypeScript) y [Expo Router](https://docs.expo.dev/router/introduction/),
con [Supabase](https://supabase.com) como backend (autenticación y base de datos).

Una única base de código para **iOS, Android y Web**.

> Estado actual: autenticación (email + contraseña), el **perfil** de usuario (nombre,
> apellido, fecha de nacimiento, alias) pedido justo tras registrarse, el módulo de
> **familia** (crear/unirse, código de invitación, lista de miembros), la pantalla
> principal (dashboard) y una pantalla de **Ajustes** (editar perfil, idioma, modo
> claro/oscuro, cerrar sesión) ya están implementados. El resto de módulos (listas,
> calendario, presupuesto, comidas...) todavía no.

## Estructura del proyecto

```
app/                  Rutas de Expo Router (file-based routing)
  _layout.tsx          Layout raíz: provee el contexto de auth y decide qué grupo mostrar
  login.tsx             Pantalla de login / registro (pública)
  (app)/                Grupo de pantallas protegidas (requieren sesión)
    _layout.tsx           Decide entre onboarding de perfil, de familia, y el resto de la app
    index.tsx             Pantalla principal (dashboard con las tarjetas de módulos)
    profile-setup.tsx      Onboarding: nombre, apellido, fecha de nacimiento, alias
    family-setup.tsx       Onboarding: crear familia / unirse con código
    family.tsx              "Mi familia": nombre, código de invitación, miembros
    settings.tsx             Ajustes: editar perfil, idioma, modo claro/oscuro, cerrar sesión
components/            Componentes de UI reutilizables (tarjetas, iconos, banners...)
lib/                   Lógica compartida no visual
  supabase.ts            Cliente de Supabase (lee las credenciales de las env vars)
  AuthProvider.tsx        Contexto de React con la sesión de Supabase Auth
  ProfileProvider.tsx     Contexto de React con el perfil del usuario
  FamilyProvider.tsx      Contexto de React con la familia/miembros del usuario
  ThemeProvider.tsx       Contexto de React con el modo claro/oscuro (persistido en el dispositivo)
  theme.ts                Tokens de diseño compartidos (colores, tipografía, espaciados)
types/                 Tipos y declaraciones TypeScript compartidas
supabase/migrations/   SQL de las tablas y políticas de seguridad (RLS) de Supabase
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

## 3. Configurar la base de datos

Este proyecto necesita las tablas `profiles`, `families` y `family_members`, sus políticas de
Row Level Security (RLS) y unas funciones RPC para crear/unirse a una familia de forma segura.

1. Ve a tu proyecto de Supabase → **SQL Editor**.
2. Abre, en orden, cada uno de estos archivos de este repositorio, copia todo su contenido y
   pégalo en el editor, pulsando **Run** después de cada uno:
   1. [`supabase/migrations/20260807120000_family_module.sql`](./supabase/migrations/20260807120000_family_module.sql)
   2. [`supabase/migrations/20260807130000_profiles.sql`](./supabase/migrations/20260807130000_profiles.sql)

Esto crea:
- La tabla `profiles` (nombre, apellido, fecha de nacimiento, alias), con RLS: cada usuario
  solo puede ver/crear/editar su propio perfil.
- Las tablas `families` y `family_members`, con RLS activado en ambas.
- Un usuario solo puede ver/editar familias a las que pertenece (comprobado vía
  `is_family_member()`, una función auxiliar que evita la recursión típica de RLS
  auto-referenciada).
- `create_family(family_name)` y `join_family_by_code(code)`: funciones RPC que crean o
  unen a una familia de forma atómica (familia + membresía en la misma transacción) y son
  el único camino para unirse — la validez del código se comprueba dentro de la función,
  algo que una política RLS por sí sola no puede expresar.
- `get_family_members(target_family_id)`: devuelve el email de los miembros de una familia
  (los emails viven en `auth.users`, que no es accesible directamente desde el cliente).

Ambos archivos son seguros de volver a ejecutar si algo falla a medias (usan
`if not exists` / `drop ... if exists` en todo lo que no lo soporta de forma nativa).

Si más adelante quieres aplicar esto con el CLI de Supabase en vez de pegarlo a mano, los
archivos ya siguen el formato de migración estándar (`supabase/migrations/<timestamp>_*.sql`).

## 4. Ejecutar el proyecto

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
  - **Con sesión activa** → se muestra el grupo `app/(app)/`.

## Cómo funciona el perfil de usuario

- `lib/ProfileProvider.tsx` expone el perfil del usuario actual (`useProfile()`), leído de
  la tabla `profiles`.
- `app/(app)/_layout.tsx` muestra `profile-setup.tsx` mientras el usuario no tenga fila en
  `profiles` — esto pasa automáticamente justo después de registrarse (o al iniciar sesión
  con una cuenta que nunca llegó a completar el perfil).
- El alias que se guarda ahí es el que se muestra en el saludo del dashboard
  (`Hola, {alias}`), en vez de un nombre fijo.

## Cómo funciona el módulo de familia

- `lib/FamilyProvider.tsx` expone la familia y los miembros del usuario actual
  (`useFamily()`), calculados a partir de la tabla `family_members`.
- `app/(app)/_layout.tsx` encadena las rutas protegidas dentro del grupo `(app)`, en orden:
  1. **Sin perfil** → `profile-setup.tsx`.
  2. **Con perfil pero sin familia** → `family-setup.tsx` (crear / unirse con código).
  3. **Con perfil y familia** → `index.tsx` (dashboard) y `family.tsx` ("Mi familia").
- Crear una familia y unirse a una con un código pasan siempre por las funciones RPC
  `create_family` / `join_family_by_code` de la base de datos (no por inserts directos),
  para que la operación sea atómica y el código de invitación se valide en el servidor.
- Todos los módulos futuros (listas, calendario, presupuesto...) compartirán datos a
  través de `family_id`, apoyándose en este mismo esquema de familias/miembros.

## Cómo funciona el modo claro/oscuro

- `lib/theme.ts` define dos paletas con las mismas claves (`darkColors` / `lightColors`),
  derivadas de la misma rampa de neutros del sistema de diseño — solo cambian los roles
  semánticos (fondo, superficie, texto...); el color de acento de marca es igual en ambas.
- `lib/ThemeProvider.tsx` guarda la preferencia del usuario en el dispositivo (vía
  `AsyncStorage`, no en Supabase — es una preferencia de UI, no un dato familiar) y expone
  `useColors()` (paleta activa) y `useThemeMode()` (modo actual + `setMode`).
- Las pantallas leen los colores con `useColors()` en vez de importar una paleta fija, así
  que cambian en caliente al tocar el interruptor Claro/Oscuro en Ajustes.

## Próximos pasos

Los siguientes módulos por construir son: listas, calendario, presupuesto, comidas y
recetas, cada uno con sus propias tablas (relacionadas con `families` vía `family_id`)
y políticas RLS siguiendo el mismo patrón que `families`/`family_members`.
