require('dotenv').config()
const express = require('express')
const cors = require('cors')
const connectDB = require('./config/db')
const sanitize = require('./middleware/sanitize')

connectDB()

const app = express()

app.use(cors({ origin: 'http://localhost:5173' }))
app.use(express.json())
app.use(sanitize)

app.get('/', (req, res) => {
  res.send('Meetly server is running')
})

app.use('/api/users', require('./routes/users'))
app.use('/api/events', require('./routes/events'));

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log('Server running on port ' + PORT)
})
