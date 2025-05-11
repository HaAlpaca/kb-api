const Delete = socket => {
  // Listen event khi client emit FE_DELETE_LABEL
  socket.on('FE_DELETE_LABEL', deletedLabel => {
    socket.broadcast.emit('BE_DELETE_LABEL', deletedLabel)
  })
}

const Create = socket => {
  // Listen event khi client emit FE_CREATE_LABEL
  socket.on('FE_CREATE_LABEL', createdLabel => {
    socket.broadcast.emit('BE_CREATE_LABEL', createdLabel)
  })
}

const Update = socket => {
  // Listen event khi client emit FE_UPDATE_LABEL
  socket.on('FE_UPDATE_LABEL', updatedLabel => {
    socket.broadcast.emit('BE_UPDATE_LABEL', updatedLabel)
  })
}

export const labelSocket = {
  Delete,
  Create,
  Update
}
