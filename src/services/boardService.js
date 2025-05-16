/* eslint-disable no-console */
/* eslint-disable no-useless-catch */
import { slugify } from '~/utils/formatters'
import { boardModel } from '~/models/boardModel'
import ApiError from '~/utils/ApiError'
import { StatusCodes } from 'http-status-codes'
import { cloneDeep } from 'lodash'
import { cardModel } from '~/models/cardModel'

import { columnModel } from '~/models/columnModel'
import { DEFAULT_ITEM_PER_PAGE, DEFAULT_PAGE, ROLE_NAME } from '~/utils/constants'
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
    const labelMap = new Map(resBoard.labels.map(label => [label._id.toString(), label]))

    // Gán labels vào từng card
    resBoard.cards.forEach(card => {
      card.labels = (card.cardLabelIds || []).map(labelId => labelMap.get(labelId.toString())).filter(label => label)
    })

    // Copy cards vào columns
    resBoard.columns.forEach(column => {
      column.cards = resBoard.cards.filter(card => card.columnId.equals(column._id))
    })
    // Xóa cards sau khi đã phân loại vào columns
    delete resBoard.cards

    resBoard.allMembers = resBoard.owners.concat(resBoard.members).map(member => ({
      ...member,
      boardRole: resBoard.usersRole.find(userRole => userRole.userId.toString() === member._id.toString())?.role
    }))

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
    const results = await boardModel.getBoards(userId, parseInt(page, 10), parseInt(itemPerPage, 10), queryFilters)
    return results
  } catch (error) {
    throw error
  }
}

const getBoardAnalytics = async (userId, boardId, query) => {
  try {
    console.log(query)
    // Lấy thông tin board và các dữ liệu liên quan
    const board = await boardModel.getDetailsBoardAnalytics(userId, boardId)
    const allMembers = board.members.concat(board.owners)
    let analytics = {}

    if (board) {
      analytics = allMembers.map(member => {
        // Lọc các card mà thành viên tham gia
        const memberCards = board.cards?.filter(card => {
          const cardMemberIds = card?.memberIds?.map(id => id.toString())
          return cardMemberIds?.includes(member._id.toString())
        })

        // Tính tổng số checklist items hoàn thành
        const totalCompletedChecklists = memberCards?.reduce((total, card) => {
          const completedItems = card.checklists?.reduce((checklistTotal, checklist) => {
            return checklistTotal + checklist.items.filter(item => item.isCompleted === true).length
          }, 0)
          return total + completedItems
        }, 0)

        return {
          ...member,
          totalCards: memberCards?.length || 0, // Tổng số card mà thành viên tham gia
          totalCompletedCards: memberCards?.filter(card => card.isComplete === true).length || 0, // Tổng số card hoàn thành
          totalIncompleteCards: memberCards?.filter(card => card.isComplete === false).length || 0, // Tổng số card chưa hoàn thành
          totalCompletedChecklists: totalCompletedChecklists || 0 // Tổng số checklist items hoàn thành
        }
      })
    }

    return analytics
  } catch (error) {
    throw error
  }
}

const getRolePermissions = async (userId, boardId) => {
  try {
    const rolePermissions = await boardModel.getRolePermissions(userId, boardId)
    console.log('rolePermissions in service: ', rolePermissions)
    if (rolePermissions) {
      return {
        ...rolePermissions,
        userId: rolePermissions.userId.toString()
      }
    }

    return null
  } catch (error) {
    throw error
  }
}

const updateUserRole = async (userId, boardId, role) => {
  try {
    const rolePermissions = await boardModel.getRolePermissions(userId, boardId)
    let result = {}
    if (rolePermissions.role === role) {
      return {
        ...rolePermissions,
        userId: rolePermissions.userId.toString()
      }
    } else {
      if (role === ROLE_NAME.ADMIN) {
        result = await boardModel.updateUserRole(userId, boardId, role)
      }
      if (role === ROLE_NAME.MODERATOR) {
        result = await boardModel.updateUserRole(userId, boardId, role)
      }
      if (role === ROLE_NAME.USER) {
        result = await boardModel.updateUserRole(userId, boardId, role)
      }
    }
    return result
  } catch (error) {
    throw error
  }
}

export const boardService = {
  getRolePermissions,
  updateUserRole,
  createNew,
  getDetails,
  update,
  moveCardToDifferentColumn,
  getBoards,
  getBoardAnalytics
}
