import express from 'express'
import { checklistController } from '~/controllers/checklistController'
import { authMiddleware } from '~/middlewares/authMiddleware'
import { checklistValidation } from '~/validations/checklistValidation'
const Router = express.Router()
Router.route('/').post(
  authMiddleware.isAuthorize,
  checklistValidation.createNew,
  checklistController.createNew
)
Router.route('/:id')
  .put(
    authMiddleware.isAuthorize,
    checklistValidation.update,
    checklistController.update
  ) //
  .delete(authMiddleware.isAuthorize, checklistController.deleteChecklist)

export const checklistRoute = Router
