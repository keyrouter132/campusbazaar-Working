

import { useState, useEffect } from 'react';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import { supabase } from "../../supabaseClient";


const NAV_ITEMS = [
  { path: "/seller/dashboard",  label: "Dashboard"    },
  { path: "/seller/shops",      label: "My Shops"     },   // ← NEW
  { path: "/seller/products",   label: "My Products"  },
  { path: "/seller/add-product",label: "Add Product"  },
  { path: "/seller/orders",     label: "Orders"       },
  { path: "/seller/analytics",  label: "Analytics"    }
];
export default function SellerLayout() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const [profileOpen,      setProfileOpen]      = useState(false);
  const [profile,          setProfile]          = useState(null);
  const [collapsed,        setCollapsed]        = useState(false);

  useEffect(() => { fetchProfile(); }, []);

  async function fetchProfile() {
    try {
        // 1. Get the authenticated user ID
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // 2. Fetch the basic user record to get the college_id
        const { data: userData, error: userError } = await supabase
        .from("users")
        .select("college_id, role, seller_status")
        .eq("id", user.id)
        .single();

        if (userError || !userData) {
        setProfile({ email: user.email });
        return;
        }

        // 3. Fetch the detailed profile from college_users using college_id
        const { data: collegeData, error: collegeError } = await supabase
        .from("college_users")
        .select("name, class_or_designation, department")
        .eq("college_id", userData.college_id)
        .single();

        if (collegeError) {
        console.error("Profile detail fetch error:", collegeError);
        }

        // 4. Combine everything (Auth Email + User Role + College Details)
        setProfile({
        ...userData,
        ...collegeData,
        email: user.email 
        });

    } catch (err) {
        console.error("System error in Seller Profile fetch:", err);
    }
    }

  async function handleSignOut() {
    await supabase.auth.signOut();
    navigate("/login");
  }

  const avatarLetter = profile?.name
    ? profile.name.charAt(0).toUpperCase()
    : profile?.email
      ? profile.email.charAt(0).toUpperCase()
      : "?";

  const currentPage = NAV_ITEMS.find(n => location.pathname === n.path)?.label || "Dashboard";

  /* ─── inline styles — zero CSS-class conflicts possible ─── */
  const SB_W   = collapsed ? 56  : 210;
  const DARK   = "#3D2B2B";
  const ACCENT = "#6b4e4e";
  const OFF_W  = "#faf6f4";

  const s = {
    layout:   { display:"flex", minHeight:"100vh", fontFamily:"'DM Sans','Segoe UI',sans-serif", background:"#f2ecec" },

    /* sidebar wrapper — fully dark, flex column */
    sidebar:  {
      width: SB_W, background: DARK,
      display:"flex", flexDirection:"column",
      position:"fixed", top:0, left:0, bottom:0,
      zIndex:100, overflow:"hidden",
      transition:"width 0.22s ease", boxSizing:"border-box",
    },

    /* brand */
    brand:    {
      padding: collapsed ? "22px 0 18px" : "22px 20px 18px",
      borderBottom:"1px solid rgba(255,255,255,0.07)",
      flexShrink:0, cursor:"pointer", userSelect:"none",
      background: DARK,
      display:"flex", flexDirection:"column",
      alignItems: collapsed ? "center" : "flex-start",
    },
    brandTitle: {
      fontSize:15, fontWeight:700, color:"#fff",
      whiteSpace:"nowrap", overflow:"hidden",
      opacity: collapsed ? 0 : 1, transition:"opacity 0.15s",
      letterSpacing:"-0.2px",
    },
    brandSub: {
      fontSize:11, color:"rgba(255,255,255,0.38)", marginTop:3,
      whiteSpace:"nowrap", overflow:"hidden",
      opacity: collapsed ? 0 : 1, transition:"opacity 0.15s",
    },
    brandDot: {   /* shown when collapsed so brand area isn't empty */
      width:8, height:8, borderRadius:"50%",
      background:"rgba(255,255,255,0.40)",
      display: collapsed ? "block" : "none",
    },

    /* nav — top-aligned, no flex:1 */
    nav: {
      padding:"14px 8px 0", display:"flex", flexDirection:"column",
      gap:1, flexShrink:0, background: DARK,
    },

    navBtn: (active) => ({
      display:"flex", alignItems:"center",
      gap:9, padding:"9px 10px", borderRadius:7,
      fontSize:13, fontWeight: active ? 600 : 500,
      color: active ? "#fff" : "rgba(255,255,255,0.62)",
      cursor:"pointer",
      background: active ? "rgba(255,255,255,0.13)" : "transparent",
      border:"none", width:"100%", textAlign:"left",
      fontFamily:"inherit", whiteSpace:"nowrap",
      transition:"background 0.15s, color 0.15s",
      boxSizing:"border-box",
    }),

    dot: (active) => ({
      width:6, height:6, borderRadius:"50%", flexShrink:0,
      background: active ? "rgba(255,255,255,0.80)" : "rgba(255,255,255,0.28)",
      transition:"background 0.15s",
    }),

    navLabel: { overflow:"hidden", opacity: collapsed ? 0 : 1, transition:"opacity 0.15s" },

    navDivider: { border:"none", borderTop:"1px solid rgba(255,255,255,0.07)", margin:"8px 0" },

    /* spacer fills remaining height, keeping collapse at bottom */
    spacer: { flex:1, background: DARK },

    footer: {
      padding:"10px 8px 16px",
      borderTop:"1px solid rgba(255,255,255,0.07)",
      background: DARK, flexShrink:0,
    },
    collapseBtn: {
      display:"flex", alignItems:"center", justifyContent:"center",
      padding:"8px", borderRadius:7, cursor:"pointer",
      color:"rgba(255,255,255,0.35)", background:"transparent",
      border:"none", width:"100%", fontFamily:"inherit",
      transition:"background 0.15s, color 0.15s",
    },

    /* main */
    main:    { flex:1, marginLeft:SB_W, transition:"margin-left 0.22s ease", display:"flex", flexDirection:"column", minHeight:"100vh" },

    topbar:  {
      background: OFF_W, borderBottom:"1px solid #ede4e0",
      padding:"0 32px", height:60,
      display:"flex", alignItems:"center", justifyContent:"space-between",
      position:"sticky", top:0, zIndex:50,
    },
    topTitle:   { fontSize:16, fontWeight:700, color:"#4e1c1c" },
    topRight:   { display:"flex", alignItems:"center", gap:12 },
    topWelcome: { fontSize:13, color:"#b09090" },
    topAvatar:  {
      width:36, height:36, borderRadius:"50%",
      background: ACCENT, color:"#fff",
      display:"flex", alignItems:"center", justifyContent:"center",
      fontWeight:700, fontSize:14, cursor:"pointer",
      border:"2px solid #e8dede", userSelect:"none",
      transition:"border-color 0.15s, transform 0.15s",
    },

    content: { flex:1, padding:"32px 36px" },

    /* overlay */
    overlay: {
      position:"fixed", inset:0, background:"rgba(0,0,0,0.25)",
      zIndex:200, opacity: profileOpen ? 1 : 0,
      pointerEvents: profileOpen ? "all" : "none",
      transition:"opacity 0.2s",
    },

    /* slide-out */
    slideout: {
      position:"fixed", top:0, right:0, bottom:0, width:300,
      background: OFF_W, zIndex:201,
      transform: profileOpen ? "translateX(0)" : "translateX(100%)",
      transition:"transform 0.25s ease",
      display:"flex", flexDirection:"column",
      boxShadow:"-4px 0 24px rgba(0,0,0,0.10)",
    },
    panelHdr: {
      padding:"20px 20px 16px", borderBottom:"1px solid #ede4e0",
      display:"flex", justifyContent:"space-between", alignItems:"center",
    },
    panelTitle:  { fontWeight:700, fontSize:15, color:"#4e1c1c" },
    panelClose:  { background:"none", border:"none", fontSize:22, cursor:"pointer", color:"#bbb", lineHeight:1, padding:"0 2px" },
    panelBody:   { flex:1, padding:"28px 20px 20px", overflowY:"auto" },
    pAvatar:     {
      width:68, height:68, borderRadius:"50%", background: ACCENT, color:"#fff",
      display:"flex", alignItems:"center", justifyContent:"center",
      fontWeight:700, fontSize:26, margin:"0 auto 14px", userSelect:"none",
    },
    pName:       { textAlign:"center", fontWeight:700, fontSize:17, color:"#333", marginBottom:4 },
    pEmail:      { textAlign:"center", fontSize:12.5, color:"#888", marginBottom:14, wordBreak:"break-all" },
    pBadgeWrap:  { display:"flex", justifyContent:"center", marginBottom:24 },
    pBadge:      { background:"#f0e8e8", color: ACCENT, fontSize:12, fontWeight:600, padding:"4px 16px", borderRadius:20, letterSpacing:"0.5px", textTransform:"uppercase" },
    infoRow:     { display:"flex", justifyContent:"space-between", alignItems:"center", padding:"12px 0", borderBottom:"1px solid #ede8e4", fontSize:13.5 },
    infoKey:     { color:"#aaa" },
    infoVal:     { color:"#333", fontWeight:500, textAlign:"right", maxWidth:170, wordBreak:"break-all" },
    panelFtr:    { padding:"16px 20px 20px", borderTop:"1px solid #ede4e0" },
    signoutBtn:  {
      width:"100%", padding:12, background:"none",
      border:"1.5px solid #6b4e4e", color:"#6b4e4e",
      borderRadius:8, cursor:"pointer", fontWeight:600,
      fontSize:14, fontFamily:"inherit",
      transition:"background 0.15s, color 0.15s",
    },
  };

  return (
    <div style={s.layout}>

      {/* ── Sidebar ── */}
      <aside style={s.sidebar}>

        {/* Brand */}
        <div style={s.brand} onClick={() => setCollapsed(!collapsed)}>
          <div style={s.brandDot} />
          <div style={s.brandTitle}>CampusBazaar</div>
          <div style={s.brandSub}>Seller Panel</div>
        </div>

        {/* Nav — top-aligned */}
        <nav style={s.nav}>
          {NAV_ITEMS.map(item => {
            const active = location.pathname === item.path;
            return (
              <button
                key={item.path}
                style={s.navBtn(active)}
                onClick={() => navigate(item.path)}
                title={collapsed ? item.label : undefined}
                onMouseEnter={e => { if (!active) { e.currentTarget.style.background="rgba(255,255,255,0.07)"; e.currentTarget.style.color="rgba(255,255,255,0.90)"; }}}
                onMouseLeave={e => { if (!active) { e.currentTarget.style.background="transparent";              e.currentTarget.style.color="rgba(255,255,255,0.62)"; }}}
              >
                <span style={s.dot(active)} />
                <span style={s.navLabel}>{item.label}</span>
              </button>
            );
          })}

          <hr style={s.navDivider} />

          <button
            style={s.navBtn(false)}
            onClick={() => navigate("/shop")}
            title={collapsed ? "View Shop" : undefined}
            onMouseEnter={e => { e.currentTarget.style.background="rgba(255,255,255,0.07)"; e.currentTarget.style.color="rgba(255,255,255,0.90)"; }}
            onMouseLeave={e => { e.currentTarget.style.background="transparent";              e.currentTarget.style.color="rgba(255,255,255,0.62)"; }}
          >
            <span style={s.dot(false)} />
            <span style={s.navLabel}>View Shop ↗</span>
          </button>
          
        </nav>

        {/* Spacer — fills remaining height, keeps collapse at bottom */}
        <div style={s.spacer} />

        {/* Collapse btn */}
        <div style={s.footer}>
          <button
            style={s.collapseBtn}
            title={collapsed ? "Expand" : "Collapse"}
            onClick={() => setCollapsed(!collapsed)}
            onMouseEnter={e => { e.currentTarget.style.background="rgba(255,255,255,0.07)"; e.currentTarget.style.color="rgba(255,255,255,0.65)"; }}
            onMouseLeave={e => { e.currentTarget.style.background="transparent";              e.currentTarget.style.color="rgba(255,255,255,0.35)"; }}
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" d={collapsed ? "M9 5l7 7-7 7" : "M15 19l-7-7 7-7"} />
            </svg>
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <main style={s.main}>
        <header style={s.topbar}>
          <span style={s.topTitle}>{currentPage}</span>
          <div style={s.topRight}>
            <span style={s.topWelcome}>Welcome back</span>
            <div
              style={s.topAvatar}
              onClick={() => setProfileOpen(true)}
              title="My Profile"
              onMouseEnter={e => { e.currentTarget.style.borderColor="#6b4e4e"; e.currentTarget.style.transform="scale(1.05)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor="#e8dede"; e.currentTarget.style.transform="scale(1)"; }}
            >
              {avatarLetter}
            </div>
          </div>
        </header>
        <section style={s.content}>
          <Outlet />
        </section>
      </main>

      {/* ── Overlay ── */}
      <div style={s.overlay} onClick={() => setProfileOpen(false)} />

      {/* ── Profile Slide-out ── */}
      <div style={s.slideout}>
        <div style={s.panelHdr}>
          <span style={s.panelTitle}>My Profile</span>
          <button style={s.panelClose} onClick={() => setProfileOpen(false)}>×</button>
        </div>

        <div style={s.panelBody}>
          <div style={s.pAvatar}>{avatarLetter}</div>
          <div style={s.pName}>{profile?.name || "Seller"}</div>
          <div style={s.pEmail}>{profile?.email || ""}</div>
          <div style={s.pBadgeWrap}><span style={s.pBadge}>Seller</span></div>

          {[
            ["Name",        profile?.name],
            ["College ID",  profile?.college_id],
            ["Designation", profile?.class_or_designation],
            ["Email",       profile?.email],
            ["Role",        "Seller"],
          ].map(([key, val]) => val ? (
            <div style={{ ...s.infoRow, ...(key === "Role" ? { borderBottom:"none" } : {}) }} key={key}>
              <span style={s.infoKey}>{key}</span>
              <span style={s.infoVal}>{val}</span>
            </div>
          ) : null)}
        </div>

        <div style={s.panelFtr}>
          <button
            style={s.signoutBtn}
            onClick={handleSignOut}
            onMouseEnter={e => { e.currentTarget.style.background="#6b4e4e"; e.currentTarget.style.color="#fff"; }}
            onMouseLeave={e => { e.currentTarget.style.background="none";    e.currentTarget.style.color="#6b4e4e"; }}
          >
            Sign out
          </button>
        </div>
      </div>

    </div>
  );
}