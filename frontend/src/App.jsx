import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Routes, Route } from "react-router-dom";
import { setEvents } from "./eventSlice";
import { login } from "./authSlice";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import CreateEvent from "./pages/CreateEvent";
import Login from "./pages/Login";
import Register from "./pages/Register";
import EventDetails from "./pages/EventDetails";
import Profile from "./pages/Profile";
import "./App.css";

function App() {
  const dispatch = useDispatch();
  const currentUser = useSelector((state) => state.auth.currentUser);

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (currentUser && token) {
      fetch('http://localhost:5000/api/events', { headers: { Authorization: 'Bearer ' + token } })
        .then(response => response.json())
        .then(data => {
          if (Array.isArray(data)) {
            dispatch(setEvents(data));
          }
        });
    } else if (!token) {
      dispatch(setEvents([]));
    }
  }, [dispatch, currentUser]);

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (token) {
      fetch('http://localhost:5000/api/users/me', { headers: { Authorization: 'Bearer ' + token } })
        .then(response => response.json())
        .then(data => {
          if (data._id) {
            dispatch(login({ _id: data._id, name: data.name, email: data.email, bio: data.bio || '' }));
          } else {
            localStorage.removeItem('token');
          }
        })
        .catch(() => {
          localStorage.removeItem('token');
        });
    }
  }, [dispatch]);

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/create" element={<CreateEvent />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/event/:id" element={<EventDetails />} />
      </Routes>
    </Layout>
  );
}

export default App;
