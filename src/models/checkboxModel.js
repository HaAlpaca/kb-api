import Joi from 'joi'
import { ObjectId } from 'mongodb'
import { GET_DB } from '~/config/mongodb'
import { cardModel } from './cardModel'
import { pick } from 'lodash'
// Define Collection (name & schema)
const CHECKBOX_COLLECTION_NAME = 'checkboxes'
const CHECKBOX_COLLECTION_SCHEMA = Joi.object({
  name: Joi.string().min(1).max(100).trim().strict().required(),
  is_checked: Joi.boolean().default(false),

  createdAt: Joi.date().timestamp('javascript').default(Date.now),
  updatedAt: Joi.date().timestamp('javascript').default(null),
  _destroy: Joi.boolean().default(false)
})
// chi dinh nhung field khong dc cap nhat
const INVALID_UPDATE_FIELDS = ['_id', 'createdAt']

const validateBeforeCreate = async data => {
  return CHECKBOX_COLLECTION_SCHEMA.validateAsync(data, { abortEarly: false })
}
//
// const getCheckboxByIds = async checkBoxIds => {
//   try {
//     const attachments = await GET_DB()
//       .collection(CHECKBOX_COLLECTION_NAME)
//       .find({
//         _id: { $in: checkBoxIds.map(id => new ObjectId(id)) },
//         _destroy: false
//       })
//       .toArray()

//     return attachments.map(attachment => ({
//       _id: attachment._id.toString(),
//       ...pick(attachment, ['name', 'is_checked'])
//     }))
//   } catch (error) {
//     throw new Error(error)
//   }
// }

const getCardCheckboxes = async cardId => {
  try {
    const card = await GET_DB()
      .collection(cardModel.CARD_COLLECTION_NAME)
      .findOne({ _id: new ObjectId(cardId) })

    if (!card || !card.cardCheckboxIds || card.cardCheckboxIds.length === 0) {
      return { checkboxes: [] }
    }

    const checkboxIds = card.cardCheckboxIds.map(id => new ObjectId(id))

    const checkboxes = await GET_DB()
      .collection(CHECKBOX_COLLECTION_NAME)
      .find({ _id: { $in: checkboxIds }, _destroy: false })
      .toArray()

    return {
      checkboxes: checkboxes.map(checkboxes =>
        pick(checkboxes, ['_id', 'name', 'is_checked'])
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
    const newCheckboxToAdd = {
      ...validData,
      ownerId: new ObjectId(userId)
    }
    const createdCheckbox = await GET_DB()
      .collection(CHECKBOX_COLLECTION_NAME)
      .insertOne(newCheckboxToAdd)
    return createdCheckbox
  } catch (error) {
    throw new Error(error)
  }
}
// done
const findOneById = async id => {
  try {
    const result = await GET_DB()
      .collection(CHECKBOX_COLLECTION_NAME)
      .findOne({ _id: new ObjectId(id) })
    return result
  } catch (error) {
    throw new Error(error)
  }
}

// done
const update = async (checkboxId, updateData) => {
  try {
    // loc field khong cho phep update
    Object.keys(updateData).forEach(fieldName => {
      if (INVALID_UPDATE_FIELDS.includes(fieldName))
        delete updateData[fieldName]
    })
    const result = await GET_DB()
      .collection(CHECKBOX_COLLECTION_NAME)
      .findOneAndUpdate(
        { _id: new ObjectId(checkboxId) },
        { $set: updateData },
        { returnDocument: 'after' }
      )
    return result
  } catch (error) {
    throw new Error(error)
  }
}

const updateCheckboxChecked = async checkboxes => {
  try {
    const bulkOps = checkboxes.map(checkbox => ({
      updateOne: {
        filter: { _id: new ObjectId(checkbox._id) },
        update: { $set: { is_checked: checkbox.is_checked } }
      }
    }))

    const result = await GET_DB()
      .collection(CHECKBOX_COLLECTION_NAME)
      .bulkWrite(bulkOps)

    return result
  } catch (error) {
    throw new Error(error)
  }
}

// done
const deleteOneById = async checkboxId => {
  try {
    const result = await GET_DB()
      .collection(CHECKBOX_COLLECTION_NAME)
      .deleteOne({ _id: new ObjectId(checkboxId) })
    return result
  } catch (error) {
    throw new Error(error)
  }
}

const pushCardCheckboxIds = async (cardId, checkboxId) => {
  try {
    const result = await GET_DB()
      .collection(cardModel.CARD_COLLECTION_NAME)
      .findOneAndUpdate(
        { _id: new ObjectId(cardId) },
        { $push: { cardCheckboxIds: new ObjectId(checkboxId) } },
        { returnDocument: 'after' }
      )
    return result
  } catch (error) {
    throw new Error(error)
  }
}

const pullCardCheckboxIds = async checkboxId => {
  try {
    const result = await GET_DB()
      .collection(cardModel.CARD_COLLECTION_NAME)
      .updateMany(
        { cardCheckboxIds: new ObjectId(checkboxId) },
        { $pull: { cardCheckboxIds: new ObjectId(checkboxId) } }
      )

    return result
  } catch (error) {
    throw new Error(error)
  }
}

export const checkboxModel = {
  CHECKBOX_COLLECTION_NAME,
  CHECKBOX_COLLECTION_SCHEMA,
  createNew,
  update,
  deleteOneById,
  getCardCheckboxes,
  findOneById,
  pushCardCheckboxIds,
  pullCardCheckboxIds,
  updateCheckboxChecked
  //   getAttachmentsByIds,
  //   pushCardAttachmentIds,
  //   pullCardAttachmentIds
}

//board 6710c1dea34456a8d94373bc
//column 6710c5a9a2f7c59a026cddf6
//card 6710c678a2f7c59a026cddf8
