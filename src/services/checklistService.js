/* eslint-disable no-useless-catch */
import { checklistModel } from '~/models/checklistModel'
import { cardModel } from '~/models/cardModel'
import { StatusCodes } from 'http-status-codes'
import ApiError from '~/utils/ApiError'
import { actionModel } from '~/models/actionModel'
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
    // eslint-disable-next-line no-console
    // console.log('userId: ', userId)

    const createdChecklist = await checklistModel.createNew(newChecklist)
    const getNewChecklist = await checklistModel.findOneById(
      createdChecklist.insertedId
    )
    if (getNewChecklist) {
      // cap nhat lai mang cardOrderIds
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

const update = async (checklistId, reqBody) => {
  try {
    const checklist = await checklistModel.findOneById(checklistId)
    if (!checklist)
      throw new ApiError(StatusCodes.NOT_FOUND, 'Checklist not found!')
    // update
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
      updatedChecklist = await checklistModel.updateIncomingAssignedUser(
        checklistId,
        reqBody.updateIncomingAssignedUser._id,
        reqBody.updateIncomingAssignedUser.incomingInfo
      )
    } else {
      updatedChecklist = await checklistModel.update(checklistId, updateData)
    }

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
      updatedAt: Date.now()
    }

    const updatedChecklist = await checklistModel.addCheckItem(
      checklistId,
      newCheckItem
    )
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
