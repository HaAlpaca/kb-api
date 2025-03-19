import Joi from 'joi'
import { StatusCodes } from 'http-status-codes'
import ApiError from '~/utils/ApiError'
import { OBJECT_ID_RULE, OBJECT_ID_RULE_MESSAGE } from '~/utils/validators'
const createNew = async (req, res, next) => {
  const correctCondition = Joi.object({
    name: Joi.string().min(1).max(100).trim().strict().required(),
    cardId: Joi.string()
      .pattern(OBJECT_ID_RULE)
      .message(OBJECT_ID_RULE_MESSAGE),
    description: Joi.string().optional(),
    link: Joi.string().optional()
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
    name: Joi.string().min(1).max(100).optional(),
    description: Joi.string().optional(),
    link: Joi.string().optional()
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

export const attachmentValidation = {
  createNew,
  update
}
