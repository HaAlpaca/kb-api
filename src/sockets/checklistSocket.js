// params lấy từ thư viện socket.io
const Delete = socket => {
  // Listen event khi client emit FE_DELETE_CARD
  socket.on('FE_DELETE_CHECKLIST', checklist => {
    // Chỉ gửi đến room của boardId
    socket.to(checklist.boardId).emit('BE_DELETE_CHECKLIST', checklist)
  })
}

const Create = socket => {
  // Listen event khi client emit FE_CREATE_CARD
  socket.on('FE_CREATE_CHECKLIST', checklist => {
    // Chỉ gửi đến room của boardId
    socket.to(checklist.boardId).emit('BE_CREATE_CHECKLIST', checklist)
  })
}

// const Move = socket => {
//   // Listen event khi client emit FE_MOVE_CARD
//   socket.on('FE_MOVE_CARD', card => {
//     // Chỉ gửi đến room của boardId
//     socket.to(card.boardId).emit('BE_MOVE_CARD', card)
//   })
// }

const Update = socket => {
  // Listen event khi client emit FE_UPDATE_CARD
  socket.on('FE_UPDATE_CHECKLIST', checklist => {
    // Chỉ gửi đến room của boardId
    socket.to(checklist.boardId).emit('BE_UPDATE_CHECKLIST', checklist)
  })
}

export const checklistSocket = {
  Delete,
  Create,
  //   Move,
  Update
}
