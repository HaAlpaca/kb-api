/* eslint-disable no-useless-catch */
import { slugify } from '~/utils/formatters'

const createNew = async reqBody => {
  try {
    // xu li tuy dac thu
    const newBoard = {
      ...reqBody,
      slug: slugify(reqBody.title)
    }
    // goi tang model xu li ban ghi vao db
    // tra du lieu ve controller !!!! service luon co return
    return newBoard
  } catch (error) {
    throw error
  }
}

export const boardService = {
  createNew
}
