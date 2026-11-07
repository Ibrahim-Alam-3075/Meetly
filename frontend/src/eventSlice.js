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
        finalVenue: { place: "Campus cafe", link: "" },
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
      },
      {
        id: 3,
        title: "Midterm Study Session",
        type: "Study session",
        date: "2026-10-28",
        description: "Revise the web programming notes.",
        dates: [{ date: "2026-10-28", time: "18:00", votes: 0 }],
        venues: [{ place: "Library", link: "", votes: 0 }],
      },
      {
        id: 4,
        title: "Group Dinner",
        type: "Other",
        date: "2026-09-12",
        description: "Dinner after the project demo.",
        dates: [{ date: "2026-09-12", time: "20:00", votes: 0 }],
        venues: [{ place: "Food street", link: "", votes: 0 }],
      },
    ],
    myVotes: {},
    myAttendance: {},
    myPreferences: {},
  },
  reducers: {
    addEvent(state, action) {
      state.events.push(action.payload);
    },
    vote(state, action) {
      const { eventId, kind, index } = action.payload;
      const key = eventId + "-" + kind + "-" + index;
      const alreadyVoted = state.myVotes[key];

      state.myVotes[key] = !alreadyVoted;

      const event = state.events.find((item) => item.id === eventId);
      if (!event) {
        return;
      }

      const choice = event[kind][index];
      const currentVotes = choice.votes || 0;
      const votes = alreadyVoted ? currentVotes - 1 : currentVotes + 1;
      choice.votes = votes < 0 ? 0 : votes;
    },
    setAttendance(state, action) {
      state.myAttendance[action.payload.eventId] = action.payload.choice;
    },
    savePreference(state, action) {
      state.myPreferences[action.payload.eventId] = action.payload.text;
    },
  },
});

export const { addEvent, vote, setAttendance, savePreference } = eventSlice.actions;
export default eventSlice.reducer;
