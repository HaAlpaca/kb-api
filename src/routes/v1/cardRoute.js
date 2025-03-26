import express from 'express'
import { cardValidation } from '~/validations/cardValidation'
import { cardController } from '~/controllers/cardController'
import { authMiddleware } from '~/middlewares/authMiddleware'
import { multerUploadMiddleware } from '~/middlewares/multerUploadMiddleware'
const Router = express.Router()

Router.route('/').post(
  authMiddleware.isAuthorize,
  cardValidation.createNew,
  cardController.createNew
)
Router.route('/:id')
  .get(authMiddleware.isAuthorize, cardController.getDetails)
  .put(
    authMiddleware.isAuthorize,
    multerUploadMiddleware.uploadMedia.single('cardCover'),
    cardValidation.update,
    cardController.update
  )

export const cardRoute = Router
