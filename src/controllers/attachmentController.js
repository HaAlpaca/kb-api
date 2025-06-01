import { StatusCodes } from 'http-status-codes'
import { attachmentService } from '~/services/attachmentService'

// Done
const createNew = async (req, res, next) => {
  try {
    const userId = req.jwtDecoded._id
    const attachmentFile = req.file
    const createdAttachment = await attachmentService.createNew(userId, req.body, attachmentFile)
    res.status(StatusCodes.CREATED).json(createdAttachment)
  } catch (error) {
    next(error)
  }
}

const update = async (req, res, next) => {
  try {
    const attachmentId = req.params.id
    const updatedAttachment = await attachmentService.update(attachmentId, req.body)
    res.status(StatusCodes.OK).json(updatedAttachment)
  } catch (error) {
    next(error)
  }
}

const deleteAttachment = async (req, res, next) => {
  try {
    const attachmentId = req.params.id
    const deleteLabel = await attachmentService.deleteAttachment(attachmentId)
    res.status(StatusCodes.OK).json(deleteLabel)
  } catch (error) {
    next(error)
  }
}

export const attachmentController = {
  createNew,
  update,
  deleteAttachment
}
