import { Link } from 'react-router-dom';
import LikeButton from './LikeButton';
import PriceTag from './PriceTag';
import styles from './ProductCard.module.css';

// 의류 목록의 상품 카드 (사진, 브랜드, 상품명, 판매 가격, 좋아요)
// product: { id, image, brand, name, price, discountRate }
// 링크 안에 버튼을 넣을 수 없어서, 카드 링크와 좋아요 버튼을 나란히 두고 버튼을 사진 위에 겹친다
function ProductCard({ product }) {

    return (
        <div className={styles.wrap}>
            <Link to={`/products/${product.id}`} className={styles.card}>
                <div className={styles.imageBox}>
                    <img src={product.image} alt={product.name} className={styles.image} loading="lazy" decoding="async" />
                </div>

                <p className={styles.brand}>{product.brand}</p>
                <p className={styles.name}>{product.name}</p>
                <PriceTag product={product} />
            </Link>

            <div className={styles.like}>
                <LikeButton productId={product.id} />
            </div>
        </div>
    );
}

export default ProductCard;
