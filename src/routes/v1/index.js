import express from 'express'
import { StatusCodes } from 'http-status-codes'
import { boardRoute } from './boardRoute'
import { columnRoute } from './columnRoute'
import { cardRoute } from './cardRoute'
import { userRoute } from './userRoute'
import { invitationRoute } from './invitationRoute'
const Router = express.Router()
// check api v1
Router.get('/status', (req, res) => {
  res
    .status(StatusCodes.OK)
    .json({ message: 'API v1 already to use.', status: StatusCodes.OK })
})
//board APIs
Router.use('/boards', boardRoute)
//column APIs
Router.use('/columns', columnRoute)
//card APIs
Router.use('/cards', cardRoute)
// user API
Router.use('/users', userRoute)
// invitation API
Router.use('/invitations', invitationRoute)

export const APIs_v1 = Router
