import express from 'express'
import { actionController } from '~/controllers/actionController'
import { authMiddleware } from '~/middlewares/authMiddleware'

const Router = express.Router()

Router.route('/').get(authMiddleware.isAuthorize, actionController.getActions)
export const actionRoute = Router
