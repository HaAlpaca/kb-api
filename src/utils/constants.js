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
