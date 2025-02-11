/* eslint-disable no-useless-catch */
import { StatusCodes } from 'http-status-codes'
import { boardModel } from '~/models/boardModel'
import { labelModel } from '~/models/labelModel'
import ApiError from '~/utils/ApiError'
const createNew = async (userId, reqBody) => {
  try {
    // xu li tuy dac thu
    const newLabel = {
      title: reqBody.title,
      colour: reqBody.colour
    }
    // goi tang model xu li ban ghi vao db
    const createdLabel = await labelModel.createNew(userId, newLabel)
    const getNewLabel = await labelModel.findOneById(createdLabel.insertedId)
    const labelId = getNewLabel._id.toString()
    if (reqBody.boardId) {
      await labelModel.pushBoardLabelIds(reqBody.boardId, labelId)
    }
    if (reqBody.cardId) {
      await labelModel.pushCardLabelIds(reqBody.cardId, labelId)
    }
    // tra du lieu ve controller !!!! service luon co return
    return getNewLabel
  } catch (error) {
    throw error
  }
}

const getBoardLabels = async boardId => {
  try {
    const board = await boardModel.findOneById(boardId)
    if (!board) throw new ApiError(StatusCodes.NOT_FOUND, 'Board not found!')
    const result = await labelModel.getBoardLabels(boardId)
    return result
  } catch (error) {
    throw error
  }
}

const update = async (labelId, reqBody) => {
  try {
    const updateData = {
      ...reqBody,
      updatedAt: Date.now()
    }
    // console.log(updateData)
    const updateLabel = await labelModel.update(labelId, updateData)
    return updateLabel
  } catch (error) {
    throw error
  }
}
const deleteLabel = async labelId => {
  try {
    const targetLabel = await labelModel.findOneById(labelId)
    // console.log('🚀 ~ deleteItem ~ targetColumn:', targetColumn)
    if (!targetLabel)
      throw new ApiError(StatusCodes.NOT_FOUND, 'Label not found!')
    // xoa label
    await labelModel.deleteOneById(labelId)
    // xoa label thuoc board
    await labelModel.pullBoardLabelIds(labelId)
    // xoa label thuoc card
    await labelModel.pullCardLabelIds(labelId)
    return {
      deleteResult: 'Label delete successfully',
      labelId
    }
  } catch (error) {
    throw error
  }
}


export const labelService = {
  createNew,
  update,
  deleteLabel,
  getBoardLabels
}
