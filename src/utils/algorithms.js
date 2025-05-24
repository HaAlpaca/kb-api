// thuat toan bo qua so luong bang ghi truoc do cua page

// https://www.mongodb.com/docs/manual/reference/method/cursor.skip/#pagination-example
export const pageSkipValue = (page, itemsPerPage) => {
  if (!page || !itemsPerPage) return 0
  if (page <= 0 || itemsPerPage <= 0) return 0

  return (page - 1) * itemsPerPage
}

import { ObjectId } from 'mongodb'
import { ROLE_NAME, PERMISSION_NAME } from '~/utils/constants'

export const generateRole = (userId, rolename) => {
  const roleObject = {
    userId: new ObjectId(userId),
    role: rolename,
    permissions: []
  }

  switch (rolename) {
  case ROLE_NAME.ADMIN:
    // Lấy toàn bộ quyền từ PERMISSION_NAME
    roleObject.permissions = Object.values(PERMISSION_NAME)
    break

  case ROLE_NAME.MODERATOR: {
  // Moderator có tất cả quyền trừ những quyền bị cấm
    const excludedPermissions = new Set([
      PERMISSION_NAME.INVITE_MEMBER,
      PERMISSION_NAME.REMOVE_MEMBER,
      PERMISSION_NAME.UPDATE_MEMBER_ROLE,
      PERMISSION_NAME.UPDATE_MEMBER_PERMISSION,
      PERMISSION_NAME.UPDATE_BOARD,
      PERMISSION_NAME.DELETE_BOARD,
      PERMISSION_NAME.BOARD_ANALYTICS
    ])

    roleObject.permissions = Object.values(PERMISSION_NAME).filter(
      (permission) => !excludedPermissions.has(permission)
    )
    break
  }


  case ROLE_NAME.USER:
  default:
    roleObject.permissions = [PERMISSION_NAME.READ_BOARD]
    break
  }

  return roleObject
}
