

import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import './Navbar.css';

function Navbar() {
  const [searchQuery, setSearchQuery] = useState("");
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Get current session on load
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // Listen for login/logout changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  function handleSearch(e) {
    if (e.key === "Enter" && searchQuery.trim()) {
      navigate(`/buyer/products?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  }

  return (
    <nav>
      <div className="nav-left">
        <h2>CampusBazaar</h2>
      </div>

      <div className="search-container">
        <span className="search-icon">🔍</span>
        <input
          type="text"
          placeholder="Search products, shops, or categories..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleSearch}
        />
      </div>

      <div className='nav-actions'>
        <Link to="/buyer/cart">🛒 Cart</Link>
        <Link to="/buyer/become-seller">
          <button>Become a Seller</button>
        </Link>

        {user ? (
          <div
            className="nav-avatar"
            onClick={() => navigate("/buyer")}
            title={user.email}
          >
            {user.email?.[0]?.toUpperCase()}
          </div>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/signup">Sign Up</Link>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;