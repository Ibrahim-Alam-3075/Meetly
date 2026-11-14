const bcrypt = require('bcryptjs')
const User = require('../models/User')

// @route   POST /api/users/register

const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please provide name, email, and password' })
    }

    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' })
    }

    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    const user = await User.create({
      name,
      email,
      password: hashedPassword
    })

    return res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email
    })
  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
}

module.exports = {
  registerUser
}

