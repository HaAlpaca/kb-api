import Joi from 'joi'
import { ObjectId } from 'mongodb'
import { GET_DB } from '~/config/mongodb'
import { OBJECT_ID_RULE, OBJECT_ID_RULE_MESSAGE } from '~/utils/validators'
import { ACTION_TYPES } from '~/utils/constants'

// Define Collection (name & schema)
const ACTION_COLLECTION_NAME = 'actions'
const ACTION_COLLECTION_SCHEMA = Joi.object({
  type: Joi.string()
    .required()
    .valid(...Object.values(ACTION_TYPES)) // Chỉ cho phép các giá trị trong ACTION_TYPES
    .trim()
    .strict(),
  description: Joi.string().required().trim().strict(),
  targetType: Joi.string()
    .required()
    .trim()
    .valid('card', 'column', 'board', 'comment', 'attachment', 'checklist'),
  targetId: Joi.string()
    .pattern(OBJECT_ID_RULE)
    .message(OBJECT_ID_RULE_MESSAGE),

  ownerActionId: Joi.string()
    .pattern(OBJECT_ID_RULE)
    .message(OBJECT_ID_RULE_MESSAGE), // người thực hiện
  receiverIds: Joi.array()
    .items(Joi.string().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE))
    .default([]), // người nhận thông báo (nếu có)

  boardId: Joi.string()
    .required()
    .pattern(OBJECT_ID_RULE)
    .message(OBJECT_ID_RULE_MESSAGE),

  // Lưu các thông tin tuỳ chỉnh (vị trí ban đầu, tên cũ, trạng thái trước, v.v)
  metadata: Joi.object().default({}).optional(),

  actionName: Joi.string().optional().trim().max(255),

  createdAt: Joi.date().timestamp('javascript').default(Date.now),
  updatedAt: Joi.date().timestamp('javascript').default(null),
  _destroy: Joi.boolean().default(false)
})

// chi dinh nhung field khong dc cap nhat
const INVALID_UPDATE_FIELDS = ['_id', 'createdAt']

const validateBeforeCreate = async data => {
  return ACTION_COLLECTION_SCHEMA.validateAsync(data, { abortEarly: false })
}
const createNew = async (userId, data) => {
  try {
    const validData = await validateBeforeCreate(data)
    const newActionToAdd = {
      ...validData,
      targetId: validData.targetId ? new ObjectId(validData.targetId) : null,
      boardId: validData.boardId ? new ObjectId(validData.boardId) : null,
      ownerActionId: new ObjectId(userId),
      metadata: validData.metadata || {}, // Đảm bảo metadata luôn tồn tại
      description: validData.description || '' // Đảm bảo description luôn tồn tại
    }
    const createdAction = await GET_DB()
      .collection(ACTION_COLLECTION_NAME)
      .insertOne(newActionToAdd)
    return createdAction
  } catch (error) {
    throw new Error(error)
  }
}

export const actionModel = {
  ACTION_COLLECTION_NAME,
  ACTION_COLLECTION_SCHEMA,
  createNew
}

