const mongoose = require('mongoose')

const DateOptionSchema = new mongoose.Schema({
  date: {
    type: String,
    required: true
  },
  time: {
    type: String,
    default: ''
  },
  votes: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  ]
})

const VenueOptionSchema = new mongoose.Schema({
  place: {
    type: String,
    default: ''
  },
  link: {
    type: String,
    default: ''
  },
  votes: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  ]
})

const AttendanceSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  name: {
    type: String,
    default: ''
  },
  email: {
    type: String,
    default: ''
  },
  choice: {
    type: String,
    enum: ['yes', 'no', 'maybe'],
    required: true
  }
})

const PreferenceSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  name: {
    type: String,
    default: ''
  },
  email: {
    type: String,
    default: ''
  },
  text: {
    type: String,
    required: true
  }
})

const EventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    type: {
      type: String,
      default: 'Hangout'
    },
    description: {
      type: String,
      default: '',
      trim: true
    },
    date: {
      type: String,
      default: ''
    },
    dates: [DateOptionSchema],
    venues: [VenueOptionSchema],
    agenda: {
      type: String,
      default: '',
      trim: true
    },
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    votingClosed: {
      type: Boolean,
      default: false
    },
    finalDate: {
      type: String,
      default: null
    },
    finalTime: {
      type: String,
      default: null
    },
    finalVenue: {
      place: {
        type: String,
        default: ''
      },
      link: {
        type: String,
        default: ''
      }
    },
    attendance: [AttendanceSchema],
    preferences: [PreferenceSchema]
  },
  {
    timestamps: true
  }
)

module.exports = mongoose.model('Event', EventSchema)

