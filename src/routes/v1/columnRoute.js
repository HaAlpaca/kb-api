import express from 'express'
import { columnValidation } from '~/validations/columnValidation'
import { columnController } from '~/controllers/columnController'
import { authMiddleware } from '~/middlewares/authMiddleware'
import { rbacMiddleware } from '~/middlewares/rbacMiddleware'
import { PERMISSION_NAME } from '~/utils/constants'
const Router = express.Router()

Router.route('/').post(
  authMiddleware.isAuthorize,
  rbacMiddleware.isValidPermission([PERMISSION_NAME.EDIT_COLUMN]),
  columnValidation.createNew,
  columnController.createNew
)
Router.route('/:id')
  .put(
    authMiddleware.isAuthorize,
    rbacMiddleware.isValidPermission([PERMISSION_NAME.EDIT_COLUMN]),
    columnValidation.update,
    columnController.update
  )
  .delete(
    authMiddleware.isAuthorize,
    rbacMiddleware.isValidPermission([PERMISSION_NAME.EDIT_COLUMN]),
    columnValidation.deleteItem,
    columnController.deleteItem
  ) // update
export const columnRoute = Router
