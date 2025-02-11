// params lấy từ thư viện socket.io
const Delete = socket => {
  // listen event khi client emit FE_USER_INVITED_TO_BOARD
  socket.on('FE_DELETE_COLUMN', deletedColumn => {
    socket.broadcast.emit('BE_DELETE_COLUMN', deletedColumn)
  })
}
// params lấy từ thư viện socket.io
const Create = socket => {
  // listen event khi client emit FE_USER_INVITED_TO_BOARD
  socket.on('FE_CREATE_COLUMN', createdColumn => {
    socket.broadcast.emit('BE_CREATE_COLUMN', createdColumn)
  })
}
const Move = socket => {
  socket.on('FE_MOVE_COLUMN', moveColumn => {
    socket.broadcast.emit('BE_MOVE_COLUMN', moveColumn)
  })
}
export const columnSocket = {
  Delete,
  Create,
  Move
}
