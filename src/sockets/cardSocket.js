// params lấy từ thư viện socket.io
const Delete = socket => {
  // Listen event khi client emit FE_DELETE_CARD
  socket.on('FE_DELETE_CARD', card => {
    // Chỉ gửi đến room của boardId
    socket.to(card.boardId).emit('BE_DELETE_CARD', card)
  })
}

const Create = socket => {
  // Listen event khi client emit FE_CREATE_CARD
  socket.on('FE_CREATE_CARD', card => {
    // Chỉ gửi đến room của boardId
    socket.to(card.boardId).emit('BE_CREATE_CARD', card)
  })
}

const Move = socket => {
  // Listen event khi client emit FE_MOVE_CARD
  socket.on('FE_MOVE_CARD', card => {
    // Chỉ gửi đến room của boardId
    socket.to(card.boardId).emit('BE_MOVE_CARD', card)
  })
}

const Update = socket => {
  // Listen event khi client emit FE_UPDATE_CARD
  socket.on('FE_UPDATE_CARD', card => {
    // Chỉ gửi đến room của boardId
    socket.to(card.boardId).emit('BE_UPDATE_CARD', card)
  })
}

export const cardSocket = {
  Delete,
  Create,
  Move,
  Update
}
