import Joi from 'joi'
import { StatusCodes } from 'http-status-codes'
import ApiError from '~/utils/ApiError'
import { OBJECT_ID_RULE, OBJECT_ID_RULE_MESSAGE } from '~/utils/validators'

// Hàm validate khi tạo mới checklist
const createNew = async (req, res, next) => {
  const correctCondition = Joi.object({
    title: Joi.string().min(1).max(255).trim().strict().required(),
    cardId: Joi.string()
      .pattern(OBJECT_ID_RULE)
      .message(OBJECT_ID_RULE_MESSAGE),
    assignedUserIds: Joi.array()
      .items(
        Joi.string().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE)
      )
      .default([]),
    dueDate: Joi.date().timestamp('javascript').optional(),
    items: Joi.array()
      .items(
        Joi.object({
          content: Joi.string().required().trim(),
          isCompleted: Joi.boolean().default(false)
        })
      )
      .default([])
  })
  try {
    // Chỉ định abortEarly để có thể trả về tất cả các lỗi
    await correctCondition.validateAsync(req.body, { abortEarly: false })
    next()
  } catch (error) {
    next(
      new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, new Error(error).message)
    )
  }
}

// Hàm validate khi cập nhật checklist
const update = async (req, res, next) => {
  // Không dùng required trong update
  const correctCondition = Joi.object({
    title: Joi.string().min(1).max(255).trim().strict(),
    items: Joi.array()
      .items(
        Joi.object({
          content: Joi.string().trim(),
          assignedUserIds: Joi.array().items(
            Joi.string().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE)
          ),
          isCompleted: Joi.boolean()
        })
      )
      .default([])
  })
  try {
    // Chỉ định abortEarly để có thể trả về tất cả các lỗi
    await correctCondition.validateAsync(req.body, {
      abortEarly: false,
      allowUnknown: true // Cho phép không cần gửi hết các trường, cho các trường không định nghĩa lên
    })
    next()
  } catch (error) {
    next(
      new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, new Error(error).message)
    )
  }
}

// Hàm validate khi cập nhật các trạng thái của các item (checkbox)
const updateItemsChecked = async (req, res, next) => {
  const correctCondition = Joi.object({
    items: Joi.array().items(
      Joi.object({
        _id: Joi.string()
          .pattern(OBJECT_ID_RULE)
          .message(OBJECT_ID_RULE_MESSAGE),
        isCompleted: Joi.boolean().required()
      })
    )
  })
  try {
    // Chỉ định abortEarly để có thể trả về tất cả các lỗi
    await correctCondition.validateAsync(req.body, {
      abortEarly: false,
      allowUnknown: true // Cho phép không cần gửi hết các trường, cho các trường không định nghĩa lên
    })
    next()
  } catch (error) {
    next(
      new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, new Error(error).message)
    )
  }
}

export const checklistValidation = {
  createNew,
  update,
  updateItemsChecked
}
