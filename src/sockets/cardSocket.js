// params lấy từ thư viện socket.io
export const MoveCardToDifferentColumnSocket = socket => {
  // listen event khi client emit FE_USER_INVITED_TO_BOARD
  socket.on('FE_USER_MOVE_CARD_TO_DIFFERENT_COLUMN', move => {
    socket.broadcast.emit('BE_USER_MOVE_CARD_TO_DIFFERENT_COLUMN', move)
  })
}
