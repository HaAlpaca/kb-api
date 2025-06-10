/* eslint-disable no-useless-catch */
import { cardModel } from '~/models/cardModel'
import { columnModel } from '~/models/columnModel'
// import { CloudinaryProvider } from '~/providers/CloudinaryProvider'
import { StatusCodes } from 'http-status-codes'
import ApiError from '~/utils/ApiError'
import { attachmentService } from './attachmentService'
import { ACTION_TYPES, CARD_MEMBER_ACTION, OWNER_ACTION_TARGET } from '~/utils/constants'
import { actionModel } from '~/models/actionModel'
import { getSocketInstance } from '~/sockets/socketInstance'
import { boardModel } from '~/models/boardModel'

const getDetails = async (userId, cardId) => {
  try {
    const card = await cardModel.getDetails(userId, cardId)
    if (!card) throw new ApiError(StatusCodes.NOT_FOUND, 'Card not found!')

    return card
  } catch (error) {
    throw error
  }
}

const createNew = async reqBody => {
  try {
    // xu li tuy dac thu
    const newCard = {
      ...reqBody
    }
    // goi tang model xu li ban ghi vao db
    const createdCard = await cardModel.createNew(newCard)
    const getNewCard = await cardModel.findOneById(createdCard.insertedId)
    if (getNewCard) {
      // cap nhat lai mang cardOrderIds
      await columnModel.pushCardOrderIds(getNewCard)
    }
    // tra du lieu ve controller !!!! service luon co return
    return getNewCard
  } catch (error) {
    throw error
  }
}

const update = async (cardId, reqBody, cardCoverFile, userInfo) => {
  try {
    const updateData = {
      ...reqBody,
      updatedAt: Date.now()
    }
    let updatedCard = {}
    if (cardCoverFile) {
      // const uploadResult = await CloudinaryProvider.streamUpload(
      //   cardCoverFile.buffer,
      //   'KanbanBoard/images'
      // )
      // attachment to card
      const attachment = await attachmentService.createNew(userInfo._id, { cardId: cardId }, cardCoverFile)

      // console.log('uploadResult: ', uploadResult)
      updatedCard = await cardModel.update(cardId, {
        cover: attachment.link
      })
    } else if (updateData.commentToAdd) {
      // tao du lieu comment to db
      const commentData = {
        ...updateData.commentToAdd,
        userId: userInfo._id,
        userEmail: userInfo.email,
        commentedAt: Date.now()
      }
      updatedCard = await cardModel.unshiftNewComment(cardId, commentData)
    } else if (updateData.incomingMemberInfo) {
      const incoming = updateData.incomingMemberInfo
      updatedCard = await cardModel.updateMembers(cardId, incoming)
      const card = await cardModel.findOneById(cardId)

      if (updateData.incomingMemberInfo.action === CARD_MEMBER_ACTION.ADD) {
        const createdAction = await actionModel.createNew({
          assignerId: userInfo._id,
          assigneeId: incoming.userId,
          boardId: updatedCard.boardId.toString(),
          type: ACTION_TYPES.ASSIGN_CARD,
          metadata: {
            ownerTargetType: OWNER_ACTION_TARGET.COLUMN,
            ownerTargetId: updatedCard.columnId.toString(),
            targetId: updatedCard._id.toString(),
            targetName: card.title,
            dueDate: updatedCard.dueDate ? updatedCard.dueDate : null
          }
        })
        const action = await actionModel.findOneById(createdAction.insertedId)
        // Phát sự kiện socket sau khi cập nhật card
        const io = getSocketInstance()
        io.emit('BE_USER_RECEIVED_ACTION', action)
      }
    } else if (updateData.updateLabels) {
      updatedCard = await cardModel.updateLabels(cardId, updateData.updateLabels)
    } else if (updateData.updateAttachments) {
      updatedCard = await cardModel.updateAttachments(cardId, updateData.updateAttachments)
    } else if (updateData.updateDueDate) {
      updatedCard = await cardModel.updateDueDate(cardId, updateData.updateDueDate)
      //  update due date action
      const card = await cardModel.findOneById(cardId)
      const board = await boardModel.findOneById(card.boardId)
      for (const item of card.memberIds) {
        const action = await actionModel.createNew({
          assignerId: userInfo._id,
          assigneeId: item.toString(),
          boardId: card.boardId.toString(),
          type: ACTION_TYPES.UPDATE_DUEDATE,
          metadata: {
            ownerTargetType: OWNER_ACTION_TARGET.BOARD,
            ownerTargetId: card.boardId.toString(),
            ownerTargetName: board.title,
            targetId: cardId,
            targetType: 'card',
            targetName: card.title,
            dueDate: updateData.updateDueDate
          }
        })

        const io = getSocketInstance()
        io.emit('BE_USER_RECEIVED_ACTION', action)
      }
    } else if (updateData.updateChecklists) {
      updatedCard = await cardModel.updateChecklists(cardId, updateData.updateChecklists)
    } else {
      updatedCard = await cardModel.update(cardId, updateData)
    }

    return updatedCard
  } catch (error) {
    throw error
  }
}

const toogleCardComplete = async (userId, cardId) => {
  try {
    const card = await cardModel.getDetails(userId, cardId)
    if (!card) throw new ApiError(StatusCodes.NOT_FOUND, 'Card not found!')

    const updatedCard = await cardModel.toogleCardComplete(cardId, card.isComplete)

    return updatedCard
  } catch (error) {
    throw error
  }
}

export const cardService = {
  getDetails,
  createNew,
  update,
  toogleCardComplete
}
