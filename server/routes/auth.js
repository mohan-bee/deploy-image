const express = require('express')
const { OAuth2Client } = require('google-auth-library')
const User = require('../models/User')
const jwt = require('jsonwebtoken')
const auth = require('../middleware/auth')

const router = express.Router()
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)

router.post('/google', async (req, res) => {
  const { token } = req.body

  try {

    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    })

    const payload = ticket.getPayload()

    let user = await User.findOne({ email: payload.email })

    if (!user) {
      user = new User({
        username: payload.name,
        email: payload.email,
        googleId: payload.sub,
        profilePicture: payload.picture,
      })
      await user.save()
    }

    const myToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '1d',
    })

    res.status(200).json({
      message: 'Login successful',
      user,
      token: myToken
    })

  } catch (error) {
    console.error('Error verifying Google token:', error)
    res.status(401).json({ message: 'Invalid token' })
  }
})

router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user)
    if (!user) return res.status(404).json({ message: 'User not found' })
    res.json(user)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router 