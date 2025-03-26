import { StatusCodes } from 'http-status-codes'
import { labelService } from '~/services/labelService'

const createNew = async (req, res, next) => {
  try {
    const userId = req.jwtDecoded._id
    const createdLabel = await labelService.createNew(userId, req.body)
    res.status(StatusCodes.CREATED).json(createdLabel)
  } catch (error) {
    next(error)
  }
}
const getBoardLabels = async (req, res, next) => {
  try {
    const boardId = req.params.id
    const { page, itemPerPage } = req.query
    const labels = await labelService.getBoardLabels(boardId, page, itemPerPage)
    res.status(StatusCodes.OK).json(labels)
  } catch (error) {
    next(error)
  }
}

const update = async (req, res, next) => {
  try {
    const labelId = req.params.id
    const updatedLabel = await labelService.update(labelId, req.body)
    res.status(StatusCodes.OK).json(updatedLabel)
  } catch (error) {
    next(error)
  }
}

const deleteLabel = async (req, res, next) => {
  try {
    const labelId = req.params.id
    const deleteLabel = await labelService.deleteLabel(labelId)
    res.status(StatusCodes.OK).json(deleteLabel)
  } catch (error) {
    next(error)
  }
}

export const labelController = {
  createNew,
  update,
  deleteLabel,
  getBoardLabels
}
