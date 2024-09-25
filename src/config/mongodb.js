import { MongoClient, ServerApiVersion } from 'mongodb'
import { env } from '~/config/environment'


let kanbanDatabaseInstance = null
const mongoClientInstance = new MongoClient(env.MONGODB_URI, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true
  }
})
export const CONNECT_DB = async () => {
  // goi ket noi uri
  await mongoClientInstance.connect()
  kanbanDatabaseInstance = mongoClientInstance.db(env.DATABASE_NAME)
}
export const CLOSE_DB = async () => {
  await mongoClientInstance.close()
}

export const GET_DB = () => {
  if (!kanbanDatabaseInstance)
    throw new Error('Must connect to Dababase first!')
  return kanbanDatabaseInstance
}
