import express from 'express'
import { boardValidation } from '~/validations/boardValidation'
import { boardController } from '~/controllers/boardController'
const Router = express.Router()
import { authMiddleware } from '~/middlewares/authMiddleware'
import { rbacMiddleware } from '~/middlewares/rbacMiddleware'
import { PERMISSION_NAME } from '~/utils/constants'
Router.route('/')
  .get(authMiddleware.isAuthorize, boardController.getBoards)
  .post(authMiddleware.isAuthorize, boardValidation.createNew, boardController.createNew)
Router.route('/:id')
  .get(
    authMiddleware.isAuthorize,
    // rbacMiddleware.isValidPermission([PERMISSION_NAME.READ_BOARD]),
    boardController.getDetails
  )
  .put(
    authMiddleware.isAuthorize,
    rbacMiddleware.isValidPermission([PERMISSION_NAME.UPDATE_BOARD]),
    boardValidation.update,
    boardController.update
  ) // update

// ho tro di chuyen card giua cac column
Router.route('/supports/moving_card').put(
  authMiddleware.isAuthorize,
  rbacMiddleware.isValidPermission([PERMISSION_NAME.EDIT_COLUMN]),
  boardValidation.moveCardToDifferentColumn,
  boardController.moveCardToDifferentColumn
) // update

Router.route('/analytics/:id').get(
  authMiddleware.isAuthorize,
  rbacMiddleware.isValidPermission([PERMISSION_NAME.BOARD_ANALYTICS]),
  boardController.getBoardAnalytics
)

Router.route('/roles/:id').put(
  authMiddleware.isAuthorize,
  rbacMiddleware.isValidPermission([PERMISSION_NAME.UPDATE_MEMBER_ROLE]),
  boardController.updateUserRole
)

export const boardRoute = Router
