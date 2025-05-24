import { StatusCodes } from 'http-status-codes'
import { cardService } from '~/services/cardService'

const getDetails = async (req, res, next) => {
  try {
    const userId = req.jwtDecoded._id
    const cardId = req.params.id
    const card = await cardService.getDetails(userId, cardId)
    res.status(StatusCodes.OK).json(card)
  } catch (error) {
    next(error)
  }
}

const createNew = async (req, res, next) => {
  try {
    const createdCard = await cardService.createNew(req.body)
    res.status(StatusCodes.CREATED).json(createdCard)
  } catch (error) {
    next(error)
  }
}
const update = async (req, res, next) => {
  try {
    const cardId = req.params.id
    const cardCoverFile = req.file
    const userInfo = req.jwtDecoded
    const updatedCard = await cardService.update(cardId, req.body, cardCoverFile, userInfo)
    const card = await cardService.getDetails(updatedCard._id, cardId)
    res.status(StatusCodes.OK).json(card)
  } catch (error) {
    next(error)
  }
}

const toogleCardComplete = async (req, res, next) => {
  try {
    const userId = req.jwtDecoded._id
    const cardId = req.params.id
    const updatedCard = await cardService.toogleCardComplete(userId, cardId)
    res.status(StatusCodes.OK).json(updatedCard)
  } catch (error) {
    next(error)
  }
}

export const cardController = {
  getDetails,
  createNew,
  update,
  toogleCardComplete
}
