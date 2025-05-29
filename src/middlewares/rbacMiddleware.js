/* eslint-disable no-console */
import { StatusCodes } from 'http-status-codes'
import { boardController } from '~/controllers/boardController'
import ApiError from '~/utils/ApiError'
import { ROLE_NAME } from '~/utils/constants'

const isValidPermission = (requiredPermission = []) =>
  async (req, res, next) => {
    const userId = req.jwtDecoded._id
    const boardId = req.header('x-board-id')
    // console.log('userId: ', userId)
    // console.log('boardId: ', boardId)
    try {
      const userRole = await boardController.getRolePermissions(userId, boardId)
      // kiem tra ton tai role
      if (!userRole) {
        return next(new ApiError(StatusCodes.FORBIDDEN, 'Permission denied.'))
      }
      // kiểm tra xem tên role hợp lệ không
      const fullUserRole = Object.entries(ROLE_NAME).find(([, value]) => value === userRole.role)
      if (!fullUserRole) {
        return next(new ApiError(StatusCodes.FORBIDDEN, 'Permission denied.'))
      }
      // kiểm tra permission đủ không
      const hasPermission = requiredPermission.every(permission => userRole.permissions.includes(permission))
      if (!hasPermission) {
        return next(new ApiError(StatusCodes.FORBIDDEN, 'Permission denied.'))
      }
      // Đủ quyền thì tiếp tục
      next()
    } catch (error) {
      next(new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Oop! Something went wrong.'))
    }
  }

export const rbacMiddleware = { isValidPermission }
