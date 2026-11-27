require('dotenv').config()
const http = require('http')
const express = require('express')
const cors = require('cors')
const { Server } = require('socket.io')
const connectDB = require('./config/db')
const sanitize = require('./middleware/sanitize')

connectDB()

const app = express()
const server = http.createServer(app)

const allowedOrigin = /^http:\/\/(localhost|127\.0\.0\.1):\d+$/

const io = new Server(server, {
  cors: {
    origin: allowedOrigin,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
  }
})

io.on('connection', (socket) => {
  socket.on('join-event', (eventId) => {
    if (eventId) socket.join(String(eventId))
  })
  socket.on('leave-event', (eventId) => {
    if (eventId) socket.leave(String(eventId))
  })
})

app.set('io', io)

app.use(cors({ origin: allowedOrigin }))
app.use(express.json())
app.use(sanitize)

app.get('/', (req, res) => {
  res.send('Meetly Ultra server is running')
})

app.use('/api/users', require('./routes/users'))
app.use('/api/events', require('./routes/events'))

const PORT = process.env.PORT || 5000
server.listen(PORT, () => {
  console.log('Meetly Ultra server running on port ' + PORT)
})
