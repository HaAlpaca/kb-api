/* eslint-disable no-useless-catch */
import { columnModel } from '~/models/columnModel'
import { boardModel } from '~/models/boardModel'
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

export const columnService = {
  createNew,
  update
}
