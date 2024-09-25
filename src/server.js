/* eslint-disable no-console */
import express from 'express'
import { CONNECT_DB, CLOSE_DB } from '~/config/mongodb'
import exitHook from 'async-exit-hook'
import { env } from '~/config/environment'
const START_SERVER = () => {
  const app = express()

  app.get('/', async (req, res) => {
    console.log(env)
    res.end('<h1>Hello World!</h1><hr>')
  })

  app.listen(env.APP_PORT, env.APP_HOST, () => {
    // eslint-disable-next-line no-console
    console.log(
      `Hi ${env.AUTHOR}, server is running successfully at Host: http://${env.APP_HOST}:${env.APP_PORT}/`
    )
  })

  exitHook(() => {
    console.log('Server is shutting down...')
    CLOSE_DB()
    console.log('Disconnected from MongoDB Cloud Atlas.')
  })
}

;(async () => {
  try {
    console.log('Connecting to MongoDB Cloud Atlas...')
    await CONNECT_DB()
    console.log('Connect to MongoDB Cloud Atlas!')
    START_SERVER()
  } catch (error) {
    console.error(error)
  }
})()
