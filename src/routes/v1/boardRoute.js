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
Router.route('/public').get(authMiddleware.isAuthorize, boardController.getPublicBoards)
Router.route('/private').get(authMiddleware.isAuthorize, boardController.getPrivateBoards)
Router.route('/archived').get(authMiddleware.isAuthorize, boardController.getArchivedBoards)
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
  .delete(
    authMiddleware.isAuthorize,
    rbacMiddleware.isValidPermission([PERMISSION_NAME.UPDATE_BOARD]),
    boardController.archiveBoard
  )

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
Router.route('/automations/:id').put(
  authMiddleware.isAuthorize,
  rbacMiddleware.isValidPermission([PERMISSION_NAME.UPDATE_BOARD]),
  boardController.updateBoardAutomation
)
Router.route('/join_public_board/:id').put(authMiddleware.isAuthorize, boardController.joinPublicBoard)
Router.route('/unarchive/:id').put(authMiddleware.isAuthorize, boardController.unArchiveBoard)
Router.route('/leave_board/:id').put(authMiddleware.isAuthorize, boardController.leaveBoard)

export const boardRoute = Router
