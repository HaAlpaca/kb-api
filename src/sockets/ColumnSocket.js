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
export const ColumnSocket = {
  Delete,
  Create
}
