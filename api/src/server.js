import Fastify from 'fastify'
import cors from '@fastify/cors'
import cookie from '@fastify/cookie'
import swagger from '@fastify/swagger'
import swaggerUi from '@fastify/swagger-ui'
import { config } from './config.js'
import { spacesRoutes } from './routes/spaces.js'
import { labelsRoutes } from './routes/labels.js'
import { listsRoutes } from './routes/lists.js'
import { templatesRoutes } from './routes/templates.js'
import { suggestionsRoutes } from './routes/suggestions.js'
import { authRoutes } from './routes/auth.js'
import { userFromSession, publicUser, ensureAdmin } from './auth.js'

if (config.adminEmail && config.adminPassword) {
  try {
    await ensureAdmin(config.adminEmail, config.adminPassword)
    console.log(`admin account ready: ${config.adminEmail}`)
  } catch (err) {
    console.error('admin bootstrap failed (db not ready yet?)', err.message)
  }
}

const app = Fastify({
  logger: true
})

await app.register(cors, { origin: config.corsOrigin, credentials: true })
await app.register(cookie)

app.addHook('onRequest', async (req, reply) => {
  req.user = await userFromSession(app, req)
})

await app.register(swagger, {
  openapi: {
    info: {
      title: 'CheckMate API',
      description: 'REST API for CheckMate checklists',
      version: '0.1.0'
    }
  }
})

await app.register(swaggerUi, {
  routePrefix: '/docs'
})

await app.register(
  async (api) => {
    api.get('/health', async () => ({ status: 'ok' }))
    await authRoutes(api)
    api.addHook('onRequest', async (req, reply) => {
      if (!req.user) return reply.code(401).send({ error: 'authentication required' })
    })
    await spacesRoutes(api)
    await labelsRoutes(api)
    await listsRoutes(api)
    await templatesRoutes(api)
    await suggestionsRoutes(api)
  },
  { prefix: '/api' }
)

app.setErrorHandler((err, req, reply) => {
  const code = err.statusCode ?? 500
  if (code >= 500) req.log.error(err)
  reply.code(code).send({ error: err.message })
})

app.listen({ port: config.port, host: config.host }).then((address) => {
  app.log.info(`check-mate api listening on ${address}`)
})
