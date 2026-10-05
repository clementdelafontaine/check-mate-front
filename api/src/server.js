import { buildApp } from './app.js'
import { config } from './config.js'
import { ensureAdmin } from './auth.js'
import { seedDemoDataForUser } from './seed.js'

if (config.adminEmail && config.adminPassword) {
  try {
    const admin = await ensureAdmin(config.adminEmail, config.adminPassword)
    console.log(`admin account ready: ${config.adminEmail}`)
    try {
      const seeded = await seedDemoDataForUser(admin.id)
      if (seeded) console.log('demo data seeded for admin (recipes, meal plans, lists, templates)')
    } catch (err) {
      console.error('recipe seeding failed', err.message)
    }
  } catch (err) {
    console.error('admin bootstrap failed (db not ready yet?)', err.message)
  }
}

const app = await buildApp({ logger: true })

app.listen({ port: config.port, host: config.host }).then((address) => {
  app.log.info(`check-mate api listening on ${address}`)
})
