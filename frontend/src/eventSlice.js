import { createSlice } from "@reduxjs/toolkit";

const eventSlice = createSlice({
  name: "event",
  initialState: {
    events: [
      {
        id: 1,
        title: "Sunday Hangout",
        type: "Hangout",
        date: "2026-11-15",
        description: "Lunch after class.",
        dates: [
          { date: "2026-11-15", time: "13:00", votes: 0 },
          { date: "2026-11-16", time: "18:00", votes: 0 },
        ],
        venues: [
          { place: "Campus cafe", link: "", votes: 0 },
          { place: "", link: "https://meet.google.com", votes: 0 },
        ],
        organizerEmail: "test@meetly.com",
        votingClosed: false,
      },
      {
        id: 2,
        title: "Project Meeting",
        type: "Meeting",
        date: "2026-11-20",
        description: "Decide the final features for Meetly.",
        dates: [{ date: "2026-11-20", time: "16:00", votes: 0 }],
        venues: [{ place: "", link: "https://meet.google.com", votes: 0 }],
        agenda: "Discussion",
        organizerEmail: "test@meetly.com",
        votingClosed: false,
      },
      {
        id: 3,
        title: "Midterm Study Session",
        type: "Study session",
        date: "2026-10-28",
        description: "Revise the web programming notes.",
        dates: [{ date: "2026-10-28", time: "18:00", votes: 0 }],
        venues: [{ place: "Library", link: "", votes: 0 }],
        organizerEmail: "test@meetly.com",
        votingClosed: false,
      },
      {
        id: 4,
        title: "Group Dinner",
        type: "Other",
        date: "2026-09-12",
        description: "Dinner after the project demo.",
        dates: [{ date: "2026-09-12", time: "20:00", votes: 0 }],
        venues: [{ place: "Food street", link: "", votes: 0 }],
        organizerEmail: "test@meetly.com",
        votingClosed: false,
      },
    ],
    myVotes: {},
    attendance: {},
    preferences: {},
  },
  reducers: {
    addEvent(state, action) {
      state.events.push(action.payload);
    },
    vote(state, action) {
      const { eventId, kind, index, email } = action.payload;
      const event = state.events.find((item) => item.id === eventId);
      if (!event || event.votingClosed) {
        return;
      }

      const key = email + "-" + eventId + "-" + kind + "-" + index;
      const alreadyVoted = state.myVotes[key];
      state.myVotes[key] = !alreadyVoted;

      const choice = event[kind][index];
      const currentVotes = choice.votes || 0;
      const votes = alreadyVoted ? currentVotes - 1 : currentVotes + 1;
      choice.votes = votes < 0 ? 0 : votes;
    },
    setAttendance(state, action) {
      const { eventId, email, name, choice } = action.payload;
      if (!state.attendance[eventId]) {
        state.attendance[eventId] = [];
      }

      const list = state.attendance[eventId];
      const existing = list.find((item) => item.email === email);
      if (existing) {
        existing.choice = choice;
      } else {
        list.push({ email, name, choice });
      }
    },
    savePreference(state, action) {
      const { eventId, email, name, text } = action.payload;
      if (!state.preferences[eventId]) {
        state.preferences[eventId] = [];
      }

      const list = state.preferences[eventId];
      const existing = list.find((item) => item.email === email);
      if (existing) {
        existing.text = text;
      } else {
        list.push({ email, name, text });
      }
    },
    finalizeEvent(state, action) {
      const { eventId, dateIndex, venueIndex } = action.payload;
      const event = state.events.find((item) => item.id === eventId);
      if (!event) {
        return;
      }

      const dateChoice = event.dates[dateIndex];
      const venueChoice = event.venues[venueIndex];
      event.votingClosed = true;
      event.date = dateChoice.date;
      event.finalDate = dateChoice.date;
      event.finalTime = dateChoice.time;
      event.finalVenue = { place: venueChoice.place, link: venueChoice.link };
    },
  },
});

export const { addEvent, vote, setAttendance, savePreference, finalizeEvent } = eventSlice.actions;
export default eventSlice.reducer;
