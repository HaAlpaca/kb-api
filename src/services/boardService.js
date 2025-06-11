/* eslint-disable no-console */
/* eslint-disable no-useless-catch */
import { slugify } from '~/utils/formatters'
import { boardModel } from '~/models/boardModel'
import ApiError from '~/utils/ApiError'
import { StatusCodes } from 'http-status-codes'
import { cloneDeep } from 'lodash'
import { cardModel } from '~/models/cardModel'
import { checklistModel } from '~/models/checklistModel'
import { getSocketInstance } from '~/sockets/socketInstance'
import { columnModel } from '~/models/columnModel'
import { BOARD_TYPES, DEFAULT_ITEM_PER_PAGE, DEFAULT_PAGE, ROLE_NAME } from '~/utils/constants'
import { ObjectId } from 'mongodb'
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
const getDetails = async (userId, boardId, queryFilters) => {
  try {
    const board = await boardModel.getDetails(userId, boardId, queryFilters)
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
const getPrivateBoards = async (userId, page, itemPerPage, queryFilters) => {
  try {
    if (!page) page = DEFAULT_PAGE
    if (!itemPerPage) itemPerPage = DEFAULT_ITEM_PER_PAGE
    const results = await boardModel.getPrivateBoards(
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

const getArchivedBoards = async (userId, page, itemPerPage, queryFilters) => {
  try {
    if (!page) page = DEFAULT_PAGE
    if (!itemPerPage) itemPerPage = DEFAULT_ITEM_PER_PAGE
    const results = await boardModel.getArchivedBoards(
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

const getPublicBoards = async (page, itemPerPage, queryFilters) => {
  try {
    if (!page) page = DEFAULT_PAGE
    if (!itemPerPage) itemPerPage = DEFAULT_ITEM_PER_PAGE
    const results = await boardModel.getPublicBoards(parseInt(page, 10), parseInt(itemPerPage, 10), queryFilters)
    return results
  } catch (error) {
    throw error
  }
}

const getBoardAnalytics = async (userId, boardId) => {
  try {
    const board = await boardModel.getDetailsBoardAnalytics(userId, boardId)
    const allMembers = board.members.concat(board.owners)
    let analytics = {}

    if (board) {
      // Tổng số card
      const totalCards = board.cards?.length || 0
      const totalCompletedCards = board.cards?.filter(card => card.isComplete === true).length || 0
      const totalIncompleteCards = totalCards - totalCompletedCards

      // Tổng số checklist items
      const totalChecklistItems =
        board.cards?.reduce((total, card) => {
          return (
            total +
            (card.checklists?.reduce((checklistTotal, checklist) => {
              return checklistTotal + (checklist.items?.length || 0)
            }, 0) || 0)
          )
        }, 0) || 0

      const totalCompletedChecklistItems =
        board.cards?.reduce((total, card) => {
          return (
            total +
            (card.checklists?.reduce((checklistTotal, checklist) => {
              return checklistTotal + (checklist.items?.filter(item => item.isCompleted === true).length || 0)
            }, 0) || 0)
          )
        }, 0) || 0

      const totalIncompleteChecklistItems = totalChecklistItems - totalCompletedChecklistItems

      // Thống kê tỷ lệ hoàn thành của từng checklist
      const checklistsCompletion = board.cards?.flatMap(card => {
        return (
          card.checklists?.map(checklist => {
            const totalItems = checklist.items?.length || 0
            const completedItems = checklist.items?.filter(item => item.isCompleted === true).length || 0
            const completionRate = totalItems > 0 ? (completedItems / totalItems) * 100 : 0

            return {
              checklistId: checklist._id,
              checklistTitle: checklist.title,
              totalItems,
              completedItems,
              incompleteItems: totalItems - completedItems,
              completionRate: completionRate.toFixed(2) // Làm tròn đến 2 chữ số thập phân
            }
          }) || []
        )
      })

      // Thống kê số card theo từng cột và trạng thái hoàn thành
      const cardsByColumn = board.columns?.map(column => {
        const columnCards = column.cardOrderIds
          .map(cardId => board.cards?.find(card => card._id.equals(cardId)))
          .filter(card => card) // Loại bỏ các giá trị null hoặc undefined

        const completedCards = columnCards.filter(card => card.isComplete === true).length
        const incompleteCards = columnCards.length - completedCards

        return {
          columnId: column._id,
          columnTitle: column.title,
          totalCards: columnCards.length,
          completedCards,
          incompleteCards
        }
      })

      // Thống kê chi tiết theo từng thành viên
      const memberAnalytics = allMembers.map(member => {
        const memberCards = board.cards?.filter(card => {
          const cardMemberIds = card?.memberIds?.map(id => id.toString())
          return cardMemberIds?.includes(member._id.toString())
        })

        return {
          displayName: member.displayName,
          totalCards: memberCards?.length || 0,
          totalCompletedCards: memberCards?.filter(card => card.isComplete === true).length || 0,
          totalIncompleteCards: memberCards?.filter(card => card.isComplete === false).length || 0
        }
      })

      // Tổng hợp tất cả thống kê
      analytics = {
        totalCards,
        totalCompletedCards,
        totalIncompleteCards,
        totalChecklistItems,
        totalCompletedChecklistItems,
        totalIncompleteChecklistItems,
        checklistsCompletion,
        cardsByColumn,
        memberAnalytics
      }
    }

    return analytics
  } catch (error) {
    throw error
  }
}
const getRolePermissions = async (userId, boardId) => {
  try {
    const rolePermissions = await boardModel.getRolePermissions(userId, boardId)
    // console.log('rolePermissions in service: ', rolePermissions)
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

const updateAutomation = async (boardId, updateData) => {
  try {
    // Gọi tầng model để cập nhật automation
    const updatedBoard = await boardModel.update(boardId, updateData)

    if (!updatedBoard) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Board not found!')
    }

    return updatedBoard
  } catch (error) {
    throw error
  }
}

const joinPublicBoard = async (userId, boardId) => {
  try {
    const board = await boardModel.findOneById(boardId)
    console.log(board)
    if (!board) throw new ApiError(StatusCodes.NOT_FOUND, 'Board not found!')
    if (board.type === BOARD_TYPES.PRIVATE) {
      throw new ApiError(StatusCodes.FORBIDDEN, 'You are not allowed to join this board!')
    }
    if (board.memberIds.includes(userId) || board.ownerIds.includes(userId)) {
      throw new ApiError(StatusCodes.NOT_ACCEPTABLE, 'You are already a member of this board!')
    }
    const joinBoard = await boardModel.pushMemberIds(boardId, userId)
    const io = getSocketInstance()
    io.to(board._id.toString()).emit('BE_UPDATE_BOARD', board)
    return joinBoard
  } catch (error) {
    throw error
  }
}
const unArchiveBoard = async (userId, boardId) => {
  try {
    const board = await boardModel.findOneById(boardId)
    console.log(board)
    if (!board) throw new ApiError(StatusCodes.NOT_FOUND, 'Board not found!')
    console.log(board.ownerIds.includes(userId))
    if (board.ownerIds.includes(userId)) {
      throw new ApiError(StatusCodes.NOT_ACCEPTABLE, 'You can not unarchive this board!')
    }
    if (board._destroy === false) {
      throw new ApiError(StatusCodes.NOT_ACCEPTABLE, 'You can not unarchive this board!!')
    }
    const unArchiveBoard = await boardModel.unArchiveBoard(userId, boardId)

    return unArchiveBoard
  } catch (error) {
    throw error
  }
}

const archiveBoard = async (userId, boardId) => {
  try {
    const result = await boardModel.archiveBoard(userId, boardId)
    return result
  } catch (error) {
    throw error
  }
}

const leaveBoard = async (userId, boardId, newAdminId) => {
  try {
    const boardQuery = await boardModel.findOneById(boardId)

    // Kiểm tra nếu người dùng là Owner[0]
    if (boardQuery?.ownerIds[0]?.toString() === userId) {
      if (!newAdminId) {
        throw new ApiError(StatusCodes.BAD_REQUEST, 'New admin must be specified when the current owner leaves.')
      }

      // Chỉ định thành viên mới làm Owner[0]
      await boardModel.unshiftOwnerIds(boardId, newAdminId)
      await boardModel.leaveBoard(userId, boardId)
    } else {
      // Nếu không phải Owner[0], chỉ cần xóa người dùng khỏi board
      await boardModel.leaveBoard(userId, boardId)
    }

    // Lấy tất cả các card thuộc board
    const cards = await cardModel.find({ boardId: new ObjectId(boardId) })
    const cardIds = cards.map(card => card._id)

    // Xóa người dùng khỏi tất cả các card trong board
    await cardModel.updateMany({ _id: { $in: cardIds } }, { $pull: { memberIds: new ObjectId(userId) } })

    // Xóa người dùng khỏi tất cả các checklist liên quan đến các card
    await checklistModel.updateMany(
      { cardId: { $in: cardIds.map(id => id.toString()) } },
      { $pull: { assignedUserIds: new ObjectId(userId) } }
    )

    return { message: 'User has left the board successfully.' }
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
  getPrivateBoards,
  getPublicBoards,
  getBoardAnalytics,
  updateAutomation,
  joinPublicBoard,
  archiveBoard,
  getArchivedBoards,
  unArchiveBoard,
  leaveBoard
}
