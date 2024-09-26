import Joi from 'joi'
import { StatusCodes } from 'http-status-codes'
const createNew = async (req, res, next) => {
  const correctCondition = Joi.object({
    title: Joi.string().required().min(3).max(50).trim().strict(),
    description: Joi.string().required().min(3).max(256).trim().strict()
  })
  try {
    // chi dinh abortEarly de th co nhieu loi tra ve tat ca loi
    await correctCondition.validateAsync(req.body, { abortEarly: false })
    res
      .status(StatusCodes.CREATED)
      .json({ message: 'POST from Validation: API create new board' })
  } catch (error) {
    res.status(StatusCodes.UNPROCESSABLE_ENTITY).json({
      errors: new Error(error).message
    })
  }
}

export const boardValidation = {
  createNew
}
