const Delete = socket => {
  // Listen event khi client emit FE_DELETE_BOARD
  socket.on('FE_DELETE_BOARD', board => {
    // Chỉ gửi đến room của boardId
    socket.to(board.boardId).emit('BE_DELETE_BOARD', board)
  })
}

const Create = socket => {
  // Listen event khi client emit FE_CREATE_BOARD
  socket.on('FE_CREATE_BOARD', board => {
    // Chỉ gửi đến room của boardId
    socket.to(board.boardId).emit('BE_CREATE_BOARD', board)
  })
}

const Update = socket => {
  // Listen event khi client emit FE_UPDATE_BOARD
  socket.on('FE_UPDATE_BOARD', board => {
    // Chỉ gửi đến room của boardId
    socket.to(board.boardId).emit('BE_UPDATE_BOARD', board)
  })
}

export const boardSocket = {
  Delete,
  Create,
  Update
}
