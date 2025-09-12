import { MongoClient, Db } from 'mongodb'
import { singleton } from './singleton.server'

const client = singleton('mongo', () => {
  const client = new MongoClient(process.env.MONGODB_URI!)
  client.connect()
  return client
})

export const db: Db = client.db('cliquealo')

// Helper para cerrar conexión en desarrollo
if (process.env.NODE_ENV === 'development') {
  process.on('SIGINT', async () => {
    await client.close()
    process.exit(0)
  })
}