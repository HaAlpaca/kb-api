/* eslint-disable no-useless-catch */
import { slugify } from '~/utils/formatters'
import { boardModel } from '~/models/boardModel'
import ApiError from '~/utils/ApiError'
import { StatusCodes } from 'http-status-codes'
import { cloneDeep } from 'lodash'
import { cardModel } from '~/models/cardModel'

import { columnModel } from '~/models/columnModel'
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
const update = async (boardId, reqBody) => {
  try {
    const updateData = {
      ...reqBody,
      updatedAt: Date.now()
    }
    // console.log(updateData)
    const updateBoard = await boardModel.update(boardId, updateData)
    return updateBoard
  } catch (error) {
    throw error
  }
}

const moveCardToDifferentColumn = async reqBody => {
  try {
    // cap nhat card order ids ban dau => xoa card id khoi cards va cardOrderIds
    await columnModel.update(reqBody.prevColumnId, {
      cardOrderIds: reqBody.prevCardOrderIds,
      updatedAt: Date.now()
    })
    // cap nhat card order ids sau => them card id vao cards va cardOrderIds maping lai
    await columnModel.update(reqBody.nextColumnId, {
      cardOrderIds: reqBody.nextCardOrderIds,
      updatedAt: Date.now()
    })
    // cap nhat lai truong column id moi vao card da keo
    await cardModel.update(reqBody.currentCardId, {
      columnId: reqBody.nextColumnId
    })
    return { updateResult: 'Successfully' }
  } catch (error) {
    throw error
  }
}

export const boardService = {
  createNew,
  getDetails,
  update,
  moveCardToDifferentColumn
}
