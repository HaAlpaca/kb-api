import express from 'express'
import { StatusCodes } from 'http-status-codes'
import { boardValidation } from '~/validations/validationBoard'
import { boardController } from '~/controllers/boardController'
const Router = express.Router()

Router.route('/')
  .get((req, res) => {
    res.status(StatusCodes.OK).json({ message: 'GET: API get list board' })
  })
  .post(boardValidation.createNew, boardController.createNew)

export const boardRoutes = Router
