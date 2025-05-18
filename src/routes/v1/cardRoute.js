import express from 'express'
import { cardValidation } from '~/validations/cardValidation'
import { cardController } from '~/controllers/cardController'
import { authMiddleware } from '~/middlewares/authMiddleware'
import { multerUploadMiddleware } from '~/middlewares/multerUploadMiddleware'
import { PERMISSION_NAME } from '~/utils/constants'
import { rbacMiddleware } from '~/middlewares/rbacMiddleware'
const Router = express.Router()

Router.route('/').post(
  authMiddleware.isAuthorize,
  rbacMiddleware.isValidPermission([PERMISSION_NAME.CREATE_CARD]),
  cardValidation.createNew,
  cardController.createNew
)
Router.route('/:id')
  .get(
    authMiddleware.isAuthorize,
    rbacMiddleware.isValidPermission([PERMISSION_NAME.READ_CARD]),
    cardController.getDetails
  )
  .put(
    authMiddleware.isAuthorize,
    rbacMiddleware.isValidPermission([PERMISSION_NAME.UPDATE_CARD]),
    multerUploadMiddleware.uploadMedia.single('cardCover'),
    cardValidation.update,
    cardController.update
  )
Router.route('/complete/:id').put(
  authMiddleware.isAuthorize,
  rbacMiddleware.isValidPermission([PERMISSION_NAME.UPDATE_CARD]),
  cardController.toogleCardComplete
)

export const cardRoute = Router
