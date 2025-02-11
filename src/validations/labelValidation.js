import Joi from 'joi'
import { StatusCodes } from 'http-status-codes'
import ApiError from '~/utils/ApiError'
import { OBJECT_ID_RULE, OBJECT_ID_RULE_MESSAGE } from '~/utils/validators'
const createNew = async (req, res, next) => {
  const correctCondition = Joi.object({
    title: Joi.string().required().min(3).max(50).trim().strict(),
    colour: Joi.string().regex(/^#[A-Fa-f0-9]{6}$/),
    boardId: Joi.string()
      .required()
      .pattern(OBJECT_ID_RULE)
      .message(OBJECT_ID_RULE_MESSAGE),
    cardId: Joi.string().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE)
  })
  try {
    // chi dinh abortEarly de th co nhieu error tra ve tat ca loi
    await correctCondition.validateAsync(req.body, { abortEarly: false })
    next()
  } catch (error) {
    next(
      new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, new Error(error).message)
    )
  }
}

const update = async (req, res, next) => {
  // khong dung required trong update
  const correctCondition = Joi.object({
    title: Joi.string().required().min(3).max(50).trim().strict(),
    colour: Joi.string().regex(/^#[A-Fa-f0-9]{6}$/)
  })
  try {
    // chi dinh abortEarly de th co nhieu error tra ve tat ca loi
    await correctCondition.validateAsync(req.body, {
      abortEarly: false,
      allowUnknown: true // cho phep khong can day het cac fields len, cho cac truong khong dinh nghia day len
    })
    next()
  } catch (error) {
    next(
      new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, new Error(error).message)
    )
  }
}

export const labelValidation = {
  createNew,
  update
}
