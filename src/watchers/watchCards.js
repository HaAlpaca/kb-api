/* eslint-disable no-console */
import { GET_DB } from '~/config/mongodb'
import { ObjectId } from 'mongodb'
import { getSocketInstance } from '~/sockets/socketInstance'

export const WATCH_AUTOMATION = async () => {
  try {
    const db = GET_DB()
    const cardsCollection = db.collection('cards')
    const boardsCollection = db.collection('boards')

    console.log('Change Stream: Watching cards collection for changes...')

    // Theo dõi thay đổi trong collection cards
    const changeStream = cardsCollection.watch()

    changeStream.on('change', async change => {
      try {
        if (change.operationType === 'update') {
          const updatedFields = change.updateDescription.updatedFields
          const cardId = change.documentKey._id

          // Lấy thông tin card và board
          const card = await getCardById(cardsCollection, cardId)
          if (!card) return

          const board = await getBoardById(boardsCollection, card.boardId)
          if (!board) return

          // Xử lý các trigger
          await handleCompleteTrigger(cardsCollection, board, card, updatedFields)

          await handleOverdueTrigger(cardsCollection, board)
        }
      } catch (error) {
        console.error('Error processing change event:', error)
      }
    })

    changeStream.on('error', error => {
      console.error('Change Stream Error:', error)
    })
  } catch (error) {
    console.error('Error initializing Change Stream:', error)
  }
}

// Hàm lấy thông tin card theo ID
async function getCardById(cardsCollection, cardId) {
  const card = await cardsCollection.findOne({ _id: new ObjectId(cardId) })
  if (!card) {
    console.warn(`Card with ID ${cardId} not found.`)
  }
  return card
}

// Hàm lấy thông tin board theo ID
async function getBoardById(boardsCollection, boardId) {
  const board = await boardsCollection.findOne({ _id: new ObjectId(boardId) })
  if (!board) {
    console.warn(`Board with ID ${boardId} not found.`)
  }
  return board
}

// Xử lý trigger khi card hoàn thành
async function handleCompleteTrigger(cardsCollection, board, card, updatedFields) {
  const io = getSocketInstance()

  if (updatedFields.isComplete === true && board.isCompleteCardTrigger === true) {
    const completeColumnId = board.completeCardTriggerColumnId
    if (completeColumnId) {
      // Xóa card khỏi cardOrderIds của column hiện tại
      await GET_DB()
        .collection('columns')
        .updateOne({ _id: new ObjectId(card.columnId) }, { $pull: { cardOrderIds: new ObjectId(card._id) } })

      // Thêm card vào cardOrderIds của column mới
      await GET_DB()
        .collection('columns')
        .updateOne({ _id: new ObjectId(completeColumnId) }, { $push: { cardOrderIds: new ObjectId(card._id) } })

      // Cập nhật columnId của card
      await cardsCollection.updateOne(
        { _id: new ObjectId(card._id) },
        { $set: { columnId: new ObjectId(completeColumnId) } }
      )

      console.log(`Card ${card._id} moved to colzumn ${completeColumnId} (Complete Trigger)`)

      io.to(card.boardId.toString()).emit('BE_UPDATE_CARD', {
        card
      })
    } else {
      console.warn(`Complete trigger is enabled, but no column ID is set for board ${board._id}.`)
    }
  }
}

// Xử lý trigger khi card hết hạn
async function handleOverdueTrigger(cardsCollection, board) {
  const io = getSocketInstance()
  const now = new Date()

  console.log(`Checking overdue cards for board ${board._id}`)

  // Lấy tất cả các card trong board
  const cards = await cardsCollection.find({ boardId: board._id }).toArray()

  for (const card of cards) {
    if (
      card.dueDate &&
      !isNaN(new Date(card.dueDate)) && // Đảm bảo dueDate hợp lệ
      new Date(card.dueDate) < now &&
      board.isOverdueCardTrigger &&
      card.isComplete !== true
    ) {
      const overdueColumnId = board.overdueCardColumnId

      if (overdueColumnId) {
        try {
          console.log(`Moving card ${card._id} to overdue column ${overdueColumnId}`)

          // Xóa card khỏi cardOrderIds của column hiện tại
          await GET_DB()
            .collection('columns')
            .updateOne({ _id: new ObjectId(card.columnId) }, { $pull: { cardOrderIds: new ObjectId(card._id) } })

          // Thêm card vào cardOrderIds của column mới
          await GET_DB()
            .collection('columns')
            .updateOne({ _id: new ObjectId(overdueColumnId) }, { $push: { cardOrderIds: new ObjectId(card._id) } })

          // Cập nhật columnId của card
          await cardsCollection.updateOne(
            { _id: new ObjectId(card._id) },
            { $set: { columnId: new ObjectId(overdueColumnId) } }
          )

          console.log(`Card ${card._id} moved to column ${overdueColumnId} (Overdue Trigger)`)

          // Gửi sự kiện cập nhật card qua Socket.IO
          io.to(card.boardId.toString()).emit('BE_UPDATE_CARD', {
            card
          })
        } catch (error) {
          console.error(`Error handling overdue trigger for card ${card._id}:`, error)
        }
      } else {
        console.warn(`Overdue trigger is enabled, but no column ID is set for board ${board._id}.`)
      }
    }
  }
}
