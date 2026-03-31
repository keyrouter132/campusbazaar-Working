import { Navigate } from "react-router-dom";

function ProtectedSellerRoute({ user, children }) {
  // user = object from users table
  if (!user) {
    return <Navigate to="/login" />;
  }

  if (user.role !== "seller") {
    return <Navigate to="/" />;
  }

  if (user.seller_status !== "approved") {
    return <Navigate to="/not-approved" />;
  }

  return children;
}

export default ProtectedSellerRoute;
