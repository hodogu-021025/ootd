import { getSalePrice } from '../utils/price';
import styles from './PriceTag.module.css';

// 판매 가격 표시 (F-26): 할인 중이면 '할인율 · 할인 가격 · 할인 전 가격(취소선)'을, 아니면 가격만 보여 준다
// product: { price, discountRate }, size: 'card'(목록 카드) 또는 'detail'(상세 화면)
function PriceTag({ product, size = 'card' }) {

    const className = `${styles.price} ${styles[size]}`;

    if (product.discountRate === 0) {
        return <p className={className}>{product.price.toLocaleString()}원</p>;
    }

    return (
        <p className={className}>
            <span className={styles.rate}>{product.discountRate}%</span>
            <span>{getSalePrice(product).toLocaleString()}원</span>
            <del className={styles.original}>{product.price.toLocaleString()}원</del>
        </p>
    );
}

export default PriceTag;
