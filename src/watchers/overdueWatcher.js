/* eslint-disable no-console */
import { GET_DB } from '~/config/mongodb'
import { ObjectId } from 'mongodb'
import { getSocketInstance } from '~/sockets/socketInstance'

// Bắt đầu watcher kiểm tra overdue
export const START_OVERDUE_WATCHER = () => {
  console.log('Overdue Checker: Started.')

  setInterval(() => {
    checkOverdueCards().catch(error => console.error('Error while checking overdue cards:', error))
  }, 60 * 1000) // Kiểm tra mỗi 1 phút
}

// Hàm kiểm tra và xử lý các card bị overdue
async function checkOverdueCards() {
  const db = GET_DB()
  const cardsCollection = db.collection('cards')
  const boardsCollection = db.collection('boards')
  const now = new Date()

  // Tìm tất cả các card có dueDate < hiện tại và chưa hoàn thành
  const overdueCards = await cardsCollection
    .find({
      dueDate: { $lt: now },
      isComplete: { $ne: true }
    })
    .toArray()

  for (const card of overdueCards) {
    const board = await getBoardById(boardsCollection, card.boardId)
    if (!board) continue

    await handleOverdueTrigger(cardsCollection, board, card)
  }
}

// Lấy thông tin board theo ID
async function getBoardById(boardsCollection, boardId) {
  const board = await boardsCollection.findOne({ _id: new ObjectId(boardId) })
  if (!board) {
    console.warn(`Board with ID ${boardId} not found.`)
  }
  return board
}

// Xử lý trigger khi card bị overdue
async function handleOverdueTrigger(cardsCollection, board, card) {
  const io = getSocketInstance()
  const now = new Date()

  if (card.dueDate && new Date(card.dueDate) < now && board.isOverdueCardTrigger && card.isComplete !== true) {
    const overdueColumnId = board.overdueCardColumnId
    if (overdueColumnId && card.columnId.toString() !== overdueColumnId.toString()) {
      const db = GET_DB()

      // Xóa khỏi column cũ
      await db
        .collection('columns')
        .updateOne({ _id: new ObjectId(card.columnId) }, { $pull: { cardOrderIds: new ObjectId(card._id) } })

      // Thêm vào column overdue
      await db
        .collection('columns')
        .updateOne({ _id: new ObjectId(overdueColumnId) }, { $push: { cardOrderIds: new ObjectId(card._id) } })

      // Cập nhật columnId của card
      await cardsCollection.updateOne(
        { _id: new ObjectId(card._id) },
        { $set: { columnId: new ObjectId(overdueColumnId) } }
      )

      console.log(`Card ${card._id} moved to column ${overdueColumnId} (Overdue Trigger)`)

      io.to(card.boardId.toString()).emit('BE_UPDATE_CARD', { card })
    } else {
      console.warn(`Overdue trigger is enabled, but no column ID is set for board ${board._id}.`)
    }
  }
}
