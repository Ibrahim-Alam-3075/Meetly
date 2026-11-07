import { createSlice } from "@reduxjs/toolkit";

const eventSlice = createSlice({
  name: "event",
  initialState: {
    events: [],
    loading: true,
    myVotes: {},
    attendance: {},
    preferences: {},
  },
  reducers: {
    addEvent(state, action) {
      state.events.push(action.payload);
    },
    setEvents(state, action) {
      state.events = action.payload;
      state.loading = false;
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

export const { addEvent, setEvents, vote, setAttendance, savePreference, finalizeEvent } = eventSlice.actions;
export default eventSlice.reducer;
