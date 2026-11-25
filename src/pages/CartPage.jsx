import { Link, useNavigate } from 'react-router-dom';
import { useCart, MIN_QUANTITY, MAX_QUANTITY } from '../context/CartContext';
import { getSalePrice, SHIPPING_FEE } from '../utils/price';
import { useProducts } from '../context/ProductsContext';
import styles from './CartPage.module.css';

// 장바구니 한 줄을 구분하는 값 (같은 의류라도 사이즈가 다르면 다른 줄이다)
function itemKey(item) {
    return `${item.productId}-${item.size}`;
}

// 장바구니 한 줄 (사진 / 브랜드·상품명·사이즈 / 수량 조절 / 금액 / 삭제)
function CartItem({ item, stock, onDecrease, onIncrease, onRemove }) {

    const { product, size, quantity, available } = item;

    // 재고보다 많이 담긴 항목은 수량을 줄이거나 삭제해야 주문할 수 있다 (F-27)
    const overStock = quantity > stock;
    const quantityLimit = Math.min(MAX_QUANTITY, stock);

    // 구매 불가 항목: 삭제된 의류이거나 사이즈가 없어졌다 (삭제만 할 수 있다)
    if (!available) {
        return (
            <li className={styles.item}>
                {product
                    ? <img src={product.image} alt="" className={styles.itemImage} />
                    : <div className={styles.itemImage}></div>
                }

                <div className={styles.itemInfo}>
                    <p className={styles.itemName}>{product ? product.name : '판매가 종료된 의류'}</p>
                    <p className={styles.itemOption}>사이즈: {size}</p>
                    <p className={styles.unavailable}>구매 불가</p>
                </div>

                <RemoveButton onClick={onRemove} />
            </li>
        );
    }

    const salePrice = getSalePrice(product);
    const totalPrice = salePrice * quantity;

    return (
        <li className={styles.item}>
            <Link to={`/products/${product.id}`}>
                <img src={product.image} alt="" className={styles.itemImage} />
            </Link>

            <div className={styles.itemInfo}>
                <p className={styles.itemBrand}>{product.brand}</p>
                <Link to={`/products/${product.id}`} className={styles.itemName}>{product.name}</Link>
                <p className={styles.itemOption}>사이즈: {size}</p>
                {overStock && stock > 0 && (
                    <p className={styles.unavailable}>재고 부족(남은 수량 {stock}개)</p>
                )}
            </div>

            {/* 수량 조절 버튼과, 더 담을 수 없을 때의 안내 */}
            <div className={styles.quantityArea}>
                <div className={styles.quantity}>
                    <button
                        type="button"
                        className={styles.quantityButton}
                        onClick={onDecrease}
                        disabled={quantity <= MIN_QUANTITY}
                        aria-label="수량 감소"
                    >
                        −
                    </button>
                    <span className={styles.quantityValue}>{quantity}</span>
                    <button
                        type="button"
                        className={styles.quantityButton}
                        onClick={onIncrease}
                        disabled={quantity >= quantityLimit}
                        aria-label="수량 증가"
                    >
                        +
                    </button>
                </div>

                {/* 재고를 모두 담아 더 담을 수 없을 때 (재고 0인 항목도 포함된다) */}
                {quantity >= stock && <p className={styles.outOfStock}>재고가 없습니다.</p>}
            </div>

            <div className={styles.itemPrice}>
                <p className={styles.itemTotal}>{totalPrice.toLocaleString()}원</p>
                {quantity > 1 && (
                    <p className={styles.itemUnitPrice}>(개당 {salePrice.toLocaleString()}원)</p>
                )}
            </div>

            <RemoveButton onClick={onRemove} />
        </li>
    );
}

// 휴지통 모양 삭제 버튼
function RemoveButton({ onClick }) {
    return (
        <button type="button" className={styles.removeButton} onClick={onClick} aria-label="삭제">
            <svg viewBox="0 0 20 20" className={styles.removeIcon} aria-hidden="true">
                <path d="M4 6h12M8 6V4.5A1.5 1.5 0 0 1 9.5 3h1A1.5 1.5 0 0 1 12 4.5V6M8.5 9.5v5M11.5 9.5v5M5.5 6l.6 9A1.5 1.5 0 0 0 7.6 16.5h4.8a1.5 1.5 0 0 0 1.5-1.4l.6-9" />
            </svg>
        </button>
    );
}

// S-04 장바구니
// 주문 대상은 항상 장바구니 전체이고 배송비는 0원이다 (02 기능 명세서)
function CartPage() {

    const { items, count, error, updateQuantity, removeItem } = useCart();
    const { getStock } = useProducts();
    const navigate = useNavigate();

    // 구매 불가 항목이나 재고보다 많이 담긴 항목이 있으면 주문할 수 없다 (F-07·F-27 예외 처리)
    const hasUnavailable = items.some(item => !item.available);
    const hasOverStock = items.some(item => item.available && item.quantity > getStock(item.productId, item.size));
    const blocked = hasUnavailable || hasOverStock;

    const subtotal = items
        .filter(item => item.available)
        .reduce((sum, item) => sum + getSalePrice(item.product) * item.quantity, 0);
    const finalAmount = subtotal + SHIPPING_FEE;

    if (items.length === 0) {
        return (
            <div className="container">
                <h2 className={styles.title}>장바구니</h2>
                <div className={styles.empty}>
                    <p>장바구니가 비어 있습니다.</p>
                    <Link to="/products" className={styles.outlineButton}>의류 보러 가기</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="container">
            <h2 className={styles.title}>장바구니</h2>

            <div className={styles.layout}>
                <div className={styles.itemsSection}>
                    <p className={styles.countRow}>담은 상품 {count}개</p>

                    {error && <p className={styles.errorMessage}>{error}</p>}

                    <ul className={styles.items}>
                        {items.map(item =>
                            <CartItem
                                key={itemKey(item)}
                                item={item}
                                stock={getStock(item.productId, item.size)}
                                onDecrease={() => updateQuantity(item.productId, item.size, item.quantity - 1)}
                                onIncrease={() => updateQuantity(item.productId, item.size, item.quantity + 1)}
                                onRemove={() => removeItem(item.productId, item.size)}
                            />
                        )}
                    </ul>
                </div>

                <aside className={styles.summary}>
                    <p className={styles.summaryTitle}>결제 예정 금액</p>

                    <dl className={styles.summaryList}>
                        <div className={styles.summaryRow}>
                            <dt>총 상품금액</dt>
                            <dd>{subtotal.toLocaleString()}원</dd>
                        </div>
                        <div className={styles.summaryRow}>
                            <dt>배송비</dt>
                            <dd>{SHIPPING_FEE.toLocaleString()}원</dd>
                        </div>
                    </dl>

                    <div className={styles.summaryTotal}>
                        <span>총 결제금액</span>
                        <span className={styles.totalAmount}>{finalAmount.toLocaleString()}원</span>
                    </div>

                    <button
                        type="button"
                        className={styles.orderButton}
                        onClick={() => navigate('/checkout')}
                        disabled={blocked}
                    >
                        주문하기
                    </button>

                    {hasUnavailable && (
                        <p className={styles.orderNotice}>구매 불가 상품을 삭제한 뒤 주문할 수 있습니다.</p>
                    )}

                    {!hasUnavailable && hasOverStock && (
                        <p className={styles.orderNotice}>재고보다 많이 담긴 상품의 수량을 줄이거나 삭제한 뒤 주문할 수 있습니다.</p>
                    )}

                    <ul className={styles.notes}>
                        <li>* 장바구니에 담긴 상품 전체를 주문합니다.</li>
                        <li>* 한 상품은 최대 {MAX_QUANTITY}개까지 담을 수 있습니다.</li>
                        <li>* 배송비는 무료입니다.</li>
                    </ul>
                </aside>
            </div>
        </div>
    );
}

export default CartPage;
