import Joi from 'joi'
import { ObjectId } from 'mongodb'
import { GET_DB } from '~/config/mongodb'
import { OBJECT_ID_RULE, OBJECT_ID_RULE_MESSAGE } from '~/utils/validators'

// Tên collection trong MongoDB
const CHAT_ROOM_COLLECTION_NAME = 'chatRooms'

// Schema cho ChatRoom
const CHAT_ROOM_COLLECTION_SCHEMA = Joi.object({
  boardId: Joi.string()
    .pattern(OBJECT_ID_RULE)
    .message(OBJECT_ID_RULE_MESSAGE)
    .optional(), // Chỉ bắt buộc nếu là phòng chat liên kết với board

  title: Joi.string().trim().optional(), // Tên phòng chat (nếu cần)
  memberIds: Joi.array()
    .items(Joi.string().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE))
    .default([]), // Danh sách thành viên tham gia phòng chat
  messages: Joi.array()
    .items(
      Joi.object({
        senderId: Joi.string()
          .pattern(OBJECT_ID_RULE)
          .message(OBJECT_ID_RULE_MESSAGE)
          .required(), // ID người gửi
        content: Joi.string().required().trim(), // Nội dung tin nhắn
        isRead: Joi.boolean().default(false), // Trạng thái đã đọc
        createdAt: Joi.date().timestamp('javascript').default(Date.now), // Thời gian gửi
        deletedAt: Joi.date().timestamp('javascript').optional() // Thời gian xóa (nếu có)
      })
    )
    .default([]), // Danh sách tin nhắn
  createdAt: Joi.date().timestamp('javascript').default(Date.now), // Thời gian tạo phòng
  updatedAt: Joi.date().timestamp('javascript').default(null) // Thời gian cập nhật gần nhất
})

// Hàm tạo ChatRoom mới
const createNewChatRoom = async (
  boardId = null,
  title = null,
  memberIds = []
) => {
  const newChatRoom = {
    boardId,
    title,
    memberIds,
    messages: [],
    createdAt: Date.now(),
    updatedAt: null
  }
  const result = await GET_DB()
    .collection(CHAT_ROOM_COLLECTION_NAME)
    .insertOne(newChatRoom)
  return result
}

// Hàm thêm tin nhắn vào ChatRoom
const addMessage = async (roomId, message) => {
  const result = await GET_DB()
    .collection(CHAT_ROOM_COLLECTION_NAME)
    .findOneAndUpdate(
      { _id: roomId },
      { $push: { messages: message }, $set: { updatedAt: Date.now() } },
      { returnDocument: 'after' }
    )
  return result.value
}

// Hàm lấy ChatRoom theo ID
const getChatRoomById = async roomId => {
  const result = await GET_DB()
    .collection(CHAT_ROOM_COLLECTION_NAME)
    .findOne({ _id: new ObjectId(roomId) })
  return result
}

// Hàm lấy ChatRoom theo boardId
const getChatRoomByBoardId = async boardId => {
  const result = await GET_DB()
    .collection(CHAT_ROOM_COLLECTION_NAME)
    .findOne({ boardId })
  return result
}

// Hàm thêm thành viên vào ChatRoom
const addMembersToChatRoom = async (roomId, memberIds) => {
  const result = await GET_DB()
    .collection(CHAT_ROOM_COLLECTION_NAME)
    .findOneAndUpdate(
      { _id: new ObjectId(roomId) },
      {
        $addToSet: { memberIds: { $each: memberIds } },
        $set: { updatedAt: Date.now() }
      },
      { returnDocument: 'after' }
    )
  return result.value
}

export const chatRoomModel = {
  CHAT_ROOM_COLLECTION_NAME,
  CHAT_ROOM_COLLECTION_SCHEMA,
  createNewChatRoom,
  addMessage,
  getChatRoomById,
  getChatRoomByBoardId,
  addMembersToChatRoom
}
