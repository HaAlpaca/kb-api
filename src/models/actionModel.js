import Joi from 'joi'
import { ObjectId } from 'mongodb'
import { GET_DB } from '~/config/mongodb'
import { BOARD_TYPES } from '~/utils/constants'
import { OBJECT_ID_RULE, OBJECT_ID_RULE_MESSAGE } from '~/utils/validators'
import { columnModel } from './columnModel'
import { cardModel } from './cardModel'
import { pageSkipValue } from '~/utils/algorithms'
import { userModel } from './userModel'
import { labelModel } from './labelModel'
// Define Collection (name & schema)
const ACTION_COLLECTION_NAME = 'actions'
const ACTION_COLLECTION_SCHEMA = Joi.object({
  type: Joi.string().required().min(3).max(100).trim().strict(), // e.g., 'move_card_column'
  description: Joi.string().required().trim().strict(), // e.g., 'User A moved card "Bug #1" from Column A to Column B'

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
      targetId: new ObjectId(validData.targetId),
      boardId: new ObjectId(validData.boardId),
      ownerActionId: new ObjectId(userId)
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

// ====== Card actions ======
// - Tạo card mới:              type: 'create_card',           targetType: 'card'
// - Đổi tiêu đề card:          type: 'update_card_title',     targetType: 'card'
// - Đổi mô tả card:            type: 'update_card_description',targetType: 'card'
// - Đổi nhãn card:             type: 'update_card_labels',    targetType: 'card'
// - Gán người thực hiện:       type: 'assign_user_to_card',   targetType: 'card'
// - Đánh dấu hoàn thành:       type: 'mark_card_complete',    targetType: 'card'
// - Di chuyển card:            type: 'move_card_column',      targetType: 'card'
// - Đổi hạn deadline:          type: 'update_card_due_date',  targetType: 'card'
// - Xoá card:                  type: 'delete_card',           targetType: 'card'

// ====== Column actions ======
// - Tạo column mới:            type: 'create_column',         targetType: 'column'
// - Đổi tên column:            type: 'update_column_title',   targetType: 'column'
// - Di chuyển column:          type: 'move_column',           targetType: 'column'
// - Xoá column:                type: 'delete_column',         targetType: 'column'

// ====== Board actions ======
// - Tạo board mới:             type: 'create_board',          targetType: 'board'
// - Đổi tên board:             type: 'update_board_title',    targetType: 'board'
// - Mời người vào board:       type: 'invite_user_to_board',  targetType: 'board'
// - Rời khỏi board:            type: 'leave_board',           targetType: 'board'
// - Xoá board:                 type: 'delete_board',          targetType: 'board'

// ====== Comment actions ======
// - Thêm bình luận:            type: 'add_comment',           targetType: 'card'
// - Xoá bình luận:             type: 'delete_comment',        targetType: 'card'
// - Cập nhật bình luận:        type: 'update_comment',        targetType: 'card'

// ====== Checklist & Attachment ======
// - Thêm checklist:            type: 'add_checklist',         targetType: 'card'
// - Đánh dấu checklist item:   type: 'complete_checklist_item', targetType: 'card'
// - Thêm file đính kèm:        type: 'upload_attachment',     targetType: 'card'
// - Xoá file đính kèm:         type: 'delete_attachment',     targetType: 'card'
