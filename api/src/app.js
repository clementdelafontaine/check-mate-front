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
import { recipesRoutes } from './routes/recipes.js'
import { mealPlansRoutes } from './routes/meal-plans.js'
import { friendsRoutes } from './routes/friends.js'
import { authRoutes } from './routes/auth.js'
import { userFromSession } from './auth.js'

export async function buildApp(options = {}) {
  const app = Fastify({ logger: options.logger ?? false })

  await app.register(cors, { origin: config.corsOrigin, credentials: true })
  await app.register(cookie)

  if (options.swagger !== false) {
    await app.register(swagger, {
      openapi: {
        info: {
          title: 'CheckMate API',
          description: 'REST API for CheckMate checklists',
          version: '0.1.0'
        }
      }
    })
    await app.register(swaggerUi, { routePrefix: '/docs' })
  }

  app.addHook('onRequest', async (req) => {
    req.user = await userFromSession(app, req)
  })

  await app.register(
    async (api) => {
      api.get('/health', async () => ({ status: 'ok' }))
      await authRoutes(api)
      await api.register(async (protectedApi) => {
        protectedApi.addHook('onRequest', async (req, reply) => {
          if (!req.user) return reply.code(401).send({ error: 'authentication required' })
        })
        await friendsRoutes(protectedApi)
        await spacesRoutes(protectedApi)
        await labelsRoutes(protectedApi)
        await listsRoutes(protectedApi)
        await templatesRoutes(protectedApi)
        await suggestionsRoutes(protectedApi)
        await recipesRoutes(protectedApi)
        await mealPlansRoutes(protectedApi)
      })
    },
    { prefix: '/api' }
  )

  app.setErrorHandler((err, req, reply) => {
    const code = err.statusCode ?? 500
    if (code >= 500) req.log.error(err)
    reply.code(code).send({ error: err.message })
  })

  return app
}
