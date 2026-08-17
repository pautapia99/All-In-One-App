# All-In-One-App

App familiar "todo en uno" (listas, calendario, presupuesto, comidas, etc.) construida con
[Expo](https://expo.dev) (React Native + TypeScript) y [Expo Router](https://docs.expo.dev/router/introduction/),
con [Supabase](https://supabase.com) como backend (autenticación y base de datos).

Una única base de código para **iOS, Android y Web**.

> Estado actual: autenticación (email + contraseña), el **perfil** de usuario (nombre,
> apellido, fecha de nacimiento, alias) pedido justo tras registrarse, el módulo de
> **familia** (crear/unirse, código de invitación, lista de miembros), el módulo de
> **listas** (privadas o compartidas, con sus items), el módulo de **calendario**
> (eventos privados o compartidos, vistas mensual/semanal/diaria), el módulo de
> **cumpleaños** (combina los de los miembros de la familia con los añadidos a mano), el
> módulo de **presupuesto** (categorías con límite mensual y gastos privados o
> compartidos), la pantalla principal (dashboard) y una pantalla de **Ajustes** (editar
> perfil, idioma, modo claro/oscuro, cerrar sesión) ya están implementados. El resto de
> módulos (comidas, recetas...) todavía no.

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
    lists/                   Módulo de listas
      _layout.tsx              Stack anidado (índice + detalle)
      index.tsx                 Todas las listas visibles, filtrables por categoría
      [id].tsx                   Detalle de una lista: items, añadir/marcar/borrar
    calendar/                Módulo de calendario
      _layout.tsx              Stack anidado (por ahora solo la pantalla principal)
      index.tsx                  Vistas mensual/semanal/diaria, crear/editar/borrar eventos
    birthdays/               Módulo de cumpleaños
      _layout.tsx              Stack anidado (por ahora solo la pantalla principal)
      index.tsx                  Lista combinada (familia + añadidos a mano), crear/editar/borrar
    budget/                  Módulo de presupuesto
      _layout.tsx              Stack anidado (índice + categorías + detalle de categoría)
      index.tsx                  Resumen del mes + tarjeta de progreso por categoría
      categories.tsx              Gestionar categorías: crear/editar/borrar
      [categoryId].tsx             Gastos de una categoría en el mes, crear/editar/borrar
components/            Componentes de UI reutilizables (tarjetas, iconos, banners...)
  CalendarDatePicker.tsx  Selector de fecha en bottom sheet (perfil, eventos, cumpleaños y gastos)
  EventFormSheet.tsx      Formulario de crear/editar evento (calendario)
  TimePickerField.tsx     Selector de hora en bottom sheet (calendario)
  BirthdayFormSheet.tsx   Formulario de crear/editar cumpleaños manual
  CategoryFormSheet.tsx   Formulario de crear/editar categoría de presupuesto
  ExpenseFormSheet.tsx    Formulario de crear/editar gasto
  ProgressBar.tsx         Barra de progreso reutilizable (gastado vs. límite)
lib/                   Lógica compartida no visual
  supabase.ts            Cliente de Supabase (lee las credenciales de las env vars)
  AuthProvider.tsx        Contexto de React con la sesión de Supabase Auth
  ProfileProvider.tsx     Contexto de React con el perfil del usuario
  FamilyProvider.tsx      Contexto de React con la familia/miembros del usuario
  ThemeProvider.tsx       Contexto de React con el modo claro/oscuro (persistido en el dispositivo)
  useLists.ts             Hook con las listas visibles para el usuario y su creación
  useEvents.ts            Hook con los eventos visibles para el usuario y su CRUD
  useBirthdays.ts          Hook con la lista combinada de cumpleaños y su CRUD manual
  useBudget.ts             Hook con categorías/gastos, totales del mes y su CRUD
  calendarUtils.ts         Helpers de fechas (semana en lunes, franjas horarias...)
  budgetUtils.ts           Paleta de colores de categorías y formateo de importes en €
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

Este proyecto necesita las tablas `profiles`, `families`, `family_members`, `lists`,
`list_items`, `events`, `birthdays`, `budget_categories` y `expenses`, sus políticas de
Row Level Security (RLS) y unas funciones RPC para crear/unirse a una familia de forma
segura.

1. Ve a tu proyecto de Supabase → **SQL Editor**.
2. Abre, en orden, cada uno de estos archivos de este repositorio, copia todo su contenido y
   pégalo en el editor, pulsando **Run** después de cada uno:
   1. [`supabase/migrations/20260807120000_family_module.sql`](./supabase/migrations/20260807120000_family_module.sql)
   2. [`supabase/migrations/20260807130000_profiles.sql`](./supabase/migrations/20260807130000_profiles.sql)
   3. [`supabase/migrations/20260816180000_lists_module.sql`](./supabase/migrations/20260816180000_lists_module.sql)
   4. [`supabase/migrations/20260816190000_calendar_module.sql`](./supabase/migrations/20260816190000_calendar_module.sql)
   5. [`supabase/migrations/20260817120000_birthdays_module.sql`](./supabase/migrations/20260817120000_birthdays_module.sql)
   6. [`supabase/migrations/20260817140000_budget_module.sql`](./supabase/migrations/20260817140000_budget_module.sql)

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
- `get_family_members(target_family_id)`: devuelve el email y el alias de los miembros de
  una familia (los emails viven en `auth.users`, que no es accesible directamente desde el
  cliente; el alias se añadió más tarde, en la migración de presupuesto, para poder mostrar
  quién registró cada gasto compartido).
- Las tablas `lists` y `list_items`, con RLS: una lista `compartida` es visible/editable por
  toda la familia; una `privada`, solo por quien la creó. `list_items` hereda la visibilidad
  de su lista a través de `can_access_list()` (misma técnica que `is_family_member()`).
- La tabla `events`, con RLS: un evento `compartido` es visible/editable por toda la
  familia; uno `privado`, solo por quien lo creó (mismo patrón que `lists`, reutilizando
  `is_family_member()` directamente ya que aquí no hay ninguna tabla hija).
- La tabla `birthdays` (cumpleaños añadidos a mano, para gente que no tiene cuenta en la
  app), con RLS: visibles/editables por cualquier miembro de la familia, sin distinción
  privado/compartido. `get_family_member_birthdays(target_family_id)`: devuelve nombre y
  fecha de nacimiento de los miembros de una familia (igual que `get_family_members`, hace
  falta una función porque `profiles` solo deja ver tu propia fila por RLS).
- Las tablas `budget_categories` y `expenses`: las categorías son siempre visibles/editables
  por toda la familia (son la estructura del presupuesto, no gastos individuales); un gasto
  `compartido` es visible/editable por toda la familia, uno `privado` solo por quien lo
  creó (mismo patrón que `lists` y `events`).

Todos los archivos son seguros de volver a ejecutar si algo falla a medias (usan
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

## Cómo funciona el módulo de listas

- `lib/useLists.ts` expone las listas visibles para el usuario (`useLists()`) — privadas
  propias más compartidas de su familia — con el recuento de items pendientes de cada una,
  y `createList()`.
- `app/(app)/lists/index.tsx`: todas las listas, filtrables por categoría (compra / tareas /
  otros), con un botón `+` que abre `NewListSheet` (nombre, categoría, visibilidad).
- `app/(app)/lists/[id].tsx`: detalle de una lista — marcar/desmarcar items, añadir uno
  rápido, borrar items sueltos, o la lista entera (con confirmación vía `ConfirmModal`, ya
  que `Alert.alert` no funciona en Web).
- Como estas pantallas quedan montadas en la pila de navegación, tanto el índice de listas
  como la tarjeta del dashboard refrescan sus datos con `useFocusEffect` cada vez que
  vuelves a ellas — si no, los cambios hechos en el detalle (items añadidos/marcados) no se
  verían reflejados hasta recargar la app entera.
- Los inserts/updates/deletes van directos contra `lists`/`list_items` (no hacen falta RPCs
  como en familia: aquí no hay ningún secreto que validar en el servidor, solo pertenencia).

## Cómo funciona el módulo de calendario

- `lib/useEvents.ts` expone los eventos visibles para el usuario (`useEvents()`) — privados
  propios más compartidos de su familia — y `createEvent()` / `updateEvent()` / `deleteEvent()`.
- `lib/calendarUtils.ts` centraliza los cálculos de fechas: semanas que empiezan en lunes,
  la rejilla 6×7 de la vista mensual, y los helpers que construyen `start_at`/`end_at` a
  partir de la fecha y hora locales elegidas en el formulario (usando el constructor
  `Date(año, mes, día, hora, minuto)` + `toISOString()`, para que el evento se guarde y se
  vuelva a leer con la misma hora local sin importar la zona horaria del dispositivo).
- `app/(app)/calendar/index.tsx`: selector Mensual/Semanal/Diario, navegación anterior/
  siguiente + botón "Hoy", y las tres vistas:
  - **Mensual**: rejilla del mes con un punto en los días con eventos; al tocar un día se
    listan sus eventos debajo.
  - **Semanal**: columnas de lunes a domingo con los eventos posicionados por hora, y una
    fila aparte arriba para los eventos "todo el día".
  - **Diaria**: la misma franja horaria que la semanal, pero con una sola columna.
- `components/EventFormSheet.tsx`: formulario de crear/editar evento (título, fecha vía
  `CalendarDatePicker`, interruptor "todo el día" que oculta las horas, `TimePickerField`
  para la hora de inicio/fin, y visibilidad privado/compartido); en modo edición añade
  "Eliminar evento" con confirmación vía `ConfirmModal`.
- Igual que en listas, tanto la pantalla de calendario como la tarjeta del dashboard
  refrescan sus datos con `useFocusEffect` para no quedarse con información desactualizada
  al volver de crear/editar un evento.

## Cómo funciona el módulo de cumpleaños

- `lib/useBirthdays.ts` combina dos fuentes en una sola lista ordenada por proximidad: los
  miembros de la familia (vía la RPC `get_family_member_birthdays`, ya que `profiles` no es
  legible entre usuarios) y los cumpleaños de la tabla `birthdays`, añadidos a mano para
  quien no tiene cuenta en la app.
- Como `birth_date` es una columna `date` normal, un cumpleaños manual sin año conocido
  guarda un año "centinela" (1904, un año bisiesto lejano que ningún familiar real puede
  tener) en vez de un año real — `UNKNOWN_BIRTH_YEAR` en el mismo archivo. El formulario
  (`components/BirthdayFormSheet.tsx`) nunca enseña ese año al usuario: se elige el día y
  el mes con el mismo `CalendarDatePicker` de siempre, y el año que se ve en el selector se
  descarta al guardar si el interruptor "Sé el año de nacimiento" está apagado.
- Para cada persona se calculan los días que faltan hasta su próximo cumpleaños (si ya pasó
  este año, se calcula para el que viene) y, si se conoce el año, la edad que cumplirá.
- `app/(app)/birthdays/index.tsx`: lista con nombre, fecha, cuenta atrás ("En 5 días",
  "Mañana", "¡Hoy!") y la edad si se conoce, distinguiendo con un icono si es un miembro de
  la familia o uno añadido a mano. Solo los añadidos a mano se pueden tocar para editar o
  borrar — los de miembros de la familia vienen de su perfil y se editan desde ahí.

## Cómo funciona el módulo de presupuesto

- `lib/useBudget.ts` expone las categorías y gastos visibles para el usuario
  (`useBudget()`), y calcula sobre ellos: el gasto de cada categoría en el mes actual
  (`categorySummaries`), el gasto total del mes (`totalSpent`) y la suma de todos los
  límites (`totalLimit`). Los importes de Postgres (`numeric`) se convierten explícitamente
  con `Number(...)` al leerlos — PostgREST puede devolverlos como texto para no perder
  precisión, y sumarlos con `+` sin convertir concatenaría en vez de sumar.
- `app/(app)/budget/index.tsx`: resumen del mes (gastado vs. límite total) y una tarjeta
  por categoría con su barra de progreso — en rojo si se supera el límite —, o un estado
  vacío invitando a crear la primera categoría si la familia todavía no tiene ninguna.
- `app/(app)/budget/categories.tsx`: gestión de categorías (nombre, límite mensual, color
  de una paleta fija) vía `CategoryFormSheet`; borrar una categoría borra en cascada sus
  gastos (`on delete cascade` en la base de datos).
- `app/(app)/budget/[categoryId].tsx`: gastos de esa categoría en el mes — concepto,
  importe, fecha, quién lo registró (resuelto contra `useFamily().members`, o "Tú" si eres
  tú) y si es privado o compartido —, con `ExpenseFormSheet` para crear/editar/borrar.
- Igual que en el resto de módulos, todas estas pantallas y la tarjeta del dashboard
  refrescan sus datos con `useFocusEffect` para no quedarse con información desactualizada.

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

Los siguientes módulos por construir son: comidas y recetas, cada uno con sus propias
tablas (relacionadas con `families` vía `family_id`) y políticas RLS siguiendo el mismo
patrón que `families`/`family_members`, `lists`/`list_items`, `events`, `birthdays` y
`budget_categories`/`expenses`.
