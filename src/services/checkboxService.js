/* eslint-disable no-useless-catch */
// import { StatusCodes } from 'http-status-codes'
// import ApiError from '~/utils/ApiError'
// import { boardModel } from '~/models/boardModel'
import { StatusCodes } from 'http-status-codes'
// import { cardModel } from '~/models/cardModel'
import { checkboxModel } from '~/models/checkboxModel'
import ApiError from '~/utils/ApiError'

// khong auto detect file type
const createNew = async (userId, reqBody) => {
  try {
    const newAttachment = {
      name: reqBody.name
    }

    // goi tang model xu li ban ghi vao db
    const createdCheckbox = await checkboxModel.createNew(userId, newAttachment)
    const getNewCheckbox = await checkboxModel.findOneById(
      createdCheckbox.insertedId
    )
    const attachmentId = getNewCheckbox._id.toString()
    if (reqBody.cardId) {
      await checkboxModel.pushCardCheckboxIds(reqBody.cardId, attachmentId)
    }
    return getNewCheckbox
  } catch (error) {
    throw error
  }
}

const update = async (checkboxId, reqBody) => {
  try {
    const checkbox = await checkboxModel.findOneById(checkboxId)
    if (!checkbox)
      throw new ApiError(StatusCodes.NOT_FOUND, 'Checkbox not found!')

    const updateData = {
      name: reqBody.name,
      is_checked: reqBody.is_checked,
      updatedAt: Date.now()
    }

    // console.log(updateData)
    const updateCheckbox = await checkboxModel.update(checkboxId, updateData)
    return updateCheckbox
  } catch (error) {
    throw error
  }
}
const updateCheckboxChecked = async reqBody => {
  try {
    const checkboxes = reqBody.checkboxes
    const updateCheckbox = await checkboxModel.updateCheckboxChecked(checkboxes)

    return {
      message: 'update checkbox successfully',
      details: updateCheckbox
    }
  } catch (error) {
    throw error
  }
}
const deleteCheckbox = async checkboxId => {
  try {
    const targetCheckbox = await checkboxModel.findOneById(checkboxId)
    // console.log('🚀 ~ deleteItem ~ targetColumn:', targetColumn)
    if (!targetCheckbox)
      throw new ApiError(StatusCodes.NOT_FOUND, 'Checkbox not found!')
    // xoa attachment
    await checkboxModel.deleteOneById(checkboxId)
    // xoa attachment thuoc card
    await checkboxModel.pushCardCheckboxIds(checkboxId)
    return {
      deleteResult: 'Checkbox delete successfully',
      checkboxId
    }
  } catch (error) {
    throw error
  }
}

export const checkboxService = {
  createNew,
  update,
  deleteCheckbox,
  updateCheckboxChecked
}
