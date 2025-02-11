import express from 'express'
import { labelController } from '~/controllers/labelController'
import { authMiddleware } from '~/middlewares/authMiddleware'
import { labelValidation } from '~/validations/labelValidation'
const Router = express.Router()
Router.route('/').post(
  authMiddleware.isAuthorize,
  labelValidation.createNew,
  labelController.createNew
)
Router.route('/:id')
  // .get(authMiddleware.isAuthorize, labelController.getBoardLabels)
  .put(
    authMiddleware.isAuthorize,
    labelValidation.update,
    labelController.update
  ) // update
  .delete(authMiddleware.isAuthorize, labelController.deleteLabel)

export const labelRoute = Router
