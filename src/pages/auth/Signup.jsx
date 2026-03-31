import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import "./Auth.css";

function Signup() {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    email: "",
    college_id: ""
  });

  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  }

  // 🔹 STEP 1: SEND OTP
  async function handleSignup(e) {
    e.preventDefault();
    setError("");

    //  VALIDATIONS
    if (!formData.email.endsWith("@xaviers.edu.in")) {
      setError("Only @xaviers.edu.in emails allowed");
      return;
    }

    if (!formData.college_id) {
      setError("Enter your College ID");
      return;
    }

    setLoading(true);

    // 🔹 CHECK college_users TABLE
    const { data: collegeUser, error: checkError } = await supabase
      .from("college_users")
      .select("*")
      .eq("email", formData.email)
      .eq("college_id", formData.college_id)
      .single();

    if (checkError || !collegeUser) {
      setError("Invalid College ID or Email");
      setLoading(false);
      return;
    }
     // 🔹 CHECK IF ALREADY REGISTERED  
    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .or(`email.eq.${formData.email},college_id.eq.${formData.college_id}`)
      .single();

    if (existingUser) {
      setError("This email or College ID is already registered. Please login instead.");
      setLoading(false);
      return;
    }

    // 🔹 SEND OTP
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: formData.email,
      options: {
        shouldCreateUser: true
      }
    });

    if (otpError) {
      setError(otpError.message);
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

    const { data, error: verifyError } = await supabase.auth.verifyOtp({
      email: formData.email,
      token: otp,
      type: "email"
    });

    if (verifyError) {
      setError("Invalid or expired OTP");
      setLoading(false);
      return;
    }

    const user = data.user;

    // 🔹 INSERT INTO users TABLE
    const { error: insertError } = await supabase
      .from("users")
      .insert({
        id: user.id,
        email: formData.email,
        college_id: formData.college_id,
        role: "buyer",            // ✅ default role
        seller_status: "pending"
      });

    if (insertError) {
      console.error(insertError);
    }

    setLoading(false);
    alert("Account created successfully!");
    navigate("/login");
  }

  // 🔹 STEP 1 UI
  if (step === 1) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <h2>Create Account</h2>

          {error && <p className="auth-error">{error}</p>}

          <form onSubmit={handleSignup}>
            <input
              type="email"
              name="email"
              placeholder="College Email"
              value={formData.email}
              onChange={handleChange}
              required
            />

            <input
              type="text"
              name="college_id"
              placeholder="College ID"
              value={formData.college_id}
              onChange={handleChange}
              required
            />

            <button type="submit" disabled={loading}>
              {loading ? "Sending OTP..." : "Send OTP"}
            </button>
          </form>

          <p className="auth-link">
            Already have an account? <Link to="/login">Login</Link>
          </p>
        </div>
      </div>
    );
  }

  // 🔹 STEP 2 UI (OTP)
  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Verify OTP</h2>

        <p>OTP sent to {formData.email}</p>

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
            {loading ? "Verifying..." : "Verify & Create Account"}
          </button>
        </form>

        <p className="auth-link" onClick={() => setStep(1)}>
          ← Back
        </p>
      </div>
    </div>
  );
}

export default Signup;

// import { useState } from "react";
// import { useNavigate, Link } from "react-router-dom";
// import { supabase } from "../../supabaseClient";
// import "./Auth.css";

// function Signup() {
//   const navigate = useNavigate();

//   const [step, setStep] = useState(1); // 1 = form, 2 = otp
//   const [formData, setFormData] = useState({
//     email: "",
//     college_id: "",
//     password: "",
//     confirmPassword: "",
//     role: "buyer"
//   });

//   const [otp, setOtp] = useState("");
//   const [error, setError] = useState("");
//   const [loading, setLoading] = useState(false);

//   function handleChange(e) {
//     setFormData({ ...formData, [e.target.name]: e.target.value });
//   }

//   // 🔹 STEP 1: SEND OTP
//   async function handleSignup(e) {
//     e.preventDefault();
//     setError("");

//     // 🔴 Validation
//     if (!formData.email.endsWith("@xaviers.edu.in")) {
//       setError("Only @xaviers.edu.in emails allowed");
//       return;
//     }

//     if (formData.password !== formData.confirmPassword) {
//       setError("Passwords do not match");
//       return;
//     }

//     if (!formData.college_id) {
//       setError("Enter your College ID");
//       return;
//     }

//     setLoading(true);

//     // 🔹 Check college_users table
//     const { data: collegeUser, error: checkError } = await supabase
//       .from("college_users")
//       .select("*")
//       .eq("email", formData.email)
//       .eq("college_id", formData.college_id)
//       .single();

//     if (checkError || !collegeUser) {
//       setError("Invalid College ID or Email");
//       setLoading(false);
//       return;
//     }

//     // 🔹 Send OTP
//     const { error: otpError } = await supabase.auth.signInWithOtp({
//       email: formData.email,
//       options: {
//         shouldCreateUser: false, // 🔥 IMPORTANT FIX
//       }
//     });

//     if (otpError) {
//       setError(otpError.message);
//       setLoading(false);
//       return;
//     }

//     setLoading(false);
//     setStep(2); // move to OTP screen
//   }

//   // 🔹 STEP 2: VERIFY OTP
//   async function handleVerifyOtp(e) {
//     e.preventDefault();
//     setError("");
//     setLoading(true);

//     const { data, error: verifyError } = await supabase.auth.verifyOtp({
//       email: formData.email,
//       token: otp,
//       type: "email"
//     });

//     if (verifyError) {
//       setError("Invalid or expired OTP");
//       setLoading(false);
//       return;
//     }

//     const user = data.user;

//     // 🔹 Insert into users table AFTER OTP
//     const { error: insertError } = await supabase
//       .from("users")
//       .insert({
//         id: user.id,
//         email: formData.email,
//         college_id: formData.college_id,
//         role: formData.role,
//         seller_status: "pending"
//       });

//     if (insertError) {
//       console.error(insertError);
//     }

//     setLoading(false);
//     alert("Account created successfully!");
//     navigate("/login");
//   }

//   // 🔹 UI STEP 1 (FORM)
//   if (step === 1) {
//     return (
//       <div className="auth-container">
//         <div className="auth-card">
//           <h2>Create Account</h2>

//           {error && <p className="auth-error">{error}</p>}

//           <form onSubmit={handleSignup}>
//             <input
//               type="email"
//               name="email"
//               placeholder="College Email"
//               value={formData.email}
//               onChange={handleChange}
//               required
//             />

//             <input
//               type="text"
//               name="college_id"
//               placeholder="College ID"
//               value={formData.college_id}
//               onChange={handleChange}
//               required
//             />

//             <select name="role" value={formData.role} onChange={handleChange}>
//               <option value="buyer">Buyer</option>
//               <option value="seller">Seller</option>
//             </select>

//             <input
//               type="password"
//               name="password"
//               placeholder="Create Password"
//               value={formData.password}
//               onChange={handleChange}
//               required
//             />

//             <input
//               type="password"
//               name="confirmPassword"
//               placeholder="Confirm Password"
//               value={formData.confirmPassword}
//               onChange={handleChange}
//               required
//             />

//             <button type="submit" disabled={loading}>
//               {loading ? "Sending OTP..." : "Send OTP"}
//             </button>
//           </form>

//           <p className="auth-link">
//             Already have an account? <Link to="/login">Login</Link>
//           </p>
//         </div>
//       </div>
//     );
//   }

//   // 🔹 UI STEP 2 (OTP SCREEN)
//   return (
//     <div className="auth-container">
//       <div className="auth-card">
//         <h2>Verify OTP</h2>

//         <p>OTP sent to {formData.email}</p>

//         {error && <p className="auth-error">{error}</p>}

//         <form onSubmit={handleVerifyOtp}>
//           <input
//             type="text"
//             placeholder="Enter OTP"
//             value={otp}
//             onChange={(e) => setOtp(e.target.value)}
//             maxLength={6}
//             required
//           />

//           <button type="submit" disabled={loading}>
//             {loading ? "Verifying..." : "Verify & Create Account"}
//           </button>
//         </form>

//         <p className="auth-link" onClick={() => setStep(1)}>
//           ← Back
//         </p>
//       </div>
//     </div>
//   );
// }

// export default Signup;