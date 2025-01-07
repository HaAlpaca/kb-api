// params lấy từ thư viện socket.io
export const inviteUserToBoardSocket = socket => {
  // listen event khi client emit FE_USER_INVITED_TO_BOARD
  socket.on('FE_USER_INVITED_TO_BOARD', invitation => {
    socket.broadcast.emit('BE_USER_INVITED_TO_BOARD', invitation)
  })
}
