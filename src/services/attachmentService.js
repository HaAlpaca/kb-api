/* eslint-disable no-useless-catch */
// import { StatusCodes } from 'http-status-codes'
// import ApiError from '~/utils/ApiError'
// import { boardModel } from '~/models/boardModel'
import { StatusCodes } from 'http-status-codes'
import { AttachmentModel } from '~/models/attachmentModal'
import { cardModel } from '~/models/cardModel'
import { CloudinaryProvider } from '~/providers/CloudinaryProvider'
import ApiError from '~/utils/ApiError'
import { formatMimeType } from '~/utils/formatters'

// khong auto detect file type
const createNew = async (userId, reqBody, attachmentFile) => {
  try {
    const newAttachment = {
      name: '',
      description: '',
      link: '',
      type: '',
      size: 0
    }

    if (reqBody.link) {
      newAttachment.name = reqBody.name
      newAttachment.link = reqBody.link
      newAttachment.description = reqBody.description && ''
      newAttachment.type = 'link'
      newAttachment.size = 0
    }

    if (attachmentFile) {
      // lấy file name
      const fileName = attachmentFile.originalname.replace(/\.[^/.]+$/, '')
      const mineType = formatMimeType(attachmentFile) // get pdf, docx
      const uploadResult = await CloudinaryProvider.streamUploadAttachment(
        attachmentFile.buffer,
        'KanbanBoard/attachments',
        fileName,
        mineType
      )
      newAttachment.name = fileName
      newAttachment.link = `${uploadResult.secure_url}`
      newAttachment.type = mineType
      newAttachment.size = parseInt(attachmentFile.size)
    }

    // goi tang model xu li ban ghi vao db
    const createdAttachment = await AttachmentModel.createNew(
      userId,
      newAttachment
    )
    const getNewAttachment = await AttachmentModel.findOneById(
      createdAttachment.insertedId
    )
    const attachmentId = getNewAttachment._id.toString()
    if (reqBody.cardId) {
      await AttachmentModel.pushCardAttachmentIds(reqBody.cardId, attachmentId)
    }
    return getNewAttachment
  } catch (error) {
    throw error
  }
}

const getCardAttachments = async cardId => {
  try {
    const card = await cardModel.findOneById(cardId)
    if (!card) throw new ApiError(StatusCodes.NOT_FOUND, 'Card not found!')
    const result = await AttachmentModel.getCardAttachments(cardId)
    return result
  } catch (error) {
    throw error
  }
}

const update = async (attachmentId, reqBody) => {
  try {
    const updateData = {
      updatedAt: Date.now()
    }
    const attachment = await AttachmentModel.findOneById(attachmentId)
    if (!attachment)
      throw new ApiError(StatusCodes.NOT_FOUND, 'Attachment not found!')

    if (attachment.link !== 'link') {
      updateData.name = reqBody.name ? reqBody.name : attachment.name
      updateData.description = reqBody.description
        ? reqBody.description
        : attachment.description
    }
    if (attachment.type === 'link') {
      updateData.name = reqBody.name ? reqBody.name : attachment.name
      updateData.link = reqBody.link ? reqBody.link : attachment.name
      updateData.description = reqBody.description
        ? reqBody.description
        : attachment.description
    }

    // console.log(updateData)
    const updateAttachment = await AttachmentModel.update(
      attachmentId,
      updateData
    )
    return updateAttachment
  } catch (error) {
    throw error
  }
}
const deleteAttachment = async attachmentId => {
  try {
    const targetAttachment = await AttachmentModel.findOneById(attachmentId)
    // console.log('🚀 ~ deleteItem ~ targetColumn:', targetColumn)
    if (!targetAttachment)
      throw new ApiError(StatusCodes.NOT_FOUND, 'Attachment not found!')
    // xoa attachment
    await AttachmentModel.deleteOneById(attachmentId)
    // xoa attachment thuoc card
    await AttachmentModel.pullCardLabelIds(attachmentId)
    return {
      deleteResult: 'Attachment delete successfully',
      attachmentId
    }
  } catch (error) {
    throw error
  }
}

export const attachmentService = {
  createNew,
  update,
  deleteAttachment,
  getCardAttachments

  // getBoardLabels
}
