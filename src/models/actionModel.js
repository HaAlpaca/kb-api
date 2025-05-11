import Joi from 'joi'
import { ObjectId } from 'mongodb'
import { GET_DB } from '~/config/mongodb'
import { OBJECT_ID_RULE, OBJECT_ID_RULE_MESSAGE } from '~/utils/validators'
import { userModel } from './userModel'
import { boardModel } from './boardModel'
import { ACTION_TYPES } from '~/utils/constants'

const ACTION_COLLECTION_NAME = 'actions'

const ACTION_COLLECTION_SCHEMA = Joi.object({
  assignerId: Joi.string()
    .required()
    .pattern(OBJECT_ID_RULE)
    .message(OBJECT_ID_RULE_MESSAGE),
  assigneeId: Joi.string()
    .required()
    .pattern(OBJECT_ID_RULE)
    .message(OBJECT_ID_RULE_MESSAGE),
  boardId: Joi.string()
    .required()
    .pattern(OBJECT_ID_RULE)
    .message(OBJECT_ID_RULE_MESSAGE),
  type: Joi.string()
    .required()
    .valid(...Object.values(ACTION_TYPES)),
  metadata: Joi.object().default({}),
  createdAt: Joi.date().timestamp('javascript').default(Date.now),
  updatedAt: Joi.date().timestamp('javascript').default(null),
  _destroy: Joi.boolean().default(false)
})

const INVALID_UPDATE_FIELDS = ['_id', 'assignerId', 'assigneeId', 'createdAt']

const validateBeforeCreate = async data => {
  return ACTION_COLLECTION_SCHEMA.validateAsync(data, { abortEarly: false })
}

const createNew = async data => {
  try {
    const validData = await validateBeforeCreate(data)

    const newAction = {
      ...validData,
      assignerId: new ObjectId(validData.assignerId),
      assigneeId: new ObjectId(validData.assigneeId),
      boardId: new ObjectId(validData.boardId),
      metadata: validData.metadata || {},
      createdAt: Date.now(),
      updatedAt: Date.now(),
      _destroy: false
    }

    const createdAction = await GET_DB()
      .collection(ACTION_COLLECTION_NAME)
      .insertOne(newAction)

    return createdAction
  } catch (error) {
    throw new Error(error)
  }
}

const findOneById = async actionId => {
  try {
    const result = await GET_DB()
      .collection(ACTION_COLLECTION_NAME)
      .findOne({ _id: new ObjectId(actionId) })

    return result
  } catch (error) {
    throw new Error(error)
  }
}

const findOne = async data => {
  try {
    const queryCondition = data
    const result = await GET_DB()
      .collection(ACTION_COLLECTION_NAME)
      .aggregate([{ $match: { $and: queryCondition } }])
      .toArray()
    return result
  } catch (error) {
    throw new Error(error)
  }
}

const update = async (actionId, updateData) => {
  try {
    Object.keys(updateData).forEach(field => {
      if (INVALID_UPDATE_FIELDS.includes(field)) delete updateData[field]
    })

    const result = await GET_DB()
      .collection(ACTION_COLLECTION_NAME)
      .findOneAndUpdate(
        { _id: new ObjectId(actionId) },
        { $set: updateData },
        { returnDocument: 'after' }
      )

    return result
  } catch (error) {
    throw new Error(error)
  }
}

const findAndUpdateMany = async (queryConditions, updateData) => {
  try {
    // Xoá các field không được phép cập nhật
    Object.keys(updateData).forEach(field => {
      if (INVALID_UPDATE_FIELDS.includes(field)) delete updateData[field]
    })

    const collection = GET_DB().collection(ACTION_COLLECTION_NAME)

    // Cập nhật tất cả documents thoả điều kiện
    await collection.updateMany({ $and: queryConditions }, { $set: updateData })

    // Sau khi cập nhật, lấy lại toàn bộ documents đã được cập nhật
    const updatedDocs = await collection
      .find({ $and: queryConditions })
      .toArray()

    return updatedDocs
  } catch (error) {
    throw new Error(error)
  }
}

const findByUser = async userId => {
  try {
    const queryCondition = [{ assigneeId: new ObjectId(userId) }]

    const results = await GET_DB()
      .collection(ACTION_COLLECTION_NAME)
      .aggregate([
        { $match: { $and: queryCondition } },
        {
          $lookup: {
            from: userModel.USER_COLLECTION_NAME,
            localField: 'assignerId',
            foreignField: '_id',
            as: 'assigner',
            pipeline: [{ $project: { password: 0, verifyToken: 0 } }]
          }
        },
        {
          $lookup: {
            from: userModel.USER_COLLECTION_NAME,
            localField: 'assigneeId',
            foreignField: '_id',
            as: 'assignee',
            pipeline: [{ $project: { password: 0, verifyToken: 0 } }]
          }
        },
        {
          $lookup: {
            from: boardModel.BOARD_COLLECTION_NAME,
            localField: 'boardId',
            foreignField: '_id',
            as: 'board',
            pipeline: [{ $project: { _destroy: 0 } }]
          }
        },
        { $sort: { updatedAt: 1, createdAt: 1 } }
      ])
      .toArray()
    return results
  } catch (error) {
    throw new Error(error)
  }
}

export const actionModel = {
  ACTION_COLLECTION_NAME,
  ACTION_COLLECTION_SCHEMA,
  createNew,
  findOneById,
  update,
  findAndUpdateMany,
  findByUser,
  findOne
}
