import express from 'express'
import { StatusCodes } from 'http-status-codes'
import { boardValidation } from '~/validations/boardValidation'
import { boardController } from '~/controllers/boardController'
const Router = express.Router()
import { authMiddleware } from '~/middlewares/authMiddleware'
Router.route('/')
  .get(authMiddleware.isAuthorize, (req, res) => {
    res.status(StatusCodes.OK).json({ message: 'GET: API get list board' })
  })
  .post(
    authMiddleware.isAuthorize,
    boardValidation.createNew,
    boardController.createNew
  )
Router.route('/:id')
  .get(authMiddleware.isAuthorize, boardController.getDetails)
  .put(
    authMiddleware.isAuthorize,
    boardValidation.update,
    boardController.update
  ) // update

// ho tro di chuyen card giua cac column
Router.route('/supports/moving_card').put(
  authMiddleware.isAuthorize,
  boardValidation.moveCardToDifferentColumn,
  boardController.moveCardToDifferentColumn
) // update

export const boardRoute = Router
