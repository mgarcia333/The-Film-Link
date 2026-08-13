# 🚀 Guía de Configuración para Deploy

## Paso 1: Variables de Entorno en Cloudflare Dashboard

Las siguientes variables de entorno deben configurarse en el dashboard de Cloudflare:

### Variables Secretas (Workers → Settings → Variables and secrets):

```
NUXT_TMDB_API_KEY=***REMOVED-LEAKED-SECRET***
NUXT_SESSION_PASSWORD=***REMOVED-LEAKED-SECRET***
NUXT_OAUTH_GOOGLE_CLIENT_ID=<tu-google-client-id>
NUXT_OAUTH_GOOGLE_CLIENT_SECRET=<tu-google-client-secret>
```

**Notas:**
- El `NUXT_TMDB_API_KEY` está configurado localmente
- Para Google OAuth, ver: https://console.cloud.google.com/apis/credentials
- El `NUXT_SESSION_PASSWORD` es para encriptar cookies de sesión

## Paso 2: KV Namespace

El proyecto utiliza un KV namespace llamado `GAME_KV` para cachear datos de películas y precomputar retos diarios.

### Crear el namespace:
```bash
wrangler kv namespace create GAME_KV --preview false
wrangler kv namespace create GAME_KV --preview true
```

Esto devolverá un ID. Copia el ID de producción en `wrangler.jsonc`:

```jsonc
"kv_namespaces": [
  {
    "binding": "GAME_KV",
    "id": "tu-namespace-id-aqui",
    "preview_id": "tu-namespace-preview-id-aqui"
  }
]
```

## Paso 3: Configuración de Build

El `wrangler.jsonc` ya está configurado correctamente:
- ✅ Preset: `cloudflare_module`
- ✅ Storage: KV binding para `GAME_KV`
- ✅ Tasks: Scheduled para precalcular reto diario a las 00:05 UTC
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

- [ ] KV namespace creado y ID configurado en `wrangler.jsonc`
- [ ] Todas las variables de entorno en Cloudflare Dashboard
- [ ] Build local sin errores: `npm run build`
- [ ] TypeScript sin errores: `npm run typecheck`
- [ ] ESLint sin errores: `npm run lint`
- [ ] Tests pasando: `npm run test`
- [ ] Deploy realizado: `wrangler deploy`
- [ ] Sitio en producción funcionando

## Troubleshooting

**Error: "KV namespace binding not found"**
- Verifica que el ID en `wrangler.jsonc` es correcto
- Verifica que el namespace existe en Cloudflare Dashboard

**Error: "TMDB API Key not found"**
- Verifica que `NUXT_TMDB_API_KEY` está en Cloudflare Dashboard
- Verifica que la clave es válida en https://www.themoviedb.org/settings/api

**Error: "Google OAuth credentials not found"**
- Verifica que `NUXT_OAUTH_GOOGLE_CLIENT_ID` y `NUXT_OAUTH_GOOGLE_CLIENT_SECRET` están en Cloudflare Dashboard
- Verifica que las credenciales son válidas en Google Cloud Console
