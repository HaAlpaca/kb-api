/* eslint-disable no-useless-catch */
import { slugify } from '~/utils/formatters'
import { boardModel } from '~/models/boardModel'
import ApiError from '~/utils/ApiError'
import { StatusCodes } from 'http-status-codes'
import { cloneDeep } from 'lodash'
import { cardModel } from '~/models/cardModel'
import { actionModel } from '~/models/actionModel'

import { columnModel } from '~/models/columnModel'
import {
  ACTION_TYPES,
  DEFAULT_ITEM_PER_PAGE,
  DEFAULT_PAGE
} from '~/utils/constants'
const createNew = async (userId, reqBody) => {
  try {
    // Xử lý dữ liệu đặc thù
    const newBoard = {
      ...reqBody,
      slug: slugify(reqBody.title)
    }

    // Gọi tầng model để xử lý bản ghi vào DB
    const createdBoard = await boardModel.createNew(userId, newBoard)
    const getNewBoard = await boardModel.findOneById(createdBoard.insertedId)

    // // Ghi lại hành động vào actionModel
    // await actionModel.createNew(userId, {
    //   type: ACTION_TYPES.CREATE_BOARD,
    //   description: `User ${} created a new board "${getNewBoard.title}"`,
    //   targetType: 'board',
    //   targetId: getNewBoard._id.toString(),
    //   boardId: getNewBoard._id.toString(),
    //   metadata: {
    //     visibility: getNewBoard.type || 'private'
    //   }
    // })

    return getNewBoard
  } catch (error) {
    throw error
  }
}
const getDetails = async (userId, boardId) => {
  try {
    const board = await boardModel.getDetails(userId, boardId)
    if (!board) throw new ApiError(StatusCodes.NOT_FOUND, 'Board not found!')

    // ******************************************************* Label
    // Clone object tránh làm thay đổi dữ liệu gốc
    const resBoard = cloneDeep(board)

    // Map labels theo _id để truy vấn nhanh hơn
    const labelMap = new Map(
      resBoard.labels.map(label => [label._id.toString(), label])
    )

    // Gán labels vào từng card
    resBoard.cards.forEach(card => {
      card.labels = (card.cardLabelIds || [])
        .map(labelId => labelMap.get(labelId.toString()))
        .filter(label => label)
    })

    // Copy cards vào columns
    resBoard.columns.forEach(column => {
      column.cards = resBoard.cards.filter(card =>
        card.columnId.equals(column._id)
      )
    })
    // Xóa cards sau khi đã phân loại vào columns
    delete resBoard.cards

    return resBoard
  } catch (error) {
    throw error
  }
}

const update = async (boardId, reqBody) => {
  try {
    let updateBoard = {}
    const updateData = {
      ...reqBody,
      updatedAt: Date.now()
    }
    if (updateData.incomingMemberInfo) {
      updateBoard = await boardModel.updateMembers(boardId, updateData)
    } else {
      updateBoard = await boardModel.update(boardId, updateData)
    }
    // console.log(updateData)
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

const getBoards = async (userId, page, itemPerPage, queryFilters) => {
  try {
    if (!page) page = DEFAULT_PAGE
    if (!itemPerPage) itemPerPage = DEFAULT_ITEM_PER_PAGE
    const results = await boardModel.getBoards(
      userId,
      parseInt(page, 10),
      parseInt(itemPerPage, 10),
      queryFilters
    )
    return results
  } catch (error) {
    throw error
  }
}

export const boardService = {
  createNew,
  getDetails,
  update,
  moveCardToDifferentColumn,
  getBoards
}
