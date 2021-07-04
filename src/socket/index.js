// @ts-check
const WebSocket = require('ws')
const { v4: uuidv4 } = require('uuid')

const wss = new WebSocket.Server({
  // @ts-ignore
  port: process.env.PORT || process.env.SOCKET_PORT,
  clientTracking: true,
})

const rooms = {}

wss.on('listening', () => {
  log('Socket server listening on port:', process.env.SOCKET_PORT)
})

wss.on('connection', (socket, req, client) => {
  const uuid = uuidv4()

  const leave = (room) => {
    if (!rooms[room][uuid]) return
    else delete rooms[room][uuid]
  }

  const createRoom = (room) => {
    if (!rooms[room]) rooms[room] = { sockets: {}, messages: [] }
    if (!rooms[room][uuid]) {
      rooms[room].sockets[uuid] = socket
      socket.send(JSON.stringify({ authorize: uuid, meta: 'authorize' }))
    }
    if (rooms[room].messages.length) {
      socket.send(JSON.stringify({ messages: rooms[room].messages, meta: 'init-messages'}))
    }
    log(`User with ID: ${uuid} - joined`)
  }

  const broadCastMessage = (room, user) => {
    rooms[room].messages.push(user)
    log('user: ', user)
    user.meta = 'broadcast-msg'
    const userMsgObject = JSON.stringify(user)
    Object.entries(rooms[room].sockets).forEach(([, sock]) => sock.send(userMsgObject))
  }

  socket.on('message', 
    (str) => {
      log('message: ', str)
      const msg = JSON.parse(str)
      const { meta, user, room } = msg
      const JOIN = meta === 'join',
        LEAVE = meta === 'leave',
        BROADCAST_MSG = meta === 'broadcast-msg', 
        VIDEO_OFFER = meta === 'video-offer',
        VIDEO_ANSWER = meta === 'video-answer',
        NEW_ICE_CANDIDATE = meta === 'new-ice-candidate'

      switch (true) {
        case JOIN: return createRoom(room)
        case LEAVE: return leave(room)
        case BROADCAST_MSG: return broadCastMessage(room, user)
        case VIDEO_OFFER: return handleVideoOfferMsg(msg)
        case VIDEO_ANSWER: return handleVideoAnswerMsg(msg)
        case NEW_ICE_CANDIDATE: return handleNewICECandidateMsg(msg)
      }

      function handleVideoOfferMsg(o) {
        log('handleVideoOfferMsg', o)
        const remoteUser = rooms[o.room].sockets[o.target]
        o.meta = 'video-offer'
        remoteUser.send(JSON.stringify(o))
      }
      function handleVideoAnswerMsg(o) {
        log('handleVideoAnswerMsg', o)
        const remoteUser = rooms[o.room].sockets[o.target]
        o.meta = 'video-answer'
        remoteUser.send(JSON.stringify(o))
      }
      function handleNewICECandidateMsg(o) {
        log('handleNewICECandidateMsg')
        const remoteUser = rooms[o.room].sockets[o.target]
        o.meta = 'new-ice-candidate'
        remoteUser.send(JSON.stringify(o))
      }
  })
  
  socket.on('close', () => {
    Object.keys(rooms).forEach(room => leave(room))
  })

  return wss
})

function log(...arguments) {
  console.log(arguments)
}

exports.wss = wss