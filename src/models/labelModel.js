import Joi from 'joi'
import { ObjectId } from 'mongodb'
import { GET_DB } from '~/config/mongodb'
import { boardModel } from './boardModel'
import { cardModel } from './cardModel'
import { pick } from 'lodash'
// Define Collection (name & schema)
const LABEL_COLLECTION_NAME = 'labels'
const LABEL_COLLECTION_SCHEMA = Joi.object({
  title: Joi.string().required().min(1).max(50).trim().strict(),
  colour: Joi.string().required().min(3).trim().strict(),

  createdAt: Joi.date().timestamp('javascript').default(Date.now),
  updatedAt: Joi.date().timestamp('javascript').default(null),
  _destroy: Joi.boolean().default(false)
})
// chi dinh nhung field khong dc cap nhat
const INVALID_UPDATE_FIELDS = ['_id', 'createdAt']

const validateBeforeCreate = async data => {
  return LABEL_COLLECTION_SCHEMA.validateAsync(data, { abortEarly: false })
}

const getBoardLabels = async (boardId, page = 1, itemPerPage = 10) => {
  try {
    const board = await GET_DB()
      .collection(boardModel.BOARD_COLLECTION_NAME)
      .findOne(
        { _id: new ObjectId(boardId) },
        { projection: { boardLabelIds: 1 } }
      )

    if (!board || !board.boardLabelIds || board.boardLabelIds.length === 0) {
      return { labels: [], totalLabels: 0 }
    }

    const totalLabels = board.boardLabelIds.length
    const labelIds = board.boardLabelIds.map(id => new ObjectId(id))

    const labels = await GET_DB()
      .collection(LABEL_COLLECTION_NAME)
      .find({ _id: { $in: labelIds }, _destroy: false }) // Lọc theo boardLabelIds và chưa bị xóa
      .sort({ title: 1 }) // Sắp xếp theo title A-Z
      .limit(page * itemPerPage) // Bắt đầu từ trang 1 (không có trang 0)
      .toArray()

    return {
      labels: labels.map(label => pick(label, ['_id', 'title', 'colour'])),
      totalLabels
    }
  } catch (error) {
    throw new Error(error)
  }
}

const createNew = async (userId, data) => {
  try {
    const validData = await validateBeforeCreate(data)
    const newLabelToAdd = {
      ...validData,
      ownerId: new ObjectId(userId)
    }
    const createdLabel = await GET_DB()
      .collection(LABEL_COLLECTION_NAME)
      .insertOne(newLabelToAdd)
    return createdLabel
  } catch (error) {
    throw new Error(error)
  }
}

const findOneById = async id => {
  try {
    const result = await GET_DB()
      .collection(LABEL_COLLECTION_NAME)
      .findOne({ _id: new ObjectId(id) })
    return result
  } catch (error) {
    throw new Error(error)
  }
}

const update = async (labelId, updateData) => {
  try {
    // loc field khong cho phep update
    Object.keys(updateData).forEach(fieldName => {
      if (INVALID_UPDATE_FIELDS.includes(fieldName))
        delete updateData[fieldName]
    })
    const result = await GET_DB()
      .collection(LABEL_COLLECTION_NAME)
      .findOneAndUpdate(
        { _id: new ObjectId(labelId) },
        { $set: updateData },
        { returnDocument: 'after' }
      )
    return result
  } catch (error) {
    throw new Error(error)
  }
}

const pushCardLabelIds = async (cardId, labelId) => {
  try {
    const result = await GET_DB()
      .collection(cardModel.CARD_COLLECTION_NAME)
      .findOneAndUpdate(
        { _id: new ObjectId(cardId) },
        { $push: { cardLabelIds: new ObjectId(labelId) } },
        { returnDocument: 'after' }
      )
    return result
  } catch (error) {
    throw new Error(error)
  }
}
const pushBoardLabelIds = async (boardId, labelId) => {
  try {
    const result = await GET_DB()
      .collection(boardModel.BOARD_COLLECTION_NAME)
      .findOneAndUpdate(
        { _id: new ObjectId(boardId) },
        { $push: { boardLabelIds: new ObjectId(labelId) } },
        { returnDocument: 'after' }
      )
    return result
  } catch (error) {
    throw new Error(error)
  }
}

const deleteOneById = async labelId => {
  try {
    const result = await GET_DB()
      .collection(LABEL_COLLECTION_NAME)
      .deleteOne({ _id: new ObjectId(labelId) })
    return result
  } catch (error) {
    throw new Error(error)
  }
}

const pullBoardLabelIds = async labelId => {
  try {
    const result = await GET_DB()
      .collection(boardModel.BOARD_COLLECTION_NAME)
      .updateMany(
        { boardLabelIds: new ObjectId(labelId) },
        { $pull: { boardLabelIds: new ObjectId(labelId) } }
      )

    return result
  } catch (error) {
    throw new Error(error)
  }
}
const pullCardLabelIds = async labelId => {
  try {
    const result = await GET_DB()
      .collection(cardModel.CARD_COLLECTION_NAME)
      .updateMany(
        { cardLabelIds: new ObjectId(labelId) },
        { $pull: { cardLabelIds: new ObjectId(labelId) } }
      )

    return result
  } catch (error) {
    throw new Error(error)
  }
}

export const labelModel = {
  LABEL_COLLECTION_NAME,
  LABEL_COLLECTION_SCHEMA,
  createNew,
  findOneById,
  update,
  pushBoardLabelIds,
  pushCardLabelIds,
  deleteOneById,
  pullBoardLabelIds,
  pullCardLabelIds,
  getBoardLabels
}

//board 6710c1dea34456a8d94373bc
//column 6710c5a9a2f7c59a026cddf6
//card 6710c678a2f7c59a026cddf8
