# Brief de proyecto: juego web de conexiones entre películas (TMDB)

Actúa como desarrollador full-stack senior. Vas a construir, desde cero y hasta producción, una aplicación web de un solo propósito. Lee el brief entero antes de escribir una línea de código y trabaja por fases, no de una sola pasada.

---

## 1. El juego (esto es lo más importante: es un juego simple)

El jugador recibe **dos películas**: una de salida y una de destino. Tiene que llegar de una a la otra encadenando personas del reparto o de la dirección, en el **menor número de pasos posible**.

Ejemplo real, para que no haya dudas:

```
Salida:  The King (2019)
  → elijo a Robert Pattinson (aparece en el reparto)
  → elijo La Odisea (2026), donde también aparece
  → elijo a Tom Holland (aparece en el reparto)
  → elijo Spider-Man: Brand New Day (2026)
Destino: alcanzado en 2 películas intermedias
```

La mecánica se reduce a dos pantallas que se alternan:

1. Estás en una película → ves su reparto principal y su dirección → eliges una persona.
2. Estás en una persona → ves su filmografía → eliges una película.
3. Si esa película es la de destino, has ganado.

**No añadas nada más.** Sin niveles, sin logros, sin monedas, sin pistas de pago, sin tutorial interactivo de cinco pasos, sin animaciones de celebración recargadas. La gracia del producto es que se entiende en diez segundos sin explicación. Cualquier funcionalidad que no esté en este documento, no existe.

### Reglas concretas

- Cada elección (persona o película) cuenta como **un paso**. El marcador muestra pasos dados y, al terminar, los compara con el óptimo.
- Se puede **deshacer** el último paso, pero deshacer no descuenta pasos del contador (queda registrado como camino recorrido).
- El jugador puede **rendirse** en cualquier momento.
- Al ganar o rendirse se muestra siempre **el camino más corto posible**, comparado visualmente con el camino que hizo el jugador.
- Una persona ya usada no puede volver a usarse en la misma partida.

---

## 2. Modos

**Reto diario.** La web propone el mismo par de películas para todos los jugadores cada día (UTC). Determinista: la misma fecha produce siempre el mismo reto. Debe estar precalculado y validado, con una dificultad objetivo de **camino óptimo de 2 o 3 películas intermedias**. Se guarda el resultado del día y la racha del jugador.

**Reto personalizado.** El jugador busca y elige las dos películas que quiera. Antes de empezar, el sistema **valida que exista conexión** y calcula el camino óptimo (ver sección 4). Si no hay conexión, se le dice claramente y se le sugiere elegir otra.

---

## 3. Stack técnico (cerrado, no lo cambies)

- **Nuxt 4** (Vue 3, `<script setup>`, TypeScript en modo `strict`).
- **Pinia** + `pinia-plugin-persistedstate` para todo el estado y la persistencia en `localStorage`. No hay base de datos.
- **Tailwind CSS v4**, con los tokens de la sección 6 definidos como variables CSS en una única capa de tema.
- **TMDB API v3**. La clave vive **solo en el servidor**, como variable de entorno, y se consume desde rutas de servidor de Nitro (`server/api/**`). Nunca llames a TMDB desde el cliente ni expongas la clave en el bundle.
- **Despliegue en Cloudflare Workers** con assets estáticos (`nitro.preset: 'cloudflare_module'`), `wrangler.jsonc` versionado.
- **Cloudflare KV** para caché de créditos y para el reto diario. En desarrollo, usa el binding local de Wrangler; no montes un mock propio.
- **Autenticación con Google** vía `nuxt-auth-utils` (flujo OAuth server-side, sesión en cookie firmada). Yo aportaré `NUXT_OAUTH_GOOGLE_CLIENT_ID` y `NUXT_OAUTH_GOOGLE_CLIENT_SECRET`.
  - Google sirve **solo para identidad** (nombre y avatar en la interfaz). **Las estadísticas y el historial se guardan en local con Pinia**, no en servidor. No crees usuarios en base de datos ni sincronices nada.
  - Jugar sin iniciar sesión debe funcionar igual. El login es opcional.
- **Vitest** para la lógica de negocio, **ESLint** con la config oficial de Nuxt, y `typecheck` en CI.
- Documenta un `.env.example` con todas las variables.

---

## 4. El motor de búsqueda de caminos (la parte difícil)

Modela el problema como un **grafo bipartito**: nodos de tipo película y nodos de tipo persona; una arista une a una persona con una película si aparece en su reparto principal o la dirigió.

Requisitos:

- **BFS bidireccional** (expandiendo desde ambos extremos, siempre por la frontera más pequeña) sobre datos traídos de TMDB bajo demanda. No intentes descargar un grafo completo.
- Endpoints: `/movie/{id}/credits` para expandir películas y `/person/{id}/movie_credits` para expandir personas.
- **Profundidad máxima: 3 películas intermedias.** Si no hay camino dentro de ese límite, el par se considera no conectable y se rechaza con un mensaje claro.
- **Poda de datos**, indispensable para que esto no explote:
  - Máximo 12 personas por película (top de reparto por `order`) más la dirección.
  - Descarta apariciones como uno mismo, cameos sin acreditar, y personas del reparto que no sean intérpretes o dirección.
  - Descarta documentales (género 99), películas sin fecha de estreno, sin póster, y por debajo de un umbral de votos configurable.
  - Un único punto del código define estos filtros, exportado como constantes con nombre. Nada de números mágicos repartidos.
- **Concurrencia limitada** (máx. 8 peticiones en vuelo), deduplicación de peticiones idénticas en curso, y **caché en KV** de créditos con TTL de 30 días. La caché debe ser la razón por la que la validación es rápida.
- **Validación previa**: cuando el jugador elige dos películas en modo personalizado, se lanza la búsqueda y se muestra un estado de carga honesto. Presupuesto: **respuesta en menos de 8 segundos**, con cancelación (`AbortController`) si el usuario cambia de opinión.
- El resultado de una validación (par → camino óptimo y longitud) se cachea en KV para no recalcularlo nunca dos veces.
- **Reto diario**: genérala de forma perezosa la primera vez que se pide un día, con bloqueo en KV para evitar carreras, a partir de una semilla determinista basada en la fecha. Selecciona candidatos de listas populares de TMDB, valida la conexión y descarta pares que no cumplan la dificultad objetivo. Deja preparado (pero no obligatorio) un cron de Cloudflare que la precaliente.

Toda esta lógica va en módulos puros y testeables bajo `server/utils/`, separada de los handlers HTTP. Los tests de Vitest cubren el BFS con un grafo simulado en memoria: camino corto, camino inexistente, corte por profundidad y correcta preferencia por el camino más corto.

---

## 5. Interfaz e idiomas

Pantallas, y ninguna más: inicio (elegir modo), reto diario, reto personalizado (buscador de dos películas), partida, resultado, estadísticas.

- **Tema claro y oscuro**, con detección de la preferencia del sistema y conmutador manual persistido. Ninguno de los dos es "el secundario": ambos se diseñan con el mismo cuidado.
- **Internacionalización con `@nuxtjs/i18n`** en seis idiomas: **español (por defecto), inglés, francés, alemán, portugués e italiano.** Ningún texto literal fuera de los archivos de traducción, incluidos errores y estados vacíos. Fechas y números localizados. Los metadatos de TMDB se piden en el idioma activo.
- Accesibilidad como suelo mínimo, sin anunciarla: navegación por teclado completa en la selección de personas y películas, foco visible, contraste AA en ambos temas, `prefers-reduced-motion` respetado.
- Responsive de verdad, diseñando primero para móvil: la partida se juega sobre todo con el pulgar.

---

## 6. Dirección de arte

Regla general: **debe parecer diseñado por una persona con criterio, no generado**. Prohibido explícitamente: degradados violeta-azul, tarjetas con `glassmorphism`, sombras difusas de colores, emojis como iconografía, iconos genéricos flotando en círculos de color, textos de relleno tipo "Potencia tu experiencia cinéfila con IA".

**Concepto:** hoja de reparto y créditos finales. El vocabulario visual del proyecto son los listados tipográficos de una ficha de casting: dos columnas, filete fino, versalitas, cifras monoespaciadas.

**Elemento distintivo (uno solo, y el resto en silencio):** el camino recorrido se dibuja como un **rollo de créditos vertical**: cada paso es una línea con la persona a la izquierda y la película a la derecha, unidas por un filete de puntos, y los pasos anteriores se van apilando encima. Al terminar la partida, ese mismo rollo se despliega en paralelo con el camino óptimo.

**Paleta — tema claro** (papel gris cálido, tinta, verde butaca, ámbar de marquesina):

```
--bg          #E8E6DF
--surface     #F4F3EF
--border      #C3BFB4
--ink         #191A17
--ink-muted   #5C5B54
--accent      #1F5F4E   /* acciones primarias */
--highlight   #C98A00   /* solo el paso activo y los aciertos */
--danger      #8C2B23
```

**Paleta — tema oscuro** (sala a oscuras):

```
--bg          #101311
--surface     #181C19
--border      #2C312D
--ink         #E7E5DD
--ink-muted   #8E938C
--accent      #6FBF9E
--highlight   #E3A72C
--danger      #C4564B
```

**Tipografía:**
- Titulares: **Archivo**, mayúsculas, peso 600, tracking amplio (0.08em), como los rótulos de créditos.
- Cuerpo e interfaz: **Public Sans**.
- Datos, contadores, años y número de pasos: **IBM Plex Mono**, cifras tabulares.

**Detalles:** radio de esquina 2px (nada redondeado), bordes de 1px sólidos como principal recurso de separación, ninguna sombra en tema claro, transiciones de 120ms y solo en cambios de estado reales. Los pósters de TMDB son el único color saturado de la pantalla; todo lo demás los enmarca.

**Textos de interfaz:** en voz activa y en minúscula de frase. Los errores dicen qué ha pasado y qué hacer ("Estas dos películas no tienen conexión en tres saltos. Prueba con otra."), nunca se disculpan ni son vagos. Un botón que dice "Rendirse" produce una pantalla que dice "Te has rendido".

---

## 7. Calidad de código

El objetivo es que este repositorio pase por escrito por mí, un desarrollador humano. Eso significa:

- Componentes pequeños y con una sola responsabilidad. Composables (`app/composables/`) para la lógica reutilizable de cliente, utilidades puras para la lógica de dominio.
- Tipado explícito de las respuestas de TMDB en `types/tmdb.ts`. Nada de `any`.
- **Comentarios solo donde explican un porqué no evidente** (una decisión de poda, un límite de la API). Cero comentarios que narran lo que el código ya dice. Cero `// TODO` abandonados.
- Nombres de variables, funciones y ramas **en inglés**; textos de interfaz vía i18n.
- Sin sobreingeniería: nada de capas de abstracción para un único caso de uso, nada de patrones de arquitectura empresarial en una app de dos pantallas.
- Manejo de errores real en las rutas de servidor: límites de tasa de TMDB, timeouts, respuestas vacías.

---

## 8. Git y repositorio

Trabaja con historial de verdad, no con un único commit gigante:

- `main` estable. Cada bloque de trabajo en su rama: `setup-nuxt`, `tmdb-client`, `path-finding`, `game-ui`, `daily-challenge`, `i18n`, `google-auth`, `dark-mode`, `deploy-cloudflare`. Fusiona con `--no-ff`.
- Commits **frecuentes y pequeños**, en inglés, en imperativo y en minúscula, como los escribiría una persona: `add tmdb credits endpoint`, `cache movie credits in kv`, `fix off-by-one in step counter`, `tidy up search input styles`. Se permiten commits de corrección menores; el historial no tiene que ser impecable, tiene que ser humano.
- **Prohibido**: emojis en los mensajes, prefijos de conventional commits en todos los commits, mensajes generados automáticamente, y cualquier mención a Claude, a la IA o a herramientas de asistencia en commits, coautorías, comentarios o documentación. No añadas trailers de `Co-Authored-By`.
- **README.md** en inglés y con contenido real: qué es el juego, con el ejemplo de arriba; capturas o descripción de los dos modos; cómo funciona la búsqueda de caminos y por qué se poda; stack; instalación y variables de entorno; comandos; despliegue en Cloudflare; y la atribución obligatoria de TMDB ("This product uses the TMDB API but is not endorsed or certified by TMDB") con su logotipo. Sin emojis decorativos, sin insignias inútiles, sin secciones de "Roadmap" inventadas.
- `.gitignore`, `LICENSE` (MIT) y `.env.example` desde el primer commit. La clave de TMDB no aparece nunca en el historial.

---

## 9. Orden de trabajo

1. Andamiaje de Nuxt, Tailwind con los tokens de tema, ESLint, Vitest, estructura de carpetas.
2. Cliente de TMDB en servidor: búsqueda de películas, créditos, filmografías, con caché en KV.
3. Motor de búsqueda de caminos con sus tests. **Esto antes que la interfaz.**
4. Partida jugable en modo personalizado, con validación previa.
5. Reto diario, estadísticas y rachas en Pinia.
6. i18n en los seis idiomas y tema claro/oscuro.
7. Login con Google.
8. Pulido visual y del rollo de créditos, estados de carga, vacíos y error.
9. Configuración de despliegue en Cloudflare y README.

Antes de empezar, dime en una lista breve las decisiones que vayas a tomar donde el brief deje margen, y espera mi confirmación. Después trabaja fase por fase: al terminar cada una, resume qué has hecho y qué falta, y no avances hasta que yo lo diga.