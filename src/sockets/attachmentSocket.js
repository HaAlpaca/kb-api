const Delete = socket => {
  // Listen event khi client emit FE_DELETE_ATTACHMENT
  socket.on('FE_DELETE_ATTACHMENT', attachment => {
    // Chỉ gửi đến room của boardId
    socket.to(attachment.boardId).emit('BE_DELETE_ATTACHMENT', attachment)
  })
}

const Create = socket => {
  // Listen event khi client emit FE_CREATE_ATTACHMENT
  socket.on('FE_CREATE_ATTACHMENT', attachment => {
    // Chỉ gửi đến room của boardId
    socket.to(attachment.boardId).emit('BE_CREATE_ATTACHMENT', attachment)
  })
}

const Update = socket => {
  // Listen event khi client emit FE_UPDATE_ATTACHMENT
  socket.on('FE_UPDATE_ATTACHMENT', attachment => {
    // Chỉ gửi đến room của boardId
    socket.to(attachment.boardId).emit('BE_UPDATE_ATTACHMENT', attachment)
  })
}

export const attachmentSocket = {
  Delete,
  Create,
  Update
}
