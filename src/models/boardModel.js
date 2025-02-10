import Joi from 'joi'
import { ObjectId } from 'mongodb'
import { GET_DB } from '~/config/mongodb'
import { BOARD_TYPES } from '~/utils/constants'
import { OBJECT_ID_RULE, OBJECT_ID_RULE_MESSAGE } from '~/utils/validators'
import { columnModel } from './columnModel'
import { cardModel } from './cardModel'
import { pageSkipValue } from '~/utils/algorithms'
import { userModel } from './userModel'
// Define Collection (name & schema)
const BOARD_COLLECTION_NAME = 'boards'
const BOARD_COLLECTION_SCHEMA = Joi.object({
  title: Joi.string().required().min(3).max(50).trim().strict(),
  slug: Joi.string().required().min(3).trim().strict(),
  description: Joi.string().required().min(3).max(256).trim().strict(),

  type: Joi.string().valid(BOARD_TYPES.PUBLIC, BOARD_TYPES.PRIVATE).required(),

  // Lưu ý các item trong mảng columnOrderIds là ObjectId nên cần thêm pattern cho chuẩn nhé, (lúc quay video số 57 mình quên nhưng sang đầu video số 58 sẽ có nhắc lại về cái này.)
  columnOrderIds: Joi.array()
    .items(Joi.string().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE))
    .default([]),
  // Admin cua board
  ownerIds: Joi.array()
    .items(Joi.string().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE))
    .default([]),
  // member cua board
  memberIds: Joi.array()
    .items(Joi.string().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE))
    .default([]),
  boardLabelIds: Joi.array()
    .items(Joi.string().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE))
    .default([]),

  createdAt: Joi.date().timestamp('javascript').default(Date.now),
  updatedAt: Joi.date().timestamp('javascript').default(null),
  _destroy: Joi.boolean().default(false)
})
// chi dinh nhung field khong dc cap nhat
const INVALID_UPDATE_FIELDS = ['_id', 'createdAt']

const validateBeforeCreate = async data => {
  return BOARD_COLLECTION_SCHEMA.validateAsync(data, { abortEarly: false })
}

const createNew = async (userId, data) => {
  try {
    const validData = await validateBeforeCreate(data)
    const newBoardToAdd = {
      ...validData,
      ownerIds: [new ObjectId(userId)]
    }
    const createdBoard = await GET_DB()
      .collection(BOARD_COLLECTION_NAME)
      .insertOne(newBoardToAdd)
    return createdBoard
  } catch (error) {
    throw new Error(error)
  }
}

const findOneById = async id => {
  try {
    const result = await GET_DB()
      .collection(BOARD_COLLECTION_NAME)
      .findOne({ _id: new ObjectId(id) })
    return result
  } catch (error) {
    throw new Error(error)
  }
}
const getDetails = async (userId, boardId) => {
  try {
    const queryCondition = [
      { _id: new ObjectId(boardId) },
      { _destroy: false },
      {
        $or: [
          { ownerIds: { $all: [new ObjectId(userId)] } },
          { memberIds: { $all: [new ObjectId(userId)] } }
        ]
      }
    ]
    // con phan aggregate chung ta phai update
    const result = await GET_DB()
      .collection(BOARD_COLLECTION_NAME)
      .aggregate([
        { $match: { $and: queryCondition } },
        {
          $lookup: {
            from: columnModel.COLUMN_COLLECTION_NAME,
            localField: '_id',
            foreignField: 'boardId',
            as: 'columns'
          }
        },
        {
          $lookup: {
            from: cardModel.CARD_COLLECTION_NAME,
            localField: '_id',
            foreignField: 'boardId',
            as: 'cards'
          }
        },
        {
          $lookup: {
            from: userModel.USER_COLLECTION_NAME,
            localField: 'ownerIds',
            foreignField: '_id',
            as: 'owners',
            // pipeline: để xử lí 1 hoặc nhiều luồng 1 lúc
            //  $project chỉ định vài field không muốn lấy bằng cách gán = 0
            pipeline: [{ $project: { password: 0, verifyToken: 0 } }]
          }
        },
        {
          $lookup: {
            from: userModel.USER_COLLECTION_NAME,
            localField: 'memberIds',
            foreignField: '_id',
            as: 'members',
            pipeline: [{ $project: { password: 0, verifyToken: 0 } }]
          }
        }
      ])
      .toArray()
    // console.log(result)
    return result[0] || null
  } catch (error) {
    throw new Error(error)
  }
}
// push 1 gia tri column id vao mang columnOrderIds
const pushColumnOrderIds = async column => {
  try {
    const result = await GET_DB()
      .collection(BOARD_COLLECTION_NAME)
      .findOneAndUpdate(
        { _id: new ObjectId(column.boardId) },
        { $push: { columnOrderIds: new ObjectId(column._id) } },
        { returnDocument: 'after' }
      )
    return result
  } catch (error) {
    throw new Error(error)
  }
}
const pushMemberIds = async (boardId, userId) => {
  try {
    const result = await GET_DB()
      .collection(BOARD_COLLECTION_NAME)
      .findOneAndUpdate(
        { _id: new ObjectId(boardId) },
        { $push: { memberIds: new ObjectId(userId) } },
        { returnDocument: 'after' }
      )
    return result
  } catch (error) {
    throw new Error(error)
  }
}

const update = async (boardId, updateData) => {
  try {
    // loc field khong cho phep update
    Object.keys(updateData).forEach(fieldName => {
      if (INVALID_UPDATE_FIELDS.includes(fieldName))
        delete updateData[fieldName]
    })
    if (updateData.columnOrderIds)
      updateData.columnOrderIds = updateData.columnOrderIds.map(
        _id => new ObjectId(_id)
      )
    const result = await GET_DB()
      .collection(BOARD_COLLECTION_NAME)
      .findOneAndUpdate(
        { _id: new ObjectId(boardId) },
        { $set: updateData },
        { returnDocument: 'after' }
      )
    return result
  } catch (error) {
    throw new Error(error)
  }
}

const pullColumnOrderIds = async column => {
  try {
    const result = await GET_DB()
      .collection(BOARD_COLLECTION_NAME)
      .findOneAndUpdate(
        { _id: new ObjectId(column.boardId) },
        { $pull: { columnOrderIds: new ObjectId(column._id) } },
        { returnDocument: 'after' }
      )
    return result
  } catch (error) {
    throw new Error(error)
  }
}

const getBoards = async (userId, page, itemPerPage, queryFilters) => {
  try {
    //
    const queryCondition = [
      // dieu kien 1 => board chua bi xoa
      { _destroy: false },
      // userId phai la owner id va user id
      {
        $or: [
          { ownerIds: { $all: [new ObjectId(userId)] } },
          { memberIds: { $all: [new ObjectId(userId)] } }
        ]
      }
    ]
    // queryFilters for search boards title
    if (queryFilters) {
      // console.log(queryFilters)
      // console.log('queryFilters: ', Object.keys(queryFilters))
      Object.keys(queryFilters).forEach(key => {
        // phan biet chu hoa chu thg
        // queryCondition.push({
        //   [key]: {
        //     $regex: queryFilters[key]
        //   }
        // })
        // khong phan biet chu hoa chu thg
        queryCondition.push({
          [key]: {
            $regex: new RegExp(queryFilters[key], 'i')
          }
        })
      })
    }

    const query = await GET_DB()
      .collection(BOARD_COLLECTION_NAME)
      .aggregate(
        [
          { $match: { $and: queryCondition } },
          // sort : sap xep theo ten a-z (theo chuan ASCII nen B se dung truoc a)
          { $sort: { title: 1 } },
          {
            $facet: {
              // luồng thu nhat: query board
              queryBoards: [
                { $skip: pageSkipValue(page, itemPerPage) }, // bo qua so luồng bang ghi page trc do},
                { $limit: itemPerPage } // gioi han toi da du lieu tra ve
              ],
              // query dem tong so luong bang ghi board
              querryTotalBoards: [{ $count: 'countedAllBoards' }]
            }
          }
        ],
        {
          collation: { locale: 'en' }
          // https://www.mongodb.com/docs/v6.0/reference/collation/#std-label-collation-document-fields
        }
      )
      .toArray()
    // console.log('query: ', query)
    const res = query[0]
    return {
      boards: res.queryBoards || [],
      totalBoard: res.querryTotalBoards[0]?.countedAllBoards || 0
    }
  } catch (error) {
    throw new Error(error)
  }
}

export const boardModel = {
  BOARD_COLLECTION_NAME,
  BOARD_COLLECTION_SCHEMA,
  createNew,
  findOneById,
  getDetails,
  pushColumnOrderIds,
  update,
  pullColumnOrderIds,
  getBoards,
  pushMemberIds
}

//board 6710c1dea34456a8d94373bc
//column 6710c5a9a2f7c59a026cddf6
//card 6710c678a2f7c59a026cddf8
