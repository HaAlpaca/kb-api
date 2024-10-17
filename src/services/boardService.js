/* eslint-disable no-useless-catch */
import { slugify } from '~/utils/formatters'
import { boardModel } from '~/models/boardModel'
import ApiError from '~/utils/ApiError'
import { StatusCodes } from 'http-status-codes'
const createNew = async reqBody => {
  try {
    // xu li tuy dac thu
    const newBoard = {
      ...reqBody,
      slug: slugify(reqBody.title)
    }
    // goi tang model xu li ban ghi vao db
    const createdBoard = await boardModel.createNew(newBoard)
    const getNewBoard = await boardModel.findOneById(createdBoard.insertedId)
    // tra du lieu ve controller !!!! service luon co return
    return getNewBoard
  } catch (error) {
    throw error
  }
}
const getDetails = async boardId => {
  try {
    const board = await boardModel.getDetails(boardId)
    if (!board) throw new ApiError(StatusCodes.NOT_FOUND, 'Board not found!')
    return board
  } catch (error) {
    throw error
  }
}

export const boardService = {
  createNew,
  getDetails
}
