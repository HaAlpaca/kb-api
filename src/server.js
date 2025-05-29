/* eslint-disable no-console */
import express from 'express'
import { CONNECT_DB, CLOSE_DB } from '~/config/mongodb'
import exitHook from 'async-exit-hook'
import { corsOptions } from './config/cors'
import cors from 'cors'
import { env } from '~/config/environment'
import { APIs_v1 } from '~/routes/v1'
import { errorHandlingMiddleware } from './middlewares/errorHandlingMiddleware'
import cookieParser from 'cookie-parser'
import http from 'http'
import socketIo from 'socket.io'
import { inviteUserToBoardSocket } from './sockets/inviteUserToBoardSocket'
import { cardSocket } from './sockets/cardSocket'
import { columnSocket } from './sockets/columnSocket'
import { START_CRON_JOB } from './config/cron'
import { boardSocket } from './sockets/boardSocket'
import { labelSocket } from './sockets/labelSocket'
import { attachmentSocket } from './sockets/attachmentSocket'
import { WATCH_AUTOMATION } from './watchers/watchCards'
import { setSocketInstance } from './sockets/socketInstance'
import { START_OVERDUE_WATCHER } from './watchers/overdueWatcher'

const START_SERVER = () => {
  const app = express()
  // fix 410 (from disk cache)
  // https://stackoverflow.com/questions/22632593/how-to-disable-webpage-caching-in-expressjs-nodejs/53240717#53240717
  app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store')
    next()
  })
  //cau hinh cookie parser
  app.use(cookieParser())
  //cau hinh cors
  app.use(cors(corsOptions))
  // enable req.body json data
  app.use(express.json())
  //
  app.use('/v1', APIs_v1)
  //middleware xu li loi tap trung
  app.use(errorHandlingMiddleware)
  // tạo server bọc app của express để làm realtime
  const server = http.createServer(app)
  // khởi tạo socket io với server và cors
  const io = socketIo(server, { cors: corsOptions })

  // Lưu trữ instance của io
  setSocketInstance(io)

  io.on('connection', socket => {
    // console.log('A client connected:', socket.id)
    inviteUserToBoardSocket(socket)

    // socket join room
    socket.on('JOIN_BOARD', boardId => {
      socket.join(boardId)
      console.log(`User ${socket.id} joined board room: ${boardId}`)
    })

    socket.on('LEAVE_BOARD', boardId => {
      socket.leave(boardId)
      console.log(`User ${socket.id} left board room: ${boardId}`)
    })

    // label socket
    labelSocket.Delete(socket)
    labelSocket.Create(socket)
    labelSocket.Update(socket)
    // attachment socket
    attachmentSocket.Delete(socket)
    attachmentSocket.Create(socket)
    attachmentSocket.Update(socket)
    // board socket
    boardSocket.Delete(socket)
    boardSocket.Create(socket)
    boardSocket.Update(socket)
    // card socket
    cardSocket.Create(socket)
    cardSocket.Delete(socket)
    cardSocket.Move(socket)
    cardSocket.Update(socket)
    // column socket
    columnSocket.Create(socket)
    columnSocket.Delete(socket)
    columnSocket.Move(socket)
  })
  if (env.BUILD_MODE === 'production') {
    // dùng server.listen vì server bọc app rồi
    server.listen(process.env.PORT, () => {
      // eslint-disable-next-line no-console
      console.log(`PRODUCTION: Hi ${env.AUTHOR}, server is running successfully at PORT: ${process.env.PORT}`)
    })
  } else {
    // dùng server.listen vì server bọc app rồi
    server.listen(env.LOCAL_DEV_APP_PORT, env.LOCAL_DEV_APP_HOST, () => {
      // eslint-disable-next-line no-console
      console.log(`DEV: Server is running at http://${env.LOCAL_DEV_APP_HOST}:${env.LOCAL_DEV_APP_PORT}/`)
    })
  }

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
    WATCH_AUTOMATION()
    START_OVERDUE_WATCHER()
    START_SERVER()

    START_CRON_JOB()
  } catch (error) {
    console.error(error)
  }
})()

// 18.16.0
