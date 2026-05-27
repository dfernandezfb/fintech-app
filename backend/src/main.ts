import { env } from './infrastructure/config/env'
import { buildServer } from './infrastructure/http/server'

async function main() {
  const server = await buildServer()
  try {
    await server.listen({ port: env.port, host: '0.0.0.0' })
  } catch (err) {
    server.log.error(err)
    process.exit(1)
  }
}

main()
