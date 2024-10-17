/* eslint-disable no-useless-catch */
import { slugify } from '~/utils/formatters'
import { boardModel } from '~/models/boardModel'
import ApiError from '~/utils/ApiError'
import { StatusCodes } from 'http-status-codes'
import { cloneDeep } from 'lodash'
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
    // clone
    const resBoard = cloneDeep(board)
    // copy cards into columns
    resBoard.columns.forEach(column => {
      // mongodb support equal
      column.cards = resBoard.cards.filter(card =>
        card.columnId.equals(column._id)
      )
      // copare between objectId => then we need to convert string
      // column.cards = resBoard.cards.filter(
      //   card => card.columnId.toString() === column._id.toString()
      // )
    })
    // delete cards
    delete resBoard.cards
    return resBoard
  } catch (error) {
    throw error
  }
}

export const boardService = {
  createNew,
  getDetails
}
