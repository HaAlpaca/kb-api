import express from 'express'
import { StatusCodes } from 'http-status-codes'
import { boardRoutes } from './boardRoute'
const Router = express.Router()
// check api v1
Router.get('/status', (req, res) => {
  res
    .status(StatusCodes.OK)
    .json({ message: 'API v1 already to use.', status: StatusCodes.OK })
})
//board APIs
Router.use('/boards', boardRoutes)

export const APIs_v1 = Router
