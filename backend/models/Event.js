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
  endTime: {
    type: String,
    default: ''
  },
  votes: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  ],
  maybeVotes: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  ],
  suggestedBy: {
    type: String,
    default: ''
  }
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
  mode: {
    type: String,
    enum: ['In-Person', 'Online', 'Hybrid'],
    default: 'In-Person'
  },
  estimatedCost: {
    type: String,
    default: ''
  },
  votes: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  ],
  maybeVotes: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  ],
  suggestedBy: {
    type: String,
    default: ''
  }
})

const CustomPollOptionSchema = new mongoose.Schema({
  label: {
    type: String,
    required: true,
    trim: true
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
  },
  waitlisted: {
    type: Boolean,
    default: false
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

const CommentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    default: ''
  },
  avatarColor: {
    type: String,
    default: '#6366f1'
  },
  text: {
    type: String,
    required: true,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
})

const TaskSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
    trim: true
  },
  assigneeName: {
    type: String,
    default: '',
    trim: true
  },
  completed: {
    type: Boolean,
    default: false
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
})

const ExpenseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  paidBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  paidByName: {
    type: String,
    default: '',
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
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
    coverTheme: {
      type: String,
      default: 'indigo'
    },
    icon: {
      type: String,
      default: ''
    },
    maxAttendees: {
      type: Number,
      default: 0
    },
    pollSettings: {
      votingMode: {
        type: String,
        enum: ['multiple', 'single'],
        default: 'multiple'
      },
      allowSuggestions: {
        type: Boolean,
        default: true
      },
      anonymousVoting: {
        type: Boolean,
        default: false
      },
      votingDeadline: {
        type: String,
        default: ''
      },
      autoFinalize: {
        type: Boolean,
        default: false
      }
    },
    date: {
      type: String,
      default: ''
    },
    dates: [DateOptionSchema],
    venues: [VenueOptionSchema],
    customPoll: {
      question: {
        type: String,
        default: '',
        trim: true
      },
      options: [CustomPollOptionSchema]
    },
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
    preferences: [PreferenceSchema],
    comments: [CommentSchema],
    tasks: [TaskSchema],
    expenses: [ExpenseSchema]
  },
  {
    timestamps: true
  }
)

module.exports = mongoose.model('Event', EventSchema)
