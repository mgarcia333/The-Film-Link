# 🚀 Guía de Configuración para Deploy

## Paso 1: Variables de Entorno en Cloudflare Dashboard

Las siguientes variables de entorno deben configurarse en el dashboard de Cloudflare:

### Variables Secretas (Workers → Settings → Variables and secrets):

```
NUXT_TMDB_API_KEY=<tu-tmdb-api-key>
NUXT_SESSION_PASSWORD=<una-cadena-aleatoria-larga>
NUXT_OAUTH_GOOGLE_CLIENT_ID=<tu-google-client-id>
NUXT_OAUTH_GOOGLE_CLIENT_SECRET=<tu-google-client-secret>
```

**Notas:**
- Nunca pegues valores reales de secretos en este archivo ni en ningún otro archivo versionado - solo van en el dashboard de Cloudflare (o en `.dev.vars`, que está en `.gitignore`) y no se comparten.
- Para la TMDB API key, ver: https://www.themoviedb.org/settings/api
- Para Google OAuth, ver: https://console.cloud.google.com/apis/credentials
- El `NUXT_SESSION_PASSWORD` es para encriptar cookies de sesión - genera algo como `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

## Paso 2: Base de datos D1

El proyecto usa una base de datos D1 (`CACHE_DB`) como caché de datos de TMDB y para precomputar retos diarios y por dificultad.

### Crear la base de datos:
```bash
wrangler d1 create the-film-link-cache
```

Esto devolverá un `database_id`. Copialo en `wrangler.jsonc`:

```jsonc
"d1_databases": [
  {
    "binding": "CACHE_DB",
    "database_name": "the-film-link-cache",
    "database_id": "tu-database-id-aqui",
    "migrations_dir": "migrations"
  }
]
```

### Aplicar el esquema:
```bash
wrangler d1 migrations apply the-film-link-cache --local
wrangler d1 migrations apply the-film-link-cache --remote
```

## Paso 3: Configuración de Build

El `wrangler.jsonc` ya está configurado correctamente:
- ✅ Preset: `cloudflare_module`
- ✅ Storage: D1 binding para `CACHE_DB`
- ✅ Tasks: Scheduled para precalcular reto diario y reservas de dificultad a las 00:05 UTC
- ✅ Assets: Sirve archivos estáticos desde `.output/public`

## Paso 4: Verificar Build Local

```bash
npm run build
npm run typecheck
npm run lint
npm run test
```

## Paso 5: Deploy

```bash
wrangler deploy
```

O usa el deploy automático si está configurado en Cloudflare.

## Paso 6: Verificar Deploy

- ✅ Accede a tu dominio de Cloudflare Workers
- ✅ Prueba el reto diario
- ✅ Prueba el reto por dificultad (nuevo)
- ✅ Prueba el reto personalizado
- ✅ Verifica que las estadísticas se guardan

## Checklist Final

- [ ] Base de datos D1 creada, esquema aplicado, e ID configurado en `wrangler.jsonc`
- [ ] Todas las variables de entorno en Cloudflare Dashboard
- [ ] Build local sin errores: `npm run build`
- [ ] TypeScript sin errores: `npm run typecheck`
- [ ] ESLint sin errores: `npm run lint`
- [ ] Tests pasando: `npm run test`
- [ ] Deploy realizado: `wrangler deploy`
- [ ] Sitio en producción funcionando

## Troubleshooting

**Error: "CACHE_DB binding is not available"**
- Verifica que el `database_id` en `wrangler.jsonc` es correcto
- Verifica que la base de datos existe en Cloudflare Dashboard y que el esquema (`migrations/`) está aplicado tanto en local como en remoto

**Error: "TMDB API Key not found"**
- Verifica que `NUXT_TMDB_API_KEY` está en Cloudflare Dashboard
- Verifica que la clave es válida en https://www.themoviedb.org/settings/api

**Error: "Google OAuth credentials not found"**
- Verifica que `NUXT_OAUTH_GOOGLE_CLIENT_ID` y `NUXT_OAUTH_GOOGLE_CLIENT_SECRET` están en Cloudflare Dashboard
- Verifica que las credenciales son válidas en Google Cloud Console
