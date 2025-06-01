const Delete = socket => {
  // Listen event khi client emit FE_DELETE_LABEL
  socket.on('FE_DELETE_LABEL', label => {
    // Chỉ gửi đến room của boardId
    socket.to(label.boardId).emit('BE_DELETE_LABEL', label)
  })
}

const Create = socket => {
  // Listen event khi client emit FE_CREATE_LABEL
  socket.on('FE_CREATE_LABEL', label => {
    // Chỉ gửi đến room của boardId
    socket.to(label.boardId).emit('BE_CREATE_LABEL', label)
  })
}

const Update = socket => {
  // Listen event khi client emit FE_UPDATE_LABEL
  socket.on('FE_UPDATE_LABEL', label => {
    // Chỉ gửi đến room của boardId
    socket.to(label.boardId).emit('BE_UPDATE_LABEL', label)
  })
}

export const labelSocket = {
  Delete,
  Create,
  Update
}
