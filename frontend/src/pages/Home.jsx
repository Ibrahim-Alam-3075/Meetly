import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import "./Home.css";


function Home() {
const currentUser = useSelector((state) => state.auth.currentUser);
const buttonStyle = { display: "inline-block", backgroundColor: "steelblue", color: "white", padding: "10px 20px", borderRadius: "6px", textDecoration: "none" };

  return (
    <div className="app-container">
      <h1>Plan Group Events without Chaos</h1><br></br>
      <h2>Meetings, Hangouts, or Study Sessions, all in Meetly!</h2>
<br></br><br></br>
      <h2>How it works:</h2>
      <div className = "steps">
        <div className = "step">
          <h3>1. Create an Event</h3>
          <p>Set up your event with a title, description, and agenda.</p> </div>

          <div className = "step">
          <h3>2. Share the Link</h3>
          <p>Send it to your group chat, on any app.</p> </div>

          <div className = "step">
          <h3>3. Everyone votes, majority wins!</h3>
          <p>No chaos. No delays.</p> </div>

      </div>



      {(!currentUser) && (
        <div>
          <Link to="/register" style={buttonStyle}>Get Started! Register Now!</Link></div>
      )} 

      {(currentUser) && (
        <div><p>Welcome back, {currentUser.name}!</p>
          <Link to="/dashboard" style={buttonStyle}>Go to Dashboard</Link></div>
      )}

      

    </div>
  );
}

export default Home;
