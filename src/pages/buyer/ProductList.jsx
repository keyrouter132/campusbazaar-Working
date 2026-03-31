import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import ProductCard from "../../components/ProductCard";
import "./ProductList.css";

function ProductList() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  const searchQuery = new URLSearchParams(location.search).get("search") || "";

  useEffect(() => {
    fetchProducts();
  }, [searchQuery]);

  async function fetchProducts() {
    setLoading(true);

    if (!searchQuery) {
      const { data, error } = await supabase
        .from("products")
        .select("*");
      if (error) console.error(error);
      else setProducts(data);
      setLoading(false);
      return;
    }

    const { data: nameData } = await supabase
      .from("products")
      .select("*")
      .ilike("name", `%${searchQuery}%`);

    const { data: descData } = await supabase
      .from("products")
      .select("*")
      .ilike("description", `%${searchQuery}%`);

    const combined = [...(nameData || [])];
    (descData || []).forEach(item => {
      if (!combined.find(p => p.id === item.id)) {
        combined.push(item);
      }
    });

    setProducts(combined);
    setLoading(false);
  }

  return (
    <div className="product-page">
      <div className="product-header">
        {searchQuery
          ? <><h2>Results for "{searchQuery}"</h2>
              <p>{products.length} product{products.length !== 1 ? "s" : ""} found</p></>
          : <><h2>All Products</h2>
              <p>Browse campus products from student sellers</p></>
        }
      </div>

      {loading ? (
        <p style={{ padding: "40px" }}>Loading...</p>
      ) : products.length === 0 ? (
        <div className="no-results">
          <p>No products found for "<strong>{searchQuery}</strong>"</p>
          <p>Try searching for candles, jewellery, food, art...</p>
        </div>
      ) : (
        <div className="product-grid">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}

export default ProductList;