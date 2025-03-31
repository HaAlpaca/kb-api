import express from 'express'
import { checkboxController } from '~/controllers/checkboxController'
import { authMiddleware } from '~/middlewares/authMiddleware'
import { checkboxValidation } from '~/validations/checkboxValidation'
const Router = express.Router()
Router.route('/')
  .post(
    authMiddleware.isAuthorize,
    checkboxValidation.createNew,
    checkboxController.createNew
  )
  .put(
    authMiddleware.isAuthorize,
    checkboxValidation.updateCheckboxChecked,
    checkboxController.updateCheckboxChecked
  )
Router.route('/:id')
  // .get(authMiddleware.isAuthorize, labelController.getBoardLabels)
  .put(
    authMiddleware.isAuthorize,
    checkboxValidation.update,
    checkboxController.update
  ) // update
  .delete(authMiddleware.isAuthorize, checkboxController.deleteCheckbox)

export const checkboxRoute = Router
