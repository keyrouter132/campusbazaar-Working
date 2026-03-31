import './TopsellerCard.css';

function TopsellerCard({ name, image, category }) {
  return (
    <div className="top-seller-card">
      {image
        ? <img className="top-seller-image" src={image} alt={name} />
        : <div className="top-seller-avatar" />
      }
      <p>{name}</p>
      {category && <span className="top-seller-category">{category}</span>}
    </div>
  );
}

export default TopsellerCard;