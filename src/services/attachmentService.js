/* eslint-disable no-useless-catch */
// import { StatusCodes } from 'http-status-codes'
// import ApiError from '~/utils/ApiError'
// import { boardModel } from '~/models/boardModel'
import { StatusCodes } from 'http-status-codes'
import { AttachmentModel } from '~/models/attachmentModel'
import { cardModel } from '~/models/cardModel'
import { CloudinaryProvider } from '~/providers/CloudinaryProvider'
import ApiError from '~/utils/ApiError'
import { formatMimeType, formatMimeTypeShort } from '~/utils/formatters'

const createNew = async (userId, reqBody, attachmentFile) => {
  try {
    const newAttachment = {
      name: '',
      link: '',
      type: '',
      size: 0
    }

    if (reqBody.link) {
      newAttachment.name = reqBody.name
      newAttachment.link = reqBody.link
      newAttachment.type = 'link'
      newAttachment.size = 0
    }

    if (attachmentFile) {
      // Lấy file name
      const fileName = attachmentFile.originalname
        .replace(/\.[^/.]+$/, '') // Xóa phần mở rộng của file
        .replace(/[^a-zA-Z0-9\s]/g, '') // Xóa các ký tự đặc biệt trừ chữ, số và khoảng trắng
        .trim() // Loại bỏ khoảng trắng dư thừa ở đầu/cuối chuỗi

      const mineType = formatMimeType(attachmentFile) // Lấy MIME type (ví dụ: image/jpeg, application/pdf)
      let uploadResult
      if (mineType.startsWith('image/')) {
        // Nếu là ảnh, sử dụng streamUpload
        uploadResult = await CloudinaryProvider.streamUpload(attachmentFile.buffer, 'KanbanBoard/attachments')
      } else {
        // Nếu không phải ảnh, sử dụng streamUploadAttachment
        uploadResult = await CloudinaryProvider.streamUploadAttachment(
          attachmentFile.buffer,
          'KanbanBoard/attachments',
          fileName,
          mineType
        )
      }

      newAttachment.name = fileName
      newAttachment.link = `${uploadResult.secure_url}`
      newAttachment.type = formatMimeTypeShort(attachmentFile)
      newAttachment.size = parseInt(attachmentFile.size)
    }

    // Gọi tầng model xử lý bản ghi vào DB
    const createdAttachment = await AttachmentModel.createNew(userId, newAttachment)
    const getNewAttachment = await AttachmentModel.findOneById(createdAttachment.insertedId)
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

const update = async (attachmentId, updateData) => {
  try {
    // console.log(updateData)
    const updateAttachment = await AttachmentModel.update(attachmentId, updateData)
    return updateAttachment
  } catch (error) {
    throw error
  }
}
const deleteAttachment = async attachmentId => {
  try {
    const targetAttachment = await AttachmentModel.findOneById(attachmentId)
    // console.log('🚀 ~ deleteItem ~ targetColumn:', targetColumn)
    if (!targetAttachment) throw new ApiError(StatusCodes.NOT_FOUND, 'Attachment not found!')
    // xoa attachment
    await AttachmentModel.deleteOneById(attachmentId)
    // xoa attachment thuoc card
    await AttachmentModel.pullCardAttachmentIds(attachmentId)
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
