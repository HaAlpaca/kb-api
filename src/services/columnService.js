/* eslint-disable no-useless-catch */
import { columnModel } from '~/models/columnModel'
import { boardModel } from '~/models/boardModel'
import { cardModel } from '~/models/cardModel'
import { StatusCodes } from 'http-status-codes'
import ApiError from '~/utils/ApiError'
const createNew = async reqBody => {
  try {
    // xu li tuy dac thu
    const newColumn = {
      ...reqBody
    }
    // goi tang model xu li ban ghi vao db
    const createdColumn = await columnModel.createNew(newColumn)
    const getNewColumn = await columnModel.findOneById(createdColumn.insertedId)

    if (getNewColumn) {
      // cap nhat lai mang columnOrderIds
      await boardModel.pushColumnOrderIds(getNewColumn)
    }
    // tra du lieu ve controller !!!! service luon co return
    return getNewColumn
  } catch (error) {
    throw error
  }
}

const update = async (columnId, reqBody) => {
  try {
    const updateData = {
      ...reqBody,
      updatedAt: Date.now()
    }
    // console.log(updateData)
    const updateColumn = await columnModel.update(columnId, updateData)
    return updateColumn
  } catch (error) {
    throw error
  }
}
const deleteItem = async columnId => {
  try {
    const targetColumn = await columnModel.findOneById(columnId)
    // console.log('🚀 ~ deleteItem ~ targetColumn:', targetColumn)
    if (!targetColumn)
      throw new ApiError(StatusCodes.NOT_FOUND, 'Column not found!')
    // xoa column
    await columnModel.deleteOneById(columnId)
    // xoa card thuoc column
    await cardModel.deleteManyByColumnId(columnId)
    // xoa column id trong columnOrderId cua  board chua no
    await boardModel.pullColumnOrderIds(targetColumn)
    return {
      deleteResult: 'Column and Its Cards delete successfully',
      columnId
    }
  } catch (error) {
    throw error
  }
}

export const columnService = {
  createNew,
  update,
  deleteItem
}
