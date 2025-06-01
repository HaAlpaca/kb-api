import express from 'express'
import { attachmentController } from '~/controllers/attachmentController'
import { authMiddleware } from '~/middlewares/authMiddleware'
import { attachmentValidation } from '~/validations/attachmentValidation'
import { multerUploadMiddleware } from '~/middlewares/multerUploadMiddleware'
import { rbacMiddleware } from '~/middlewares/rbacMiddleware'
import { PERMISSION_NAME } from '~/utils/constants'
const Router = express.Router()
Router.route('/').post(
  authMiddleware.isAuthorize,
  rbacMiddleware.isValidPermission([PERMISSION_NAME.UPDATE_CARD]),
  multerUploadMiddleware.uploadAttachment.single('attachment'),
  attachmentValidation.createNew,
  attachmentController.createNew
)
Router.route('/:id')
  // .get(authMiddleware.isAuthorize, labelController.getBoardLabels)
  .put(
    authMiddleware.isAuthorize,
    rbacMiddleware.isValidPermission([PERMISSION_NAME.UPDATE_CARD]),
    attachmentValidation.update,
    attachmentController.update
  ) // update
  .delete(
    authMiddleware.isAuthorize,
    rbacMiddleware.isValidPermission([PERMISSION_NAME.UPDATE_CARD]),
    authMiddleware.isAuthorize,
    attachmentController.deleteAttachment
  )

export const attachmentRoute = Router
