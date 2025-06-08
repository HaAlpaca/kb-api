import Joi from 'joi'
import { EMAIL_RULE, EMAIL_RULE_MESSAGE, OBJECT_ID_RULE, OBJECT_ID_RULE_MESSAGE } from '~/utils/validators'
import { GET_DB } from '~/config/mongodb'
import { ObjectId } from 'mongodb'
import { CARD_MEMBER_ACTION } from '~/utils/constants'
import { userModel } from './userModel'
import { labelModel } from './labelModel'
import { AttachmentModel } from './attachmentModel'
import { checklistModel } from './checklistModel'
// Define Collection (name & schema)
const CARD_COLLECTION_NAME = 'cards'
const CARD_COLLECTION_SCHEMA = Joi.object({
  boardId: Joi.string().required().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE),
  columnId: Joi.string().required().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE),

  title: Joi.string().required().min(3).max(100).trim().strict(),
  description: Joi.string().optional(),

  cover: Joi.string().default(null),
  memberIds: Joi.array().items(Joi.string().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE)).default([]),
  cardLabelIds: Joi.array().items(Joi.string().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE)).default([]),
  cardAttachmentIds: Joi.array()
    .items(Joi.string().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE))
    .default([]),
  cardChecklistIds: Joi.array().items(Joi.string().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE)).default([]),

  // mark complete
  isComplete: Joi.boolean().default(false),
  // Comments
  comments: Joi.array()
    .items({
      userId: Joi.string().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE),
      userEmail: Joi.string().pattern(EMAIL_RULE).message(EMAIL_RULE_MESSAGE),
      userAvatar: Joi.string(),
      userDisplayName: Joi.string(),
      content: Joi.string(),
      // do kieu embedded vao 1 bang ghi thay vi dung nhieu bang, nen ta dung $push nen khong the set Date.now() duoc
      commentedAt: Joi.date().timestamp()
    })
    .default([]),

  // Date
  startDate: Joi.date().timestamp('javascript').optional(),
  dueDate: Joi.date().timestamp('javascript').optional(),
  reminder: Joi.date().timestamp('javascript').optional(),

  createdAt: Joi.date().timestamp('javascript').default(Date.now),
  updatedAt: Joi.date().timestamp('javascript').default(null),
  _destroy: Joi.boolean().default(false)
})

const INVALID_UPDATE_FIELDS = ['_id', 'boardId', 'createdAt']
const validateBeforeCreate = async data => {
  return CARD_COLLECTION_SCHEMA.validateAsync(data, { abortEarly: false })
}

const getDetails = async (userId, cardId) => {
  try {
    const queryCondition = [
      { _id: new ObjectId(cardId) },
      { _destroy: false }
      // {
      //   $or: [
      //     { ownerIds: { $all: [new ObjectId(userId)] } },
      //     { memberIds: { $all: [new ObjectId(userId)] } }
      //   ]
      // }
    ]

    const result = await GET_DB()
      .collection(CARD_COLLECTION_NAME)
      .aggregate([
        { $match: { $and: queryCondition } },

        // Join members
        {
          $lookup: {
            from: userModel.USER_COLLECTION_NAME,
            localField: 'memberIds',
            foreignField: '_id',
            as: 'members',
            pipeline: [{ $project: { password: 0, verifyToken: 0 } }]
          }
        },

        // Join labels
        {
          $lookup: {
            from: labelModel.LABEL_COLLECTION_NAME,
            localField: 'cardLabelIds',
            foreignField: '_id',
            as: 'labels',
            pipeline: [{ $project: { _id: 1, title: 1, colour: 1 } }]
          }
        },

        // 🔥 Join attachments từ cardAttachmentIds
        {
          $lookup: {
            from: AttachmentModel.ATTACHMENT_COLLECTION_NAME,
            localField: 'cardAttachmentIds',
            foreignField: '_id',
            as: 'attachments',
            pipeline: [
              {
                $project: {
                  _id: 1,
                  name: 1,
                  link: 1,
                  type: 1,
                  size: 1,
                  createdAt: 1
                }
              }
            ]
          }
        },

        // 🔥 Join checkboxes từ cardCheckboxIds
        {
          $lookup: {
            from: checklistModel.CHECKLIST_COLLECTION_NAME,
            localField: 'cardChecklistIds',
            foreignField: '_id',
            as: 'checklists'
          }
        }
      ])
      .toArray()

    return result[0] || null
  } catch (error) {
    throw new Error(error)
  }
}

const createNew = async data => {
  try {
    const validData = await validateBeforeCreate(data)
    // console.log(validData)
    const newCardToAdd = {
      ...validData,
      boardId: new ObjectId(validData.boardId),
      columnId: new ObjectId(validData.columnId)
    }
    const createdCard = await GET_DB().collection(CARD_COLLECTION_NAME).insertOne(newCardToAdd)
    return createdCard
  } catch (error) {
    throw new Error(error)
  }
}
const toogleCardComplete = async (cardId, isComplete) => {
  try {
    const result = await GET_DB()
      .collection(CARD_COLLECTION_NAME)
      .findOneAndUpdate(
        { _id: new ObjectId(cardId) },
        { $set: { isComplete: !isComplete } },
        { returnDocument: 'after' }
      )
    return result
  } catch (error) {
    throw new Error(error)
  }
}

const findOneById = async id => {
  try {
    const result = await GET_DB()
      .collection(CARD_COLLECTION_NAME)
      .findOne({ _id: new ObjectId(id) })
    return result
  } catch (error) {
    throw new Error(error)
  }
}
const updateMany = async (filter, updateData) => {
  try {
    const result = await GET_DB().collection(CARD_COLLECTION_NAME).updateMany(filter, updateData)
    return result
  } catch (error) {
    throw new Error(error)
  }
}

const update = async (cardId, updateData) => {
  try {
    // loc field khong cho phep update
    Object.keys(updateData).forEach(fieldName => {
      if (INVALID_UPDATE_FIELDS.includes(fieldName)) delete updateData[fieldName]
    })
    if (updateData.columnId) updateData.columnId = new ObjectId(updateData.columnId)
    const result = await GET_DB()
      .collection(CARD_COLLECTION_NAME)
      .findOneAndUpdate({ _id: new ObjectId(cardId) }, { $set: updateData }, { returnDocument: 'after' })
    return result
  } catch (error) {
    throw new Error(error)
  }
}

const deleteManyByColumnId = async columnId => {
  try {
    const result = await GET_DB()
      .collection(CARD_COLLECTION_NAME)
      .deleteMany({ columnId: new ObjectId(columnId) })
    return result
  } catch (error) {
    throw new Error(error)
  }
}
// đẩy luôn vào đẩu mảng để được push vào array => comment mới luôn lên đầu , dễ đọc
// do mongodb không có unshift nên phải dùng ntn
// https://www.mongodb.com/docs/manual/reference/operator/update/position/
// https://stackoverflow.com/questions/7936019/how-do-i-add-a-value-to-the-top-of-an-array-in-mongodb/25732817#25732817
const unshiftNewComment = async (cardId, commentData) => {
  try {
    const result = await GET_DB()
      .collection(CARD_COLLECTION_NAME)
      .findOneAndUpdate(
        { _id: new ObjectId(cardId) },
        { $push: { comments: { $each: [commentData], $position: 0 } } },
        { returnDocument: 'after' }
      )
    return result
  } catch (error) {
    throw new Error(error)
  }
}

const updateDueDate = async (cardId, dateData) => {
  try {
    const result = await GET_DB()
      .collection(CARD_COLLECTION_NAME)
      .findOneAndUpdate(
        { _id: new ObjectId(cardId) },
        {
          $set: {
            dueDate: dateData.dueDate,
            startDate: dateData.startDate,
            reminder: dateData.reminder
          }
        },
        { returnDocument: 'after' }
      )
    return result
  } catch (error) {
    throw new Error(error)
  }
}

const updateMembers = async (cardId, incomingMemberInfo) => {
  try {
    //
    let updateCondition = {}
    if (incomingMemberInfo.action === CARD_MEMBER_ACTION.ADD) {
      updateCondition = {
        $push: {
          memberIds: new ObjectId(incomingMemberInfo.userId)
        }
      }
    }
    if (incomingMemberInfo.action === CARD_MEMBER_ACTION.REMOVE) {
      updateCondition = {
        $pull: {
          memberIds: new ObjectId(incomingMemberInfo.userId)
        }
      }
    }
    const result = await GET_DB()
      .collection(CARD_COLLECTION_NAME)
      .findOneAndUpdate({ _id: new ObjectId(cardId) }, updateCondition, {
        returnDocument: 'after'
      })

    return result
  } catch (error) {
    throw new Error(error)
  }
}
const updateLabels = async (cardId, updateLabels) => {
  try {
    const objectIdLabels = updateLabels.map(id => new ObjectId(id))

    const updateCondition = {
      $set: { cardLabelIds: objectIdLabels }
    }

    const result = await GET_DB()
      .collection(CARD_COLLECTION_NAME)
      .findOneAndUpdate({ _id: new ObjectId(cardId) }, updateCondition, {
        returnDocument: 'after'
      })
    return result
  } catch (error) {
    throw new Error(error)
  }
}

const updateAttachments = async (cardId, updateAttachments) => {
  try {
    const objectIdAttachments = updateAttachments.map(id => new ObjectId(id))

    const updateCondition = {
      $set: { cardAttachmentIds: objectIdAttachments }
    }

    const result = await GET_DB()
      .collection(CARD_COLLECTION_NAME)
      .findOneAndUpdate({ _id: new ObjectId(cardId) }, updateCondition, {
        returnDocument: 'after'
      })
    return result
  } catch (error) {
    throw new Error(error)
  }
}

const updateChecklists = async (cardId, updateChecklists) => {
  try {
    const objectIdChecklists = updateChecklists.map(id => new ObjectId(id))

    const updateCondition = {
      $set: { cardChecklistIds: objectIdChecklists }
    }

    const result = await GET_DB()
      .collection(CARD_COLLECTION_NAME)
      .findOneAndUpdate({ _id: new ObjectId(cardId) }, updateCondition, {
        returnDocument: 'after'
      })
    return result
  } catch (error) {
    throw new Error(error)
  }
}

const find = async filter => {
  try {
    const result = await GET_DB().collection(CARD_COLLECTION_NAME).find(filter).toArray() // Chuyển kết quả thành mảng
    return result
  } catch (error) {
    throw new Error(error)
  }
}

const updateCommentDisplayName = async (userId, newDisplayName) => {
  try {
    const result = await GET_DB()
      .collection(CARD_COLLECTION_NAME)
      .updateMany(
        { 'comments.userId': userId },
        {
          $set: { 'comments.$[elem].userDisplayName': newDisplayName }
        },
        {
          arrayFilters: [{ 'elem.userId': userId }]
        }
      )
    return result
  } catch (error) {
    throw new Error(error)
  }
}

export const cardModel = {
  CARD_COLLECTION_NAME,
  CARD_COLLECTION_SCHEMA,
  updateDueDate,
  toogleCardComplete,
  getDetails,
  createNew,
  find,
  findOneById,
  update,
  updateMany,
  deleteManyByColumnId,
  unshiftNewComment,
  updateMembers,
  updateLabels,
  updateAttachments,
  updateChecklists,
  updateCommentDisplayName
}
