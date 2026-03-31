import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from '../components/Navbar';
import ProductCard from '../components/ProductCard';
import TopsellerCard from '../components/TopsellerCard'; // ✅ ADD THIS
import { supabase } from "../supabaseClient";
import './Home.css';

function Home() {
  const [shops, setShops] = useState([]);
  const [popularProducts, setPopularProducts] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchShops();
    fetchPopularProducts();
  }, []);

  async function fetchShops() {
    const { data, error } = await supabase
      .from("shops")
      .select("*")
      .limit(4);
    if (error) console.error(error);
    else setShops(data);
  }

  async function fetchPopularProducts() {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .range(4, 7);
    if (error) console.error(error);
    else setPopularProducts(data);
  }

  return (
    <div className="home">
      <Navbar />

      {/* HERO */}
      <section className="home-section hero">
        <h1 style={{ fontSize: '42px', lineHeight: '1.3' }}>
          Your Campus, Your <br />
          Marketplace, Your Creation.
        </h1>
      </section>

      {/* TOP SHOPS */}
      <section className="home-section top-sellers-section">
        <h2 className="side-title">TOP <br /> SELLERS</h2>
        <div className="card-row-wrapper">
          <div className="card-row">
            {shops.map(shop => (
  <div
    key={shop.id}
    onClick={() => navigate(`/shop/${shop.id}`)}
  >
    <TopsellerCard
      name={shop.name}
      image={shop.shop_urls}
      category={shop.Category}
    />
  </div>
))}
          </div>
        </div>
      </section>
      
     {/* VIEW ALL SHOPS BUTTON */}
<div style={{ textAlign: "center", marginTop: "-20px", marginBottom: "20px" }}>
  <button
    className="view-all-btn"
    onClick={() => navigate("/shops")}
  >
    Browse All Shops
  </button>
</div>


      {/* POPULAR PRODUCTS */}
      <section className="popular-products">
        <h2 className="popular-title">Popular Products</h2>
        <Link to="/buyer/products">
          <button className="view-all-btn">View All Products</button>
        </Link>
        <div className="card-row" style={{ marginTop: "24px" }}>
          {popularProducts.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </div>
  );
}

export default Home;