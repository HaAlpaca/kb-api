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

export const columnService = {
  createNew
}
