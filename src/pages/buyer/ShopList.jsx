import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import Navbar from "../../components/Navbar";
import TopsellerCard from "../../components/TopsellerCard";
import "./ShopList.css";

function ShopList() {
  const [shops, setShops] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState("All");
  const navigate = useNavigate();

  useEffect(() => {
    fetchShops();
  }, []);

  async function fetchShops() {
    const { data, error } = await supabase.from("shops").select("*");
    if (error) console.error(error);
    else {
      setShops(data);
      setFiltered(data);
      const cats = ["All", ...new Set(data.map(s => s.Category).filter(Boolean))];
      setCategories(cats);
    }
  }

  function filterByCategory(cat) {
    setActiveCategory(cat);
    if (cat === "All") setFiltered(shops);
    else setFiltered(shops.filter(s => s.Category === cat));
  }

  return (
    <div className="shoplist-wrapper">
      <Navbar />

      <div className="shoplist-hero">
        <h1>All Shops</h1>
        <p>Discover student-run businesses on campus</p>
      </div>

      <div className="shoplist-content">

        {/* CATEGORY FILTER PILLS */}
        <div className="category-pills">
          {categories.map(cat => (
            <button
              key={cat}
              className={`pill ${activeCategory === cat ? "active" : ""}`}
              onClick={() => filterByCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* SHOPS GRID */}
        <div className="shops-grid">
          {filtered.map(shop => (
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
    </div>
  );
}

export default ShopList;