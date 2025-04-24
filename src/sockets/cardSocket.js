// params lấy từ thư viện socket.io
const Delete = socket => {
  // Listen event khi client emit FE_DELETE_CARD
  socket.on('FE_DELETE_CARD', deletedCard => {
    socket.broadcast.emit('BE_DELETE_CARD', deletedCard)
  })
}

const Create = socket => {
  // Listen event khi client emit FE_CREATE_CARD
  socket.on('FE_CREATE_CARD', createdCard => {
    socket.broadcast.emit('BE_CREATE_CARD', createdCard)
  })
}

const Move = socket => {
  // Listen event khi client emit FE_MOVE_CARD
  socket.on('FE_MOVE_CARD', moveCard => {
    socket.broadcast.emit('BE_MOVE_CARD', moveCard)
  })
}

export const cardSocket = {
  Delete,
  Create,
  Move
}
