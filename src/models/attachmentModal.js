import Joi from 'joi'
import { ObjectId } from 'mongodb'
import { GET_DB } from '~/config/mongodb'
import { cardModel } from './cardModel'
import { pick } from 'lodash'
// Define Collection (name & schema)
const ATTACHMENT_COLLECTION_NAME = 'attachments'
const ATTACHMENT_COLLECTION_SCHEMA = Joi.object({
  name: Joi.string().min(1).max(100).trim().strict().required(),
  link: Joi.string().uri().trim().strict().required(),
  size: Joi.number().required(),
  type: Joi.string().min(3).trim().strict().required(),
  description: Joi.string().allow(null, ''),

  createdAt: Joi.date().timestamp('javascript').default(Date.now),
  updatedAt: Joi.date().timestamp('javascript').default(null),
  _destroy: Joi.boolean().default(false)
})
// chi dinh nhung field khong dc cap nhat
const INVALID_UPDATE_FIELDS = ['_id', 'createdAt', 'link']

const validateBeforeCreate = async data => {
  return ATTACHMENT_COLLECTION_SCHEMA.validateAsync(data, { abortEarly: false })
}
// done
const getAttachmentsByIds = async attachmentIds => {
  try {
    const attachments = await GET_DB()
      .collection(ATTACHMENT_COLLECTION_NAME)
      .find({
        _id: { $in: attachmentIds.map(id => new ObjectId(id)) },
        _destroy: false
      })
      .toArray()

    return attachments.map(attachment => ({
      _id: attachment._id.toString(),
      ...pick(attachment, ['name', 'link', 'size', 'type', 'description'])
    }))
  } catch (error) {
    throw new Error(error)
  }
}

const getCardAttachments = async cardId => {
  try {
    const card = await GET_DB()
      .collection(cardModel.CARD_COLLECTION_NAME)
      .findOne({ _id: new ObjectId(cardId) })

    if (
      !card ||
      !card.cardAttachmentIds ||
      card.cardAttachmentIds.length === 0
    ) {
      return { attachments: [], totalAttachments: 0 }
    }

    const attachmentIds = card.cardAttachmentIds.map(id => new ObjectId(id))

    const attachments = await GET_DB()
      .collection(ATTACHMENT_COLLECTION_NAME)
      .find({ _id: { $in: attachmentIds }, _destroy: false })
      .toArray()

    return {
      attachments: attachments.map(label =>
        pick(label, ['_id', 'name', 'description', 'link', 'type', 'size'])
      )
    }
  } catch (error) {
    throw new Error(error)
  }
}

// done
const createNew = async (userId, data) => {
  try {
    const validData = await validateBeforeCreate(data)
    const newAttachmentToAdd = {
      ...validData,
      ownerId: new ObjectId(userId)
    }
    const createdAttachment = await GET_DB()
      .collection(ATTACHMENT_COLLECTION_NAME)
      .insertOne(newAttachmentToAdd)
    return createdAttachment
  } catch (error) {
    throw new Error(error)
  }
}
// done
const findOneById = async id => {
  try {
    const result = await GET_DB()
      .collection(ATTACHMENT_COLLECTION_NAME)
      .findOne({ _id: new ObjectId(id) })
    return result
  } catch (error) {
    throw new Error(error)
  }
}

// done
const update = async (attachmentId, updateData) => {
  try {
    // loc field khong cho phep update
    Object.keys(updateData).forEach(fieldName => {
      if (INVALID_UPDATE_FIELDS.includes(fieldName))
        delete updateData[fieldName]
    })
    const result = await GET_DB()
      .collection(ATTACHMENT_COLLECTION_NAME)
      .findOneAndUpdate(
        { _id: new ObjectId(attachmentId) },
        { $set: updateData },
        { returnDocument: 'after' }
      )
    return result
  } catch (error) {
    throw new Error(error)
  }
}

// done
const deleteOneById = async attachmentId => {
  try {
    const result = await GET_DB()
      .collection(ATTACHMENT_COLLECTION_NAME)
      .deleteOne({ _id: new ObjectId(attachmentId) })
    return result
  } catch (error) {
    throw new Error(error)
  }
}

const pushCardAttachmentIds = async (cardId, attachmentId) => {
  try {
    const result = await GET_DB()
      .collection(cardModel.CARD_COLLECTION_NAME)
      .findOneAndUpdate(
        { _id: new ObjectId(cardId) },
        { $push: { cardAttachmentIds: new ObjectId(attachmentId) } },
        { returnDocument: 'after' }
      )
    return result
  } catch (error) {
    throw new Error(error)
  }
}

const pullCardAttachmentIds = async labelId => {
  try {
    const result = await GET_DB()
      .collection(cardModel.CARD_COLLECTION_NAME)
      .updateMany(
        { cardAttachmentIds: new ObjectId(labelId) },
        { $pull: { cardAttachmentIds: new ObjectId(labelId) } }
      )

    return result
  } catch (error) {
    throw new Error(error)
  }
}

export const AttachmentModel = {
  ATTACHMENT_COLLECTION_NAME,
  ATTACHMENT_COLLECTION_SCHEMA,
  createNew,
  update,
  deleteOneById,
  getCardAttachments,
  findOneById,
  getAttachmentsByIds,
  pushCardAttachmentIds,
  pullCardAttachmentIds
}

//board 6710c1dea34456a8d94373bc
//column 6710c5a9a2f7c59a026cddf6
//card 6710c678a2f7c59a026cddf8
