const Delete = socket => {
  // Listen event khi client emit FE_DELETE_BOARD
  socket.on('FE_DELETE_BOARD', deletedBoard => {
    socket.broadcast.emit('BE_DELETE_BOARD', deletedBoard)
  })
}

const Create = socket => {
  // Listen event khi client emit FE_CREATE_BOARD
  socket.on('FE_CREATE_BOARD', createdBoard => {
    socket.broadcast.emit('BE_CREATE_BOARD', createdBoard)
  })
}

const Update = socket => {
  // Listen event khi client emit FE_UPDATE_BOARD
  socket.on('FE_UPDATE_BOARD', updatedBoard => {
    socket.broadcast.emit('BE_UPDATE_BOARD', updatedBoard)
  })
}

export const boardSocket = {
  Delete,
  Create,
  Update
}
