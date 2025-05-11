/* eslint-disable no-useless-catch */

import { actionModel } from '~/models/actionModel'

export const getActions = async userId => {
  try {
    const getActions = await actionModel.findByUser(userId)
    // data dang tra ve inviter la 1 mang => can dua ve 1 object thoi
    return getActions
  } catch (error) {
    throw error
  }
}

export const actionService = {
  getActions
}
