export const voiceRtcSocket = socket => {
  // Khi người dùng tham gia phòng voice
  socket.on('join-voice-room', ({ roomId, userId }) => {
    socket.join(roomId)
    socket.to(roomId).emit('user-joined', { userId })
  })

  // Khi người dùng gửi tín hiệu WebRTC
  socket.on('rtc-signal', ({ roomId, signal, senderId }) => {
    socket.to(roomId).emit('rtc-signal', { signal, senderId })
  })

  // Khi người dùng rời phòng
  socket.on('leave-voice-room', ({ roomId, userId }) => {
    socket.leave(roomId)
    socket.to(roomId).emit('user-left', { userId })
  })
}