import express from 'express'
import { checklistController } from '~/controllers/checklistController'
import { authMiddleware } from '~/middlewares/authMiddleware'
import { rbacMiddleware } from '~/middlewares/rbacMiddleware'
import { PERMISSION_NAME } from '~/utils/constants'
import { checklistValidation } from '~/validations/checklistValidation'
const Router = express.Router()
Router.route('/').post(
  authMiddleware.isAuthorize,
  rbacMiddleware.isValidPermission([PERMISSION_NAME.UPDATE_CARD]),
  checklistValidation.createNew,
  checklistController.createNew
)
Router.route('/:id')
  .put(
    authMiddleware.isAuthorize,
    rbacMiddleware.isValidPermission([PERMISSION_NAME.UPDATE_CARD]),
    checklistValidation.update,
    checklistController.update
  )
  .delete(
    authMiddleware.isAuthorize,
    rbacMiddleware.isValidPermission([PERMISSION_NAME.UPDATE_CARD]),
    checklistController.deleteChecklist
  )

export const checklistRoute = Router
