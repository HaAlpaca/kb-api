const Delete = socket => {
  // Listen event khi client emit FE_DELETE_ATTACHMENT
  socket.on('FE_DELETE_ATTACHMENT', deletedAttachment => {
    socket.broadcast.emit('BE_DELETE_ATTACHMENT', deletedAttachment)
  })
}

const Create = socket => {
  // Listen event khi client emit FE_CREATE_ATTACHMENT
  socket.on('FE_CREATE_ATTACHMENT', createdAttachment => {
    socket.broadcast.emit('BE_CREATE_ATTACHMENT', createdAttachment)
  })
}

const Update = socket => {
  // Listen event khi client emit FE_UPDATE_ATTACHMENT
  socket.on('FE_UPDATE_ATTACHMENT', updatedAttachment => {
    socket.broadcast.emit('BE_UPDATE_ATTACHMENT', updatedAttachment)
  })
}

export const attachmentSocket = {
  Delete,
  Create,
  Update
}