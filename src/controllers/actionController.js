import { StatusCodes } from 'http-status-codes'
import { actionService } from '~/services/actionService'

const getActions = async (req, res, next) => {
  try {
    const userId = req.jwtDecoded._id
    const resAction = await actionService.getActions(userId)
    res.status(StatusCodes.OK).json(resAction)
  } catch (error) {
    next(error)
  }
}

export const actionController = {
  getActions
}
