import Joi from 'joi'
import { ObjectId } from 'mongodb'
import { GET_DB } from '~/config/mongodb'
import { OBJECT_ID_RULE, OBJECT_ID_RULE_MESSAGE } from '~/utils/validators'
import { cardModel } from './cardModel'
import { pick } from 'lodash'
import { CARD_MEMBER_ACTION } from '~/utils/constants'

// Định nghĩa tên và schema của bảng checklists
const CHECKLIST_COLLECTION_NAME = 'checklists'

const CHECKLIST_COLLECTION_SCHEMA = Joi.object({
  title: Joi.string().required().trim().min(1).max(255),
  cardId: Joi.string()
    .required()
    .pattern(OBJECT_ID_RULE)
    .message(OBJECT_ID_RULE_MESSAGE),

  // Mảng item bên trong checklist
  items: Joi.array()
    .items(
      Joi.object({
        _id: Joi.string()
          .pattern(OBJECT_ID_RULE)
          .message(OBJECT_ID_RULE_MESSAGE)
          .default(() => new ObjectId().toString()),
        content: Joi.string().required().trim(),
        dueDate: Joi.date().timestamp('javascript').optional(),
        assignedUserIds: Joi.array()
          .items(
            Joi.string().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE)
          )
          .default([]),
        isCompleted: Joi.boolean().default(false),
        createdAt: Joi.date().timestamp('javascript').default(Date.now)
      })
    )
    .default([]),

  createdAt: Joi.date().timestamp('javascript').default(Date.now),
  updatedAt: Joi.date().timestamp('javascript').default(null),
  _destroy: Joi.boolean().default(false)
})

// chi dinh nhung field khong dc cap nhat
const INVALID_UPDATE_FIELDS = ['_id', 'createdAt']

// Hàm validate dữ liệu trước khi tạo mới
const validateBeforeCreate = async data => {
  return await CHECKLIST_COLLECTION_SCHEMA.validateAsync(data, {
    abortEarly: false
  })
}

// Hàm tạo checklist mới
const createNew = async data => {
  try {
    const validData = await validateBeforeCreate(data)
    const newChecklist = {
      ...validData,
      cardId: new ObjectId(validData.cardId)
    }
    const created = await GET_DB()
      .collection(CHECKLIST_COLLECTION_NAME)
      .insertOne(newChecklist)
    return created
  } catch (error) {
    throw new Error(error)
  }
}

const findOneById = async id => {
  try {
    const result = await GET_DB()
      .collection(CHECKLIST_COLLECTION_NAME)
      .findOne({ _id: new ObjectId(id) })
    return result
  } catch (error) {
    throw new Error(error)
  }
}

const update = async (checklistId, updateData) => {
  try {
    // loc field khong cho phep update
    Object.keys(updateData).forEach(fieldName => {
      if (INVALID_UPDATE_FIELDS.includes(fieldName))
        delete updateData[fieldName]
    })
    const result = await GET_DB()
      .collection(CHECKLIST_COLLECTION_NAME)
      .findOneAndUpdate(
        { _id: new ObjectId(checklistId) },
        { $set: updateData },
        { returnDocument: 'after' }
      )
    return result
  } catch (error) {
    throw new Error(error)
  }
}

const pushCardChecklistIds = async (cardId, checklistId) => {
  try {
    const result = await GET_DB()
      .collection(cardModel.CARD_COLLECTION_NAME)
      .findOneAndUpdate(
        { _id: new ObjectId(cardId) },
        { $push: { cardChecklistIds: new ObjectId(checklistId) } },
        { returnDocument: 'after' }
      )
    return result
  } catch (error) {
    throw new Error(error)
  }
}

const pullCardChecklistIds = async checklistId => {
  try {
    const result = await GET_DB()
      .collection(cardModel.CARD_COLLECTION_NAME)
      .updateMany(
        { cardChecklistIds: new ObjectId(checklistId) },
        { $pull: { cardChecklistIds: new ObjectId(checklistId) } }
      )

    return result
  } catch (error) {
    throw new Error(error)
  }
}

// Thêm một checkitem vào checklist
const addCheckItem = async (checklistId, itemData) => {
  try {
    const newItem = {
      _id: new ObjectId(),
      content: itemData.content,
      assignedUserIds:
        itemData.assignedUserIds?.map(id => new ObjectId(id)) || [],
      dueDate: itemData.dueDate ? new Date(itemData.dueDate) : null,
      isCompleted: false,
      createdAt: Date.now()
    }

    const result = await GET_DB()
      .collection(CHECKLIST_COLLECTION_NAME)
      .findOneAndUpdate(
        { _id: new ObjectId(checklistId), _destroy: false },
        { $push: { items: newItem }, $set: { updatedAt: Date.now() } },
        { returnDocument: 'after' }
      )

    return result
  } catch (error) {
    throw new Error(error)
  }
}

// Xoá một item trong checklist
const deleteCheckItem = async (checklistId, itemId) => {
  try {
    const result = await GET_DB()
      .collection(CHECKLIST_COLLECTION_NAME)
      .findOneAndUpdate(
        { _id: new ObjectId(checklistId), _destroy: false },
        {
          $pull: { items: { _id: new ObjectId(itemId) } },
          $set: { updatedAt: Date.now() }
        },
        { returnDocument: 'after' }
      )
    return result
  } catch (error) {
    throw new Error(error)
  }
}

// Xoá checklist (soft delete)
// done
const deleteOneById = async attachmentId => {
  try {
    const result = await GET_DB()
      .collection(CHECKLIST_COLLECTION_NAME)
      .deleteOne({ _id: new ObjectId(attachmentId) })
    return result
  } catch (error) {
    throw new Error(error)
  }
}

const updateCheckItem = async (checklistId, itemId, updateData) => {
  try {
    const setFields = {}

    if (updateData.content !== undefined) {
      setFields['items.$.content'] = updateData.content
    }
    if (updateData.isCompleted !== undefined) {
      setFields['items.$.isCompleted'] = updateData.isCompleted
    }
    if (updateData.assignedUserIds !== undefined) {
      setFields['items.$.assignedUserIds'] = updateData.assignedUserIds.map(
        id => new ObjectId(id)
      )
    }
    if (updateData.dueDate !== undefined) {
      setFields['items.$.dueDate'] = updateData.dueDate
        ? new Date(updateData.dueDate)
        : null
    }

    setFields.updatedAt = Date.now()

    const result = await GET_DB()
      .collection(CHECKLIST_COLLECTION_NAME)
      .findOneAndUpdate(
        {
          _id: new ObjectId(checklistId),
          'items._id': new ObjectId(itemId)
        },
        {
          $set: setFields
        },
        { returnDocument: 'after' }
      )

    return result
  } catch (error) {
    throw new Error(error)
  }
}
// Cập nhật lại thứ tự các item
const reorderCheckItems = async (checklistId, newItemOrder) => {
  try {
    const db = await GET_DB()
    const checklist = await db
      .collection(CHECKLIST_COLLECTION_NAME)
      .findOne({ _id: new ObjectId(checklistId), _destroy: false })

    if (!checklist) throw new Error('Checklist not found')

    // Bước 1: tạo map để tối ưu tìm kiếm
    const itemMap = Object.fromEntries(
      checklist.items.map(item => [item._id.toString(), item])
    )

    // Bước 2: reorder theo newItemOrder
    const reorderedItems = newItemOrder
      .map(id => itemMap[id.toString()])
      .filter(Boolean) // loại bỏ nếu có id không tồn tại

    // Bước 3: update checklist với mảng items đã reorder
    const result = await db
      .collection(CHECKLIST_COLLECTION_NAME)
      .findOneAndUpdate(
        { _id: new ObjectId(checklistId), _destroy: false },
        {
          $set: { items: reorderedItems, updatedAt: Date.now() }
        },
        { returnDocument: 'after' }
      )

    return result
  } catch (error) {
    throw new Error(error)
  }
}

const getChecklistsByIds = async checklistIds => {
  try {
    const checklists = await GET_DB()
      .collection(CHECKLIST_COLLECTION_NAME)
      .find({
        _id: { $in: checklistIds.map(id => new ObjectId(id)) },
        _destroy: false
      })
      .toArray()

    return checklists.map(checklist => ({
      _id: checklist._id.toString(), // Chuyển ObjectId thành string,
      cardId: checklist._id.toString(), // Chuyển ObjectId thành string,
      ...pick(checklist, [
        'items',
        'title',
        'createdAt',
        'updatedAt',
        '_destroy'
      ])
    }))
  } catch (error) {
    throw new Error(error)
  }
}

const updateIncomingAssignedUser = async (
  checklistId,
  itemId,
  incomingInfo
) => {
  try {
    // console.log(checklistId, itemId, incomingInfo)
    const userObjectId = new ObjectId(incomingInfo.userId)

    let updateCondition = {}

    if (incomingInfo.action === CARD_MEMBER_ACTION.ADD) {
      updateCondition = {
        $push: { 'items.$.assignedUserIds': userObjectId }
      }
    }

    if (incomingInfo.action === CARD_MEMBER_ACTION.REMOVE) {
      updateCondition = {
        $pull: { 'items.$.assignedUserIds': userObjectId }
      }
    }

    const result = await GET_DB()
      .collection(CHECKLIST_COLLECTION_NAME)
      .findOneAndUpdate(
        {
          _id: new ObjectId(checklistId),
          'items._id': new ObjectId(itemId),
          _destroy: false
        },
        updateCondition,
        { returnDocument: 'after' }
      )

    return result
  } catch (error) {
    throw new Error(error)
  }
}

// Export tất cả các hàm
export const checklistModel = {
  CHECKLIST_COLLECTION_NAME,
  CHECKLIST_COLLECTION_SCHEMA,
  updateIncomingAssignedUser,
  createNew,
  getChecklistsByIds,
  addCheckItem,
  deleteCheckItem,
  deleteOneById,
  updateCheckItem,
  update,

  pushCardChecklistIds,
  pullCardChecklistIds,
  reorderCheckItems,
  findOneById
}
