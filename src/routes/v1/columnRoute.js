import express from 'express'
import { columnValidation } from '~/validations/columnValidation'
import { columnController } from '~/controllers/columnController'
import { authMiddleware } from '~/middlewares/authMiddleware'
const Router = express.Router()

Router.route('/').post(
  authMiddleware.isAuthorize,
  columnValidation.createNew,
  columnController.createNew
)
Router.route('/:id')
  .put(
    authMiddleware.isAuthorize,
    columnValidation.update,
    columnController.update
  )
  .delete(
    authMiddleware.isAuthorize,
    columnValidation.deleteItem,
    columnController.deleteItem
  ) // update
export const columnRoute = Router
