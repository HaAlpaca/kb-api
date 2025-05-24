import express from 'express'
import { labelController } from '~/controllers/labelController'
import { authMiddleware } from '~/middlewares/authMiddleware'
import { rbacMiddleware } from '~/middlewares/rbacMiddleware'
import { PERMISSION_NAME } from '~/utils/constants'
import { labelValidation } from '~/validations/labelValidation'
const Router = express.Router()
Router.route('/').post(
  authMiddleware.isAuthorize,
  rbacMiddleware.isValidPermission([PERMISSION_NAME.UPDATE_LABEL]),
  labelValidation.createNew,
  labelController.createNew
)
Router.route('/:id')
  .put(
    authMiddleware.isAuthorize,
    rbacMiddleware.isValidPermission([PERMISSION_NAME.UPDATE_LABEL]),
    labelValidation.update,
    labelController.update
  ) // update
  .delete(authMiddleware.isAuthorize, labelController.deleteLabel)

export const labelRoute = Router
