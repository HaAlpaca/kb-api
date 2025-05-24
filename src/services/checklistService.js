/* eslint-disable no-useless-catch */
import { checklistModel } from '~/models/checklistModel'
import { StatusCodes } from 'http-status-codes'
import ApiError from '~/utils/ApiError'
import { actionModel } from '~/models/actionModel'
import {
  CARD_MEMBER_ACTION,
  ACTION_TYPES,
  WEBSITE_DOMAIN,
  OWNER_ACTION_TARGET
} from '~/utils/constants'
import { userModel } from '~/models/userModel'
import { BrevoProvider } from '~/providers/BrevoProvider'
import { ObjectId } from 'mongodb'

const getDetails = async (userId, checklistId) => {
  try {
    const checklist = await checklistModel.getDetails(userId, checklistId)
    if (!checklist)
      throw new ApiError(StatusCodes.NOT_FOUND, 'Checklist not found!')
    return checklist
  } catch (error) {
    throw error
  }
}

const createNew = async (userId, reqBody) => {
  try {
    const newChecklist = {
      ...reqBody
    }

    const createdChecklist = await checklistModel.createNew(newChecklist)
    const getNewChecklist = await checklistModel.findOneById(
      createdChecklist.insertedId
    )
    if (getNewChecklist) {
      // Cập nhật lại danh sách checklist trong card
      await checklistModel.pushCardChecklistIds(
        getNewChecklist.cardId,
        getNewChecklist._id
      )
    }
    return getNewChecklist
  } catch (error) {
    throw error
  }
}

const update = async (userInfo, checklistId, reqBody) => {
  try {
    const checklist = await checklistModel.findOneById(checklistId)
    if (!checklist)
      throw new ApiError(StatusCodes.NOT_FOUND, 'Checklist not found!')

    let updatedChecklist = {}
    const updateData = {
      ...reqBody,
      updatedAt: Date.now()
    }

    if (reqBody.createCheckItem) {
      updatedChecklist = await checklistModel.addCheckItem(
        checklistId,
        reqBody.createCheckItem
      )
    } else if (reqBody.updateCheckItem) {
      updatedChecklist = await checklistModel.updateCheckItem(
        checklistId,
        reqBody.updateCheckItem._id,
        reqBody.updateCheckItem
      )
    } else if (reqBody.deleteCheckItemId) {
      updatedChecklist = await checklistModel.deleteCheckItem(
        checklistId,
        reqBody.deleteCheckItemId
      )
    } else if (reqBody.updateCheckItemOrder) {
      updatedChecklist = await checklistModel.reorderCheckItems(
        checklistId,
        reqBody.updateCheckItemOrder
      )
    } else if (reqBody.updateIncomingAssignedUser) {
      const incoming = reqBody.updateIncomingAssignedUser
      updatedChecklist = await checklistModel.updateIncomingAssignedUser(
        checklistId,
        incoming
      )
      if (incoming.action === CARD_MEMBER_ACTION.ADD) {
        await actionModel.createNew({
          assignerId: userInfo._id,
          assigneeId: incoming.userId,
          boardId: incoming.boardId,
          type: ACTION_TYPES.ASSIGN_CHECKLIST,
          metadata: {
            ownerTargetType: OWNER_ACTION_TARGET.CARD,
            ownerTargetId: incoming.cardId,
            targetId: checklistId,
            dueDate: updatedChecklist.dueDate ? updatedChecklist.dueDate : null
          }
        })
        // send email
        // const getAssignee = await userModel.findOneById(userInfo._id)
        // const getAssigner = await userModel.findOneById(incoming.userId)
        // const taskLink = `${WEBSITE_DOMAIN}/boards/${
        //   incoming.boardId
        // }?cardModal=${updatedChecklist.cardId.toString()}`
        // const customSubject = `KbWorkspace: ${getAssigner.displayName} assigned a new task to you!`
        // const htmlContent = `
        //           <h3>Go to your task</h3>
        //           <h3>${taskLink}</h3>
        //           <h3>Sincerely,<br/> - HaAlpaca - </h3>
        //       `
        // await BrevoProvider.sendEmail(
        //   getAssignee.email,
        //   customSubject,
        //   htmlContent
        // )
      }
    } else {
      updatedChecklist = await checklistModel.update(checklistId, updateData)
      // console.log(updatedChecklist)
      if (updateData.dueDate) {
        const queryCondition = [
          {
            'metadata.targetId': updatedChecklist._id.toString()
          }
        ]
        actionModel.findAndUpdateMany(queryCondition, {
          'metadata.dueDate': updateData.dueDate,
          updatedAt: Date.now()
        })
      }
    }

    // Kiểm tra trạng thái hoàn thành của checklist
    const updatedChecklistDetails = await checklistModel.findOneById(
      checklistId
    )
    const allItemsCompleted = updatedChecklistDetails.items.every(
      item => item.isCompleted === true
    )

    // Cập nhật trạng thái isCompleted của checklist
    await checklistModel.update(checklistId, {
      isCompleted: allItemsCompleted,
      updatedAt: Date.now()
    })

    return updatedChecklist
  } catch (error) {
    throw error
  }
}

const deleteChecklist = async checklistId => {
  try {
    const targetChecklist = await checklistModel.findOneById(checklistId)
    if (!targetChecklist)
      throw new ApiError(StatusCodes.NOT_FOUND, 'Checklist not found!')
    // pull checklistId vao cardChecklistIds
    await checklistModel.pullCardChecklistIds(checklistId)
    // xoa checklist
    await checklistModel.deleteOneById(checklistId)
    return {
      deleteResult: 'Checklist delete successfully',
      checklistId,
      cardId: targetChecklist.cardId
    }
  } catch (error) {
    throw error
  }
}

const addCheckItem = async (checklistId, checkItemData) => {
  try {
    const checklist = await checklistModel.getDetailsById(checklistId)
    if (!checklist)
      throw new ApiError(StatusCodes.NOT_FOUND, 'Checklist not found!')

    const newCheckItem = {
      ...checkItemData,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isCompleted: false // Mặc định item mới chưa hoàn thành
    }

    const updatedChecklist = await checklistModel.addCheckItem(
      checklistId,
      newCheckItem
    )

    // Đảm bảo checklist không được đánh dấu là hoàn thành
    await checklistModel.update(checklistId, {
      isCompleted: false,
      updatedAt: Date.now()
    })

    return updatedChecklist
  } catch (error) {
    throw error
  }
}

const updateCheckItem = async (checklistId, itemId, checkItemData) => {
  try {
    const updatedCheckItem = await checklistModel.updateCheckItem(
      checklistId,
      itemId,
      checkItemData
    )
    if (!updatedCheckItem)
      throw new ApiError(StatusCodes.NOT_FOUND, 'Check item not found!')

    // Kiểm tra trạng thái hoàn thành của checklist
    const checklist = await checklistModel.findOneById(checklistId)
    const allItemsCompleted = checklist.items.every(
      item => item.isCompleted === true
    )

    // Cập nhật trạng thái isCompleted của checklist
    await checklistModel.update(checklistId, {
      isCompleted: allItemsCompleted,
      updatedAt: Date.now()
    })

    return updatedCheckItem
  } catch (error) {
    throw error
  }
}

const deleteCheckItem = async (checklistId, itemId) => {
  try {
    const deletedCheckItem = await checklistModel.deleteCheckItem(
      checklistId,
      itemId
    )
    if (!deletedCheckItem)
      throw new ApiError(StatusCodes.NOT_FOUND, 'Check item not found!')

    // Kiểm tra trạng thái hoàn thành của checklist
    const checklist = await checklistModel.findOneById(checklistId)
    const allItemsCompleted = checklist.items.every(
      item => item.isCompleted === true
    )

    // Cập nhật trạng thái isCompleted của checklist
    await checklistModel.update(checklistId, {
      isCompleted: allItemsCompleted,
      updatedAt: Date.now()
    })

    return deletedCheckItem
  } catch (error) {
    throw error
  }
}

const updateCheckItemOrder = async (checklistId, itemOrder) => {
  try {
    const updatedOrder = await checklistModel.updateCheckItemOrder(
      checklistId,
      itemOrder
    )
    if (!updatedOrder)
      throw new ApiError(
        StatusCodes.NOT_FOUND,
        'Checklist or check item not found!'
      )
    return updatedOrder
  } catch (error) {
    throw error
  }
}

export const checklistService = {
  getDetails,
  createNew,
  update,
  deleteChecklist,
  addCheckItem,
  updateCheckItem,
  deleteCheckItem,
  updateCheckItemOrder
}
