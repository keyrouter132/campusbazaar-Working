import { Routes, Route } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient'; // adjust path if needed

import Home from './pages/Home.jsx';

//Auth
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';

//buyer
import BecomeSeller from './pages/buyer/BecomeSeller';
import Checkout from "./pages/buyer/Checkout";
import BuyerDashboard from './pages/buyer/BuyerDashboard';
import ProductList from './pages/buyer/ProductList';
import ProductDetails from './pages/buyer/ProductDetails';
import ShopPage from './pages/buyer/ShopPage';
import ShopList from './pages/buyer/ShopList';
import Cart from "./pages/buyer/Cart";
import Chat from './pages/buyer/Chat';
import PaymentSuccess from "./pages/buyer/PaymentSuccess";
import BuyerOrders from "./pages/buyer/BuyerOrders";

// Seller
import SellerDashboard from "./pages/seller/SellerDashboard";

import AddProduct from "./pages/seller/AddProducts";
import SellerProductList from "./pages/seller/ProductList";
import EditProduct from "./pages/seller/EditProduct";
import Orders from "./pages/seller/Orders";
import Analytics from "./pages/seller/Analytics";
import SellerLayout from "./pages/seller/SellerLayout";

import MyShops from './pages/seller/MyShops.jsx';
import NotApproved from "./pages/seller/notApproved.jsx";

//admin
import SellerApprovals from './pages/admin/SellerApprovals';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminOrders from "./pages/admin/AdminOrders";


import ProtectedSellerRoute from "./utils/protectedSellerRoute";


function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      // Get the currently logged-in auth user
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // Fetch their profile from your users table
        const { data, error } = await supabase
          .from('users')
          .select('role, seller_status')
          .eq('id', user.id)
          .single();

        if (data) {
          setCurrentUser({ id: user.id, email: user.email, ...data });
        }
      }

      setLoadingUser(false);
    };

    fetchUser();

    // Also listen for auth state changes (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchUser();
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loadingUser) return <div>Loading...</div>;

  return (
    <Routes>
      <Route path="/" element={<Home />} />

      {/* Auth */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/buyer/become-seller" element={<BecomeSeller />} />

      {/* Buyer */}
      <Route path="/buyer" element={<BuyerDashboard />} />
      <Route path="/buyer/products" element={<ProductList />} />
      <Route path="/buyer/products/:id" element={<ProductDetails />} />
      <Route path="/buyer/chat/:sellerId" element={<Chat />} />
      <Route path="/buyer/cart" element={<Cart />} />
      <Route path="/buyer/checkout" element={<Checkout />} />
      <Route path="/shop/:id" element={<ShopPage />} />
      <Route path="/shops" element={<ShopList />} />
      <Route path="/payment-success" element={<PaymentSuccess />} />
      <Route path="/buyer/orders" element={<BuyerOrders />} />

      {/* Seller
      // <Route
      //   path="/seller"
      //   element={
      //     <ProtectedSellerRoute user={currentUser}>
      //       <SellerDashboard />
      //     </ProtectedSellerRoute>
      //   }
      /> */}

      {/* Seller Routes wrapped in Layout */}
      <Route
        path="/seller"
        element={
          <ProtectedSellerRoute user={currentUser}>
            <SellerLayout /> {/* This provides the Sidebar/Layout wrapper */}
          </ProtectedSellerRoute>
        }
      >
        <Route index element={<SellerDashboard />} /> {/* This matches /seller */}
        <Route path="dashboard" element={<SellerDashboard />} />

        <Route path="add-product" element={<AddProduct />} />
        <Route path="products" element={<SellerProductList />} />
        <Route path="edit-product/:id" element={<EditProduct />} />
        <Route path="orders" element={<Orders />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="shops" element={<MyShops />} />
      </Route>

      
      

      <Route path="/not-approved" element={<NotApproved />} />

      {/* Admin */}
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/admin/approvals" element={<SellerApprovals />} />
      <Route path="/admin/orders" element={<AdminOrders />} />
    </Routes>
  );
}

export default App;