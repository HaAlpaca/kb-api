import { env } from '~/config/environment'

// nhung domain duoc truy cap vao api
// tuc la domain cua client
export const WHITELIST_DOMAINS = [
  // 'http://localhost:5173'
  'https://trello-web-dun.vercel.app',
  'http://localhost:4173'
  // da luon luon cho phep
  //more
]

export const BOARD_TYPES = {
  PUBLIC: 'public',
  PRIVATE: 'private'
}
export const WEBSITE_DOMAIN =
  env.BUILD_MODE === 'production'
    ? env.WEBSITE_DOMAIN_PRODUCTION
    : env.WEBSITE_DOMAIN_DEVELOPMENT

export const DEFAULT_PAGE = 1
export const DEFAULT_ITEM_PER_PAGE = 12

export const INVITATION_TYPES = {
  BOARD_INVITATION: 'BOARD_INVITATION'
}
export const BOARD_INVITATION_STATUS = {
  PENDING: 'PENDING',
  ACCEPTED: 'ACCEPTED',
  REJECTED: 'REJECTED'
}

export const CARD_MEMBER_ACTION = {
  ADD: 'ADD',
  REMOVE: 'REMOVE'
}

export const ACTION_TYPES = {
  CREATE_BOARD: 'create_board', // Tạo board mới
  UPDATE_BOARD: 'update_board', // Cập nhật thông tin board
  DELETE_BOARD: 'delete_board', // Xóa board

  CREATE_COLUMN: 'create_column', // Tạo column mới
  UPDATE_COLUMN: 'update_column', // Cập nhật thông tin column
  DELETE_COLUMN: 'delete_column', // Xóa column

  CREATE_CARD: 'create_card', // Tạo card mới
  UPDATE_CARD: 'update_card', // Cập nhật thông tin card
  DELETE_CARD: 'delete_card', // Xóa card
  MOVE_CARD: 'move_card_column', // Di chuyển card giữa các column

  ADD_MEMBER_TO_BOARD: 'add_member_to_board', // Thêm thành viên vào board
  REMOVE_MEMBER_FROM_BOARD: 'remove_member_from_board', // Xóa thành viên khỏi board

  PROMOTE_MEMBER_TO_OWNER: 'promote_member_to_owner', // Thăng cấp thành viên lên owner
  DEMOTE_OWNER_TO_MEMBER: 'demote_owner_to_member', // Giáng cấp owner xuống thành viên

  ADD_MEMBER_TO_CARD: 'add_member_to_card', // Thêm thành viên vào card
  REMOVE_MEMBER_FROM_CARD: 'remove_member_from_card', // Xóa thành viên khỏi card

  ADD_LABEL_TO_CARD: 'add_label_to_card', // Thêm nhãn vào card
  REMOVE_LABEL_FROM_CARD: 'remove_label_from_card', // Xóa nhãn khỏi card

  ADD_ATTACHMENT_TO_CARD: 'add_attachment_to_card', // Thêm tệp đính kèm vào card
  REMOVE_ATTACHMENT_FROM_CARD: 'remove_attachment_from_card', // Xóa tệp đính kèm khỏi card

  ADD_COMMENT_TO_CARD: 'add_comment_to_card', // Thêm bình luận vào card
  DELETE_COMMENT_FROM_CARD: 'delete_comment_from_card', // Xóa bình luận khỏi card

  CREATE_CHECKLIST: 'create_checklist', // Tạo checklist mới
  UPDATE_CHECKLIST: 'update_checklist', // Cập nhật checklist
  DELETE_CHECKLIST: 'delete_checklist', // Xóa checklist
  CHECK_ITEM: 'check_item', // Đánh dấu hoàn thành item trong checklist
  UNCHECK_ITEM: 'uncheck_item', // Bỏ đánh dấu hoàn thành item trong checklist

  ADD_COVER_TO_CARD: 'add_cover_to_card', // Thêm cover vào card
  UPDATE_COVER_ON_CARD: 'update_cover_on_card' // Thay đổi cover trên card
}
