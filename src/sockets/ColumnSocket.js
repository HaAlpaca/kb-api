// params lấy từ thư viện socket.io
const Delete = socket => {
  // Listen event khi client emit FE_DELETE_COLUMN
  socket.on('FE_DELETE_COLUMN', column => {
    // Chỉ gửi đến room của boardId
    socket.to(column.boardId).emit('BE_DELETE_COLUMN', column)
  })
}

const Create = socket => {
  // Listen event khi client emit FE_CREATE_COLUMN
  socket.on('FE_CREATE_COLUMN', column => {
    // Chỉ gửi đến room của boardId
    socket.to(column.boardId).emit('BE_CREATE_COLUMN', column)
  })
}

const Move = socket => {
  // Listen event khi client emit FE_MOVE_COLUMN
  socket.on('FE_MOVE_COLUMN', column => {
    // Chỉ gửi đến room của boardId
    socket.to(column.boardId).emit('BE_MOVE_COLUMN', column)
  })
}

export const columnSocket = {
  Delete,
  Create,
  Move
}
