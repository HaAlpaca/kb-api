/* eslint-disable no-useless-catch */
import { cardModel } from '~/models/cardModel'
import { columnModel } from '~/models/columnModel'

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

export const cardService = {
  createNew
}
