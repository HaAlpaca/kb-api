import { StatusCodes } from 'http-status-codes'
const createNew = async (req, res, next) => {
  try {
    // console.log(req.body)
    // throw new Error('Test Error')
    // throw new ApiError(StatusCodes.BAD_GATEWAY, 'Test Error')
    res
      .status(StatusCodes.CREATED)
      .json({ message: 'POST from Controller: API create new board' })
  } catch (error) {
    next(error)
  }
}

export const boardController = {
  createNew
}
