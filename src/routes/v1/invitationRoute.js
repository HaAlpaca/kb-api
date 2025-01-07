import express from 'express'
import { invitationController } from '~/controllers/invitationController'
import { authMiddleware } from '~/middlewares/authMiddleware'
import { invitationValidation } from '~/validations/invitationValidation'

const Router = express.Router()
Router.route('/board').post(
  authMiddleware.isAuthorize,
  invitationValidation.createNewBoardInvitation,
  invitationController.createNewBoardInvitation
)
Router.route('/').get(
  authMiddleware.isAuthorize,
  invitationController.getInvitations
)
Router.route('/board/:invitationId').put(
  authMiddleware.isAuthorize,
  invitationController.updateBoardInvitation
)

export const invitationRoute = Router
