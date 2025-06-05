import Joi from 'joi'
import { ObjectId } from 'mongodb'
import { GET_DB } from '~/config/mongodb'
import { BOARD_TYPES, CARD_MEMBER_ACTION, PERMISSION_NAME, ROLE_NAME } from '~/utils/constants'
import { OBJECT_ID_RULE, OBJECT_ID_RULE_MESSAGE } from '~/utils/validators'
import { columnModel } from './columnModel'
import { cardModel } from './cardModel'
import { generateRole, pageSkipValue } from '~/utils/algorithms'
import { userModel } from './userModel'
import { labelModel } from './labelModel'

// Define Collection (name & schema)
const BOARD_COLLECTION_NAME = 'boards'
const BOARD_COLLECTION_SCHEMA = Joi.object({
  title: Joi.string().required().min(3).max(50).trim().strict(),
  slug: Joi.string().required().min(3).trim().strict(),
  description: Joi.string().required().min(3).max(256).trim().strict(),

  type: Joi.string().valid(BOARD_TYPES.PUBLIC, BOARD_TYPES.PRIVATE).required(),
  cover: Joi.string().default('https://images.unsplash.com/photo-1669236712949-b58f9758898d'),
  // Lưu ý các item trong mảng columnOrderIds là ObjectId nên cần thêm pattern cho chuẩn nhé, (lúc quay video số 57 mình quên nhưng sang đầu video số 58 sẽ có nhắc lại về cái này.)
  columnOrderIds: Joi.array().items(Joi.string().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE)).default([]),
  // Admin cua board
  ownerIds: Joi.array().items(Joi.string().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE)).default([]),
  // member cua board
  memberIds: Joi.array().items(Joi.string().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE)).default([]),
  boardLabelIds: Joi.array().items(Joi.string().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE)).default([]),

  // role base
  usersRole: Joi.array()
    .items(
      Joi.object({
        userId: Joi.string().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE),
        role: Joi.string()
          .valid(...Object.values(ROLE_NAME))
          .required(),
        permissions: Joi.array()
          .items(...Object.values(PERMISSION_NAME))
          .default([])
      })
    )
    .default([]),

  createdAt: Joi.date().timestamp('javascript').default(Date.now),
  updatedAt: Joi.date().timestamp('javascript').default(null),
  _destroy: Joi.boolean().default(false),

  // // automation trigger

  // // khi card hoàn thành thì chuyển sang cột cụ thể
  isCompleteCardTrigger: Joi.boolean().default(false),
  completeCardTriggerColumnId: Joi.string().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE).default(null),
  // khi card hết hạn thì chuyển sang cột cụ thể
  isOverdueCardTrigger: Joi.boolean().default(false),
  overdueCardColumnId: Joi.string().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE).default(null)
})
// chi dinh nhung field khong dc cap nhat
const INVALID_UPDATE_FIELDS = ['_id', 'createdAt']

const validateBeforeCreate = async data => {
  return BOARD_COLLECTION_SCHEMA.validateAsync(data, { abortEarly: false })
}

const getRolePermissions = async (userId, boardId) => {
  const result = await GET_DB()
    .collection(BOARD_COLLECTION_NAME)
    .findOne(
      {
        _id: new ObjectId(boardId),
        'usersRole.userId': new ObjectId(userId) // Tìm userId trong mảng usersRole
      },
      {
        projection: {
          'usersRole.$': 1 // Chỉ lấy phần tử trong mảng usersRole có userId khớp
        }
      }
    )

  // Kiểm tra xem có kết quả không và lấy ra role và permissions
  if (result && result.usersRole && result.usersRole.length > 0) {
    return result.usersRole[0]
  }
  return null
}

const updateUserRole = async (userId, boardId, role) => {
  try {
    const newRoleData = generateRole(userId, role)

    const result = await GET_DB()
      .collection(BOARD_COLLECTION_NAME)
      .updateOne(
        {
          _id: new ObjectId(boardId),
          'usersRole.userId': new ObjectId(userId)
        },
        {
          $set: {
            'usersRole.$': newRoleData
          }
        }
      )
    return result
  } catch (error) {
    throw new Error(error)
  }
}

const createNew = async (userId, data) => {
  try {
    // handle valid data
    const validData = await validateBeforeCreate(data)
    // add role to owner
    const newBoardToAdd = {
      ...validData,
      ownerIds: [new ObjectId(userId)],
      usersRole: [generateRole(userId, ROLE_NAME.ADMIN)]
    }
    const createdBoard = await GET_DB().collection(BOARD_COLLECTION_NAME).insertOne(newBoardToAdd)
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
const getDetails = async (userId, boardId, queryFilters) => {
  try {
    const queryCondition = [
      { _id: new ObjectId(boardId) },
      { _destroy: false },
      {
        $or: [{ ownerIds: { $all: [new ObjectId(userId)] } }, { memberIds: { $all: [new ObjectId(userId)] } }]
      }
    ]

    const cardFilters = []

    // Áp dụng các bộ lọc cho card
    if (queryFilters) {
      if (queryFilters.members) {
        cardFilters.push({
          memberIds: { $in: queryFilters.members.map(id => new ObjectId(id)) } // Lọc theo danh sách thành viên
        })
      }
      if (queryFilters.startDate && queryFilters.endDate) {
        cardFilters.push({
          dueDate: {
            $gte: queryFilters.startDate, // Lọc từ timestamp startDate
            $lte: queryFilters.endDate // Lọc đến timestamp endDate
          }
        })
      } else if (queryFilters.startDate) {
        cardFilters.push({
          dueDate: { $gte: queryFilters.startDate } // Chỉ lọc từ timestamp startDate
        })
      } else if (queryFilters.endDate) {
        cardFilters.push({
          dueDate: { $lte: queryFilters.endDate } // Chỉ lọc đến timestamp endDate
        })
      }

      if (queryFilters.isComplete !== undefined) {
        cardFilters.push({
          isComplete: queryFilters.isComplete // Lọc theo trạng thái hoàn thành
        })
      }

      if (queryFilters.title) {
        cardFilters.push({
          title: queryFilters.title // Lọc theo tiêu đề
        })
      }

      if (queryFilters.labels) {
        cardFilters.push({
          cardLabelIds: { $in: queryFilters.labels.map(id => new ObjectId(id)) } // Lọc theo nhãn
        })
      }
    }

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
            let: { boardId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ['$boardId', '$$boardId'] },
                  ...(cardFilters.length > 0 && { $and: cardFilters }) // Áp dụng bộ lọc cho card
                }
              },
              {
                $lookup: {
                  from: 'checklists',
                  localField: 'cardChecklistIds',
                  foreignField: '_id',
                  as: 'checklists'
                }
              }
            ],
            as: 'cards'
          }
        },
        {
          $lookup: {
            from: userModel.USER_COLLECTION_NAME,
            localField: 'ownerIds',
            foreignField: '_id',
            as: 'owners',
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
        },
        {
          $lookup: {
            from: labelModel.LABEL_COLLECTION_NAME,
            localField: 'boardLabelIds',
            foreignField: '_id',
            as: 'labels',
            pipeline: [{ $project: { _id: 1, title: 1, colour: 1 } }]
          }
        }
      ])
      .toArray()

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
        {
          $push: {
            memberIds: new ObjectId(userId),
            usersRole: generateRole(userId, ROLE_NAME.USER)
          }
        },
        { returnDocument: 'after' }
      )

    // Tạo vai trò mới cho userId
    const newRoleData = generateRole(userId, ROLE_NAME.USER)

    // Cập nhật vai trò và quyền của userId trong usersRole
    await GET_DB()
      .collection(BOARD_COLLECTION_NAME)
      .updateOne(
        {
          _id: new ObjectId(boardId),
          'usersRole.userId': new ObjectId(userId) // Tìm userId trong mảng usersRole
        },
        {
          $set: { 'usersRole.$': newRoleData } // Cập nhật vai trò và quyền mới
        }
      )
    return result
  } catch (error) {
    throw new Error(error)
  }
}

const update = async (boardId, updateData) => {
  try {
    // Loại bỏ các trường không được phép cập nhật
    Object.keys(updateData).forEach(fieldName => {
      if (INVALID_UPDATE_FIELDS.includes(fieldName)) delete updateData[fieldName]
    })

    // update automation
    if (updateData.completeCardTriggerColumnId) {
      updateData.completeCardTriggerColumnId = new ObjectId(updateData.completeCardTriggerColumnId)
    }
    if (updateData.overdueCardColumnId) {
      updateData.overdueCardColumnId = new ObjectId(updateData.overdueCardColumnId)
    }

    // Cập nhật board trong cơ sở dữ liệu
    const result = await GET_DB()
      .collection(BOARD_COLLECTION_NAME)
      .findOneAndUpdate({ _id: new ObjectId(boardId) }, { $set: updateData }, { returnDocument: 'after' })

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
        $or: [{ ownerIds: { $all: [new ObjectId(userId)] } }, { memberIds: { $all: [new ObjectId(userId)] } }]
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

const getPrivateBoards = async (userId, page, itemPerPage, queryFilters) => {
  try {
    //
    const queryCondition = [
      // dieu kien 1 => board chua bi xoa
      { _destroy: false },
      // dieu kien 2 => board co type la private
      { type: 'private' },
      // userId phai la owner id va user id
      {
        $or: [{ ownerIds: { $all: [new ObjectId(userId)] } }, { memberIds: { $all: [new ObjectId(userId)] } }]
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
const getArchivedBoards = async (userId, page, itemPerPage, queryFilters) => {
  try {
    //
    const queryCondition = [
      // Điều kiện 1: Board đã bị xóa
      { _destroy: true },
      // Điều kiện 2: Người dùng phải là owner của board
      { ownerIds: { $all: [new ObjectId(userId)] } }
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

const getPublicBoards = async (page, itemPerPage, queryFilters) => {
  try {
    const queryCondition = [
      // Điều kiện 1: Board chưa bị xóa
      { _destroy: false },
      // Điều kiện 2: Board có type là public
      { type: 'public' }
    ]

    // Thêm bộ lọc tìm kiếm nếu có
    if (queryFilters) {
      Object.keys(queryFilters).forEach(key => {
        queryCondition.push({
          [key]: {
            $regex: new RegExp(queryFilters[key], 'i') // Không phân biệt chữ hoa chữ thường
          }
        })
      })
    }

    const query = await GET_DB()
      .collection(BOARD_COLLECTION_NAME)
      .aggregate([
        { $match: { $and: queryCondition } },
        // Sắp xếp theo tên (A-Z)
        { $sort: { title: 1 } },
        {
          $facet: {
            // Lấy danh sách board
            queryBoards: [
              { $skip: pageSkipValue(page, itemPerPage) }, // Bỏ qua số lượng bản ghi của các trang trước
              { $limit: itemPerPage } // Giới hạn số lượng bản ghi trả về
            ],
            // Đếm tổng số lượng board
            queryTotalBoards: [{ $count: 'countedAllBoards' }]
          }
        }
      ])
      .toArray()

    const res = query[0]
    return {
      boards: res.queryBoards || [],
      totalBoard: res.queryTotalBoards[0]?.countedAllBoards || 0
    }
  } catch (error) {
    throw new Error(error)
  }
}

const updateMembers = async (boardId, updateData) => {
  try {
    const incomingMemberInfo = updateData.incomingMemberInfo
    let updateCondition = {}
    if (incomingMemberInfo.action === CARD_MEMBER_ACTION.ADD) {
      updateCondition = {
        $push: {
          ownerIds: new ObjectId(incomingMemberInfo.userId)
        },
        $pull: {
          memberIds: new ObjectId(incomingMemberInfo.userId)
        }
      }
    }
    if (incomingMemberInfo.action === CARD_MEMBER_ACTION.REMOVE) {
      updateCondition = {
        $pull: {
          ownerIds: new ObjectId(incomingMemberInfo.userId)
        },
        $push: {
          memberIds: new ObjectId(incomingMemberInfo.userId)
        }
      }
    }
    // console.log(updateCondition)
    const result = await GET_DB()
      .collection(BOARD_COLLECTION_NAME)
      .findOneAndUpdate({ _id: new ObjectId(boardId) }, updateCondition, {
        returnDocument: 'after'
      })
    return result
  } catch (error) {
    throw new Error(error)
  }
}

const getDetailsBoardAnalytics = async (userId, boardId) => {
  try {
    const queryCondition = [
      { _id: new ObjectId(boardId) },
      { _destroy: false },
      {
        $or: [{ ownerIds: { $all: [new ObjectId(userId)] } }, { memberIds: { $all: [new ObjectId(userId)] } }]
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
            let: { boardId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ['$boardId', '$$boardId'] }
                }
              },
              {
                $lookup: {
                  from: 'checklists',
                  localField: 'cardChecklistIds',
                  foreignField: '_id',
                  as: 'checklists'
                }
              }
            ],
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
    return result[0] || null
  } catch (error) {
    throw new Error(error)
  }
}

const archiveBoard = async (userId, boardId) => {
  try {
    const result = await GET_DB()
      .collection(BOARD_COLLECTION_NAME)
      .findOneAndUpdate(
        { _id: new ObjectId(boardId), _destroy: false, ownerIds: { $in: [new ObjectId(userId)] } },
        { $set: { _destroy: true, updatedAt: Date.now() } }, // Đánh dấu board là đã bị xóa
        { returnDocument: 'after' }
      )
    return result
  } catch (error) {
    throw new Error(error)
  }
}

const unArchiveBoard = async (userId, boardId) => {
  try {
    const result = await GET_DB()
      .collection(BOARD_COLLECTION_NAME)
      .findOneAndUpdate(
        { _id: new ObjectId(boardId), _destroy: true, ownerIds: { $in: [new ObjectId(userId)] } },
        { $set: { _destroy: false, updatedAt: Date.now() } }, // Đánh dấu board là đã bị xóa
        { returnDocument: 'after' }
      )
    return result
  } catch (error) {
    throw new Error(error)
  }
}
const leaveBoard = async (userId, boardId) => {
  try {
    const board = await GET_DB()
      .collection(BOARD_COLLECTION_NAME)
      .findOne({ _id: new ObjectId(boardId), _destroy: false })

    if (!board) {
      throw new Error('Board not found or has been deleted.')
    }

    const result = await GET_DB()
      .collection(BOARD_COLLECTION_NAME)
      .findOneAndUpdate(
        {
          _id: new ObjectId(boardId),
          _destroy: false,
          $or: [{ ownerIds: { $all: [new ObjectId(userId)] } }, { memberIds: { $all: [new ObjectId(userId)] } }]
        },
        {
          $pull: {
            memberIds: new ObjectId(userId),
            ownerIds: new ObjectId(userId),
            usersRole: { userId: new ObjectId(userId) }
          }
        },
        { returnDocument: 'after' }
      )

    return result.value
  } catch (error) {
    throw new Error(error.message || 'An error occurred while leaving the board.')
  }
}

const unshiftOwnerIds = async (boardId, userId) => {
  try {
    const db = GET_DB().collection(BOARD_COLLECTION_NAME)

    // Đảm bảo không thêm trùng lặp bằng $addToSet
    await db.updateOne({ _id: new ObjectId(boardId) }, { $addToSet: { ownerIds: new ObjectId(userId) } })

    // Đưa userId lên đầu danh sách bằng $push với $position
    const result = await db.findOneAndUpdate(
      { _id: new ObjectId(boardId) },
      { $push: { ownerIds: { $each: [], $position: 0 } }, $pull: { memberIds: new ObjectId(userId) } },
      { returnDocument: 'after' }
    )

    // Tạo vai trò mới cho userId
    const newRoleData = generateRole(userId, ROLE_NAME.ADMIN)

    // Cập nhật vai trò và quyền của userId trong usersRole
    await GET_DB()
      .collection(BOARD_COLLECTION_NAME)
      .updateOne(
        {
          _id: new ObjectId(boardId),
          'usersRole.userId': new ObjectId(userId) // Tìm userId trong mảng usersRole
        },
        {
          $set: { 'usersRole.$': newRoleData } // Cập nhật vai trò và quyền mới
        }
      )

    return result.value // Trả về giá trị sau khi cập nhật
  } catch (error) {
    throw new Error(error)
  }
}
export const boardModel = {
  BOARD_COLLECTION_NAME,
  BOARD_COLLECTION_SCHEMA,
  updateMembers,
  createNew,
  findOneById,
  getDetails,
  pushColumnOrderIds,
  update,
  pullColumnOrderIds,
  getBoards,
  pushMemberIds,
  getDetailsBoardAnalytics,
  getRolePermissions,
  updateUserRole,
  getPublicBoards,
  getPrivateBoards,
  archiveBoard,
  getArchivedBoards,
  unArchiveBoard,
  leaveBoard,
  unshiftOwnerIds
}

//board 6710c1dea34456a8d94373bc
//column 6710c5a9a2f7c59a026cddf6
//card 6710c678a2f7c59a026cddf8
