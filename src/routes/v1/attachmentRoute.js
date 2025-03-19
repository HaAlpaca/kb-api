import express from 'express'
import { attachmentController } from '~/controllers/attachmentController'
import { authMiddleware } from '~/middlewares/authMiddleware'
import { attachmentValidation } from '~/validations/attachmentValidation'
import { multerUploadMiddleware } from '~/middlewares/multerUploadMiddleware'
const Router = express.Router()
Router.route('/').post(
  authMiddleware.isAuthorize,
  multerUploadMiddleware.uploadAttachment.single('attachment'),
  attachmentValidation.createNew,
  attachmentController.createNew
)
Router.route('/:id')
  // .get(authMiddleware.isAuthorize, labelController.getBoardLabels)
  .put(
    authMiddleware.isAuthorize,
    attachmentValidation.update,
    attachmentController.update
  ) // update
  .delete(authMiddleware.isAuthorize, attachmentController.deleteAttachment)

export const attachmentRoute = Router
