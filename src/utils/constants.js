import { env } from '~/config/environment'

// nhung domain duoc truy cap vao api
// tuc la domain cua client
export const WHITELIST_DOMAINS = [
  // 'http://localhost:5173'
  'https://trello-web-dun.vercel.app',
  'https://kb-web-yrx5.vercel.app/',
  'http://localhost:4173'
  // da luon luon cho phep
  //more
]

export const BOARD_TYPES = {
  PUBLIC: 'public',
  PRIVATE: 'private'
}
export const WEBSITE_DOMAIN =
  env.BUILD_MODE === 'production' ? env.WEBSITE_DOMAIN_PRODUCTION : env.WEBSITE_DOMAIN_DEVELOPMENT

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

export const TASK_TYPES = {}

export const ACTION_TYPES = {
  ASSIGN_CHECKLIST: 'assign_checklist',
  ASSIGN_CARD: 'assign_card',
  UPDATE_DUEDATE: 'update_dueDate'
}

export const OWNER_ACTION_TARGET = {
  CARD: 'cards',
  COLUMN: 'columns',
  BOARD: 'boards'
}
export const ROLE_NAME = {
  ADMIN: 'admin',
  MODERATOR: 'moderator',
  USER: 'user'
}

export const PERMISSION_NAME = {
  // member
  INVITE_MEMBER: 'invite_member',
  REMOVE_MEMBER: 'remove_member',
  UPDATE_MEMBER_ROLE: 'update_member_role',
  UPDATE_MEMBER_PERMISSION: 'update_member_permission',
  // board
  READ_BOARD: 'read_board',
  UPDATE_BOARD: 'update_board',
  DELETE_BOARD: 'delete_board',
  BOARD_ANALYTICS: 'board_analytics',
  // COLUMN
  EDIT_COLUMN: 'edit_column',
  // CARD
  READ_CARD: 'read_card',
  CREATE_CARD: 'create_card',
  UPDATE_CARD: 'update_card',
  DELETE_CARD: 'delete_card',
  // LABEL
  CREATE_LABEL: 'create_label',
  UPDATE_LABEL: 'update_label',
  DELETE_LABEL: 'delete_label',
  // CHECKLIST
  CREATE_CHECKLIST: 'create_checklist',
  UPDATE_CHECKLIST: 'update_checklist',
  DELETE_CHECKLIST: 'delete_checklist',
  // CARD ASSIGN
  UPDATE_CARD_ASSIGN: 'update_card_assign'
}
