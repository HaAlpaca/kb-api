import express from 'express'
import { cardValidation } from '~/validations/cardValidation'
import { cardController } from '~/controllers/cardController'
import { authMiddleware } from '~/middlewares/authMiddleware'
const Router = express.Router()

Router.route('/').post(
  authMiddleware.isAuthorize,
  cardValidation.createNew,
  cardController.createNew
)

export const cardRoute = Router
