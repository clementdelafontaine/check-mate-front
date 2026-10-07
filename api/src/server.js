import { buildApp } from './app.js'
import { config } from './config.js'
import { ensureAdmin } from './auth.js'
import { seedDemoDataForUser, seedUsersWithFriendships } from './seed.js'

if (config.adminUsername && config.adminPassword) {
  try {
    const admin = await ensureAdmin(config.adminUsername, config.adminPassword)
    console.log(`admin account ready: ${config.adminUsername}`)
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

try {
  const count = await seedUsersWithFriendships()
  if (count) console.log(`seed users ready (${count})`)
} catch (err) {
  console.error('seed users failed (db not ready yet?)', err.message)
}

const app = await buildApp({ logger: true })

app.listen({ port: config.port, host: config.host }).then((address) => {
  app.log.info(`check-mate api listening on ${address}`)
})
