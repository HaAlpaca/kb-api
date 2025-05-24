/* eslint-disable no-console */
import { GET_DB } from '~/config/mongodb'
import { ObjectId } from 'mongodb'
import { getSocketInstance } from '~/sockets/socketInstance'
const io = getSocketInstance()

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
          await handleOverdueTrigger(cardsCollection, board, card)
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
  if (updatedFields.isComplete === true && board.isCompleteCardTrigger) {
    const completeColumnId = board.completeCardTriggerColumnId
    if (completeColumnId) {
      await cardsCollection.updateOne(
        { _id: new ObjectId(card._id) },
        { $set: { columnId: new ObjectId(completeColumnId) } }
      )
      console.log(`Card ${card._id} moved to column ${completeColumnId} (Complete Trigger)`)

      io.to(card.boardId.toString()).emit('BE_UPDATE_CARD', {
        card
      })
    } else {
      console.warn(`Complete trigger is enabled, but no column ID is set for board ${board._id}.`)
    }
  }
}

// Xử lý trigger khi card hết hạn
async function handleOverdueTrigger(cardsCollection, board, card) {
  const now = new Date()
  if (card.dueDate && new Date(card.dueDate) < now && board.isOverdueCardTrigger) {
    const overdueColumnId = board.overdueCardColumnId
    if (overdueColumnId) {
      await cardsCollection.updateOne(
        { _id: new ObjectId(card._id) },
        { $set: { columnId: new ObjectId(overdueColumnId) } }
      )
      console.log(`Card ${card._id} moved to column ${overdueColumnId} (Overdue Trigger)`)
      io.to(card.boardId.toString()).emit('BE_UPDATE_CARD', {
        card
      })
    } else {
      console.warn(`Overdue trigger is enabled, but no column ID is set for board ${board._id}.`)
    }
  }
}
