import { NavLink } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';

export function useAdminProfile() {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("users")
        .select("college_id, email, role, seller_status")
        .eq("id", user.id)
        .single();

      if (error || !data) return;

      const { data: profileData, error: profileError } = await supabase
        .from("college_users")
        .select("name, class_or_designation, department")
        .eq("college_id", data.college_id)
        .single();

      if (profileError) console.error(profileError);

      setProfile({ ...data, ...profileData, email: user.email });
    };

    fetchProfile();
  }, []);

  return profile;
}

export function AdminLayout({ children, pageTitle = "Admin Panel" }) {
  const [panelOpen, setPanelOpen] = useState(false);
  const profile = useAdminProfile();

  return (
    <div className="admin-container">

      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-brand">
          <h3>CampusBazaar</h3>
          <p>Admin Panel</p>
        </div>

        <div className="sidebar-nav">
          <NavLink
            to="/admin"
            end
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
          >
            <span className="nav-dot" />
            Dashboard
          </NavLink>

          <NavLink
            to="/admin/approvals"
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
          >
            <span className="nav-dot" />
            Seller Approvals
          </NavLink>

          <NavLink
            to="/admin/orders"
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
          >
            <span className="nav-dot" />
            Orders
          </NavLink>

          {/* Divider before external link */}
          <div className="nav-divider" />

          {/*
            UPDATE THIS: change "/shop" to whatever your actual shop route is.
            e.g. "/home", "/marketplace", "/browse" etc.
            The admin is already logged in so they'll see the shop as a normal user.
          */}
          <NavLink
            to="/shop"
            className="nav-item nav-item-external"
          >
            <span className="nav-dot" />
            View Shop ↗
          </NavLink>
        </div>
      </div>

      {/* Right Column */}
      <div className="right-col">

        {/* Topbar */}
        <div className="dash-topbar">
          <span className="dash-topbar-title">{pageTitle}</span>
          <div className="dash-topbar-right">
            <span>Welcome back</span>
            <div
              className="dash-avatar"
              onClick={() => setPanelOpen(true)}
              title={profile?.email}
            >
              {profile?.name?.charAt(0).toUpperCase() ?? 'A'}
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div className="main-content">
          {children}
        </div>
      </div>

      {/* Overlay */}
      {panelOpen && (
        <div className="panel-overlay" onClick={() => setPanelOpen(false)} />
      )}

      {/* Slide Panel */}
      <div className={`slide-panel${panelOpen ? ' open' : ''}`}>
        <div className="panel-header">
          <p>My Profile</p>
          <button className="panel-close-btn" onClick={() => setPanelOpen(false)}>✕</button>
        </div>

        <div className="panel-body">
          <div className="panel-avatar">
            {profile?.name?.charAt(0).toUpperCase() ?? 'A'}
          </div>
          <p className="panel-name">{profile?.name ?? 'Admin'}</p>
          <p className="panel-role">{profile?.email ?? ''}</p>
          <div className="panel-badge-wrap">
            <span className="panel-badge">Admin</span>
          </div>

          {[
            ['Name',        profile?.name],
            ['College ID',  profile?.college_id],
            ['Designation', profile?.class_or_designation],
            ['Email',       profile?.email],
            ['Role',        'Admin'],
          ].map(([key, val]) => (
            <div className="info-row" key={key}>
              <span className="info-key">{key}</span>
              <span className="info-val">{val ?? 'N/A'}</span>
            </div>
          ))}
        </div>

        <div className="panel-footer">
          <button
            className="signout-btn"
            onClick={async () => {
              await supabase.auth.signOut();
              window.location.href = '/login';
            }}
          >
            Sign out
          </button>
        </div>
      </div>

    </div>
  );
}
