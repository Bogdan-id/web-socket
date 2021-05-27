// @ts-check
const WebSocket = require('ws')

const { v4: uuidv4 } = require('uuid')
const { 
  leaveSocket, 
  handleRoom, 
  broadCastMessage, 
  exchangeData } = require('bogdan-t-type-ws').TypeSocket

const wss = new WebSocket.Server({
  // @ts-ignore
  port: process.env.PORT || process.env.SOCKET_PORT,
  clientTracking: true,
})

const rooms = {}

wss.on('listening', () => {
  console.log('Socket server listening on port:', process.env.SOCKET_PORT)
})

wss.on('connection', (socket, req, client) => {
  const uuid = uuidv4()
  /** @type { leaveSocket } */
  const leave = (room) => {
    if (!rooms[room][uuid]) return
    if (Object.keys(rooms[room]).length === 1) delete rooms[room]
    else delete rooms[room][uuid]
  };
  /** @type { handleRoom } */
  const handleRoom = (room) => {
    if (!rooms[room]) rooms[room] = { sockets: {}, messages: [] }
    if (!rooms[room][uuid]) {
      rooms[room].sockets[uuid] = socket
      socket.send(JSON.stringify({authorize: uuid}))
    }
    if (rooms[room].messages.length){
      socket.send(JSON.stringify(rooms[room].messages))
    }
    console.log(`User with ID: ${uuid} - joined`)
  }
  /** @type { broadCastMessage } */
  const broadCastMessage = (room, user) => {
    rooms[room].messages.push(user)
    const userMsgObject = JSON.stringify(user)

    Object.entries(rooms[room].sockets)
      .forEach(([, sock]) => sock.send(userMsgObject))
  }

  socket.on('message', 
    /** @param { exchangeData } str */
    (str) => {
      const { user, meta, room } = JSON.parse(str)
      switch (true) {
        case meta === 'join': return handleRoom(room)
        case meta === 'leave': return leave(room)
        case !!!meta: return broadCastMessage(room, user)
      }
  })
  
  socket.on('close', () => {
    Object.keys(rooms).forEach(room => leave(room))
  })

  return wss
})

exports.wss = wss