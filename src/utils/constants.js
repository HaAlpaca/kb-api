import { env } from '~/config/environment'

// nhung domain duoc truy cap vao api
// tuc la domain cua client
export const WHITELIST_DOMAINS = [
  // 'http://localhost:5173'
  'https://trello-web-dun.vercel.app'
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
