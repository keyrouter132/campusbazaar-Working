// import './Auth.css';
// import { Link } from 'react-router-dom';

// function Login() {
//   return (
//     <div className="auth-container">
//       <div className="auth-card">
//         <h2>Login to CampusBazaar</h2>

//         <input type="text" placeholder="Enter your UID" />
//         <input type="password" placeholder="Enter your password" />

//         <button>Login</button>

//         <p className="auth-link">
//           New user? <Link to="/signup">Create an account</Link>
//         </p>
//       </div>
//     </div>
//   );
// }

// export default Login;


import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import "./Auth.css";

function Login() {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // 🔹 STEP 1: SEND OTP
  async function handleSendOtp(e) {
    e.preventDefault();
    setError("");

    if (!email.endsWith("@xaviers.edu.in")) {
      setError("Use your college email");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false // 🔴 IMPORTANT (login only)
      }
    });

    if (error) {
      setError("User not found. Please signup first.");
      setLoading(false);
      return;
    }

    setLoading(false);
    setStep(2);
  }

  // 🔹 STEP 2: VERIFY OTP
  async function handleVerifyOtp(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: "email"
    });

    if (error) {
      setError("Invalid OTP");
      setLoading(false);
      return;
    }

    setLoading(false);
    alert("Login successful!");

    // 🔥 You can route later based on role
    navigate("/");
  }

  // 🔹 STEP 1 UI
  if (step === 1) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <h2>Login</h2>

          {error && <p className="auth-error">{error}</p>}

          <form onSubmit={handleSendOtp}>
            <input
              type="email"
              placeholder="Enter your college email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <button type="submit" disabled={loading}>
              {loading ? "Sending OTP..." : "Send OTP"}
            </button>
          </form>

          <p className="auth-link">
            New user? <Link to="/signup">Create an account</Link>
          </p>
        </div>
      </div>
    );
  }

  // 🔹 STEP 2 UI
  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Verify OTP</h2>

        <p>OTP sent to {email}</p>

        {error && <p className="auth-error">{error}</p>}

        <form onSubmit={handleVerifyOtp}>
          <input
            type="text"
            placeholder="Enter OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            maxLength={6}
            required
          />

          <button type="submit" disabled={loading}>
            {loading ? "Verifying..." : "Login"}
          </button>
        </form>

        <p className="auth-link" onClick={() => setStep(1)}>
          ← Back
        </p>
      </div>
    </div>
  );
}

export default Login;