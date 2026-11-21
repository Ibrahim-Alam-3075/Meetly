import { createSlice } from "@reduxjs/toolkit";

const eventSlice = createSlice({
  name: "event",
  initialState: { events: [], loading: true },
  reducers: {
    addEvent(state, action) { state.events.push(action.payload); },
    setEvents(state, action) { state.events = action.payload; state.loading = false; },
    updateEvent(state, action) {
      const index = state.events.findIndex((item) => item._id === action.payload._id);
      if (index === -1) { state.events.push(action.payload); }
      else { state.events[index] = { ...action.payload, organizer: state.events[index].organizer }; }
    },
    removeEvent(state, action) {
      state.events = state.events.filter((item) => item._id !== action.payload);
    },
  },
});

export const { addEvent, setEvents, updateEvent, removeEvent } = eventSlice.actions;
export default eventSlice.reducer;
