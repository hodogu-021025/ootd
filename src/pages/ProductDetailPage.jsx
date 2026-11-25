import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Breadcrumb from '../components/Breadcrumb';
import LikeButton from '../components/LikeButton';
import PriceTag from '../components/PriceTag';
import { genderLabels } from '../mocks/products';
import { useCart, MIN_QUANTITY, MAX_QUANTITY } from '../context/CartContext';
import { getSalePrice } from '../utils/price';
import { useProducts, LOW_STOCK_LIMIT } from '../context/ProductsContext';
import { useRestockAlerts } from '../context/RestockAlertsContext';
import styles from './ProductDetailPage.module.css';

// S-03 의류 상세
function ProductDetailPage() {

    // /products/3 에서 의류 ID를 읽는다 (주소 값은 문자열이라 숫자로 바꾼다)
    const { productId } = useParams();
    const { getProduct, getStock, getProductStock } = useProducts();
    const product = getProduct(Number(productId));

    const [selectedSize, setSelectedSize] = useState('');
    // 구매 수량: 확정된 수량(quantity)과 입력창에 적고 있는 값(quantityText)을 따로 둔다 (F-05)
    const [quantity, setQuantity] = useState(MIN_QUANTITY);
    const [quantityText, setQuantityText] = useState(String(MIN_QUANTITY));
    const [message, setMessage] = useState('');
    // 담기에 성공했을 때만 장바구니로 가는 링크를 보여 준다
    const [added, setAdded] = useState(false);

    const { addItem, items: cartItems } = useCart();
    const { isRequested, requestAlert } = useRestockAlerts();
    // 재입고 알림을 신청한 뒤 보여 줄 안내
    const [alertMessage, setAlertMessage] = useState('');

    // 다른 의류를 열면 사이즈는 선택 안 함, 수량은 1로 시작한다 (F-04)
    const [prevProductId, setPrevProductId] = useState(productId);
    if (productId !== prevProductId) {
        setPrevProductId(productId);
        setSelectedSize('');
        setQuantity(MIN_QUANTITY);
        setQuantityText(String(MIN_QUANTITY));
        setMessage('');
        setAdded(false);
    }

    // 없는 의류 ID로 들어온 경우 (F-04 예외 처리)
    if (!product) {
        return (
            <div className="container">
                <Breadcrumb items={[{ label: 'HOME', to: '/' }, { label: 'CLOTHES', to: '/products' }]} />
                <div className={styles.notFound}>
                    <p>의류를 찾을 수 없습니다.</p>
                    <Link to="/products" className={styles.outlineButton}>의류 목록으로</Link>
                </div>
            </div>
        );
    }

    // 위치 표시: HOME › 성별 › 상품명 (성별은 주소가 아니라 의류 정보에서 가져와 새로고침해도 유지된다)
    const genderLabel = genderLabels[product.gender];

    // 사이즈별 재고 (F-27): 4개 이상 정상, 1~3개 재고 부족, 0개 재고 없음
    const productStock = getProductStock(product.id);
    const soldOut = product.sizes.every(size => (productStock[size] || 0) === 0);

    // 고른 사이즈의 재고와, 이미 장바구니에 담아 둔 수량
    const selectedStock = selectedSize ? getStock(product.id, selectedSize) : 0;
    const inCart = cartItems.find(item => item.productId === product.id && item.size === selectedSize);
    const cartQuantity = inCart ? inCart.quantity : 0;

    // 수량 한도: 99와 재고 중 작은 값 (공통 규칙 '재고 한도')
    const quantityLimit = selectedSize ? Math.min(MAX_QUANTITY, selectedStock) : MAX_QUANTITY;

    // 카테고리 해시태그: #상의 #티셔츠 #반소매 (각각 해당 단계의 목록으로 연결)
    const listPath = `/products?gender=${product.gender}`;
    const categoryTags = [
        { label: product.category, to: `${listPath}&category=${product.category}` },
        { label: product.group, to: `${listPath}&category=${product.category}&group=${product.group}` },
        { label: product.item, to: `${listPath}&category=${product.category}&group=${product.group}&item=${product.item}` }
    ];

    function handleSizeClick(size) {
        setSelectedSize(size);
        // 사이즈를 바꾸면 그 사이즈의 재고 한도에 맞춰 수량을 1로 되돌린다
        setQuantity(MIN_QUANTITY);
        setQuantityText(String(MIN_QUANTITY));
        setMessage('');
        setAdded(false);
    }

    // 수량 증감 버튼 (1개 미만, 99개 초과는 버튼이 눌리지 않는다)
    function changeQuantity(next) {
        setQuantity(next);
        setQuantityText(String(next));
        setMessage('');
        setAdded(false);
    }

    // 입력창은 Enter를 누르거나 입력창에서 벗어날 때 검사한다
    // 1~99의 정수가 아니면 마지막 유효 수량으로 되돌리고 범위를 안내한다
    function confirmQuantity() {
        const next = Number(quantityText);

        if (!Number.isInteger(next) || next < MIN_QUANTITY || next > quantityLimit) {
            setQuantityText(String(quantity));
            setMessage(`수량은 ${MIN_QUANTITY}~${quantityLimit}의 정수로 입력하세요.`);
            setAdded(false);
            return;
        }

        changeQuantity(next);
    }

    function handleQuantityKeyDown(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            confirmQuantity();
        }
    }

    // F-28 재입고 알림 신청 (같은 의류·같은 사이즈는 한 번만 신청된다)
    function handleRequestAlert(size) {
        if (requestAlert(product.id, size)) {
            setAlertMessage(`${size} 사이즈가 재입고되면 알려 드릴게요.`);
            return;
        }

        setAlertMessage('재입고 알림 신청에 실패했습니다. 다시 시도해 주세요.');
    }

    function handleAddToCart() {
        if (!selectedSize) {
            setMessage('사이즈를 선택하세요.');
            return;
        }

        // F-27: 장바구니에 담긴 수량까지 합쳐 재고를 넘으면 담지 않는다
        const addable = selectedStock - cartQuantity;

        if (quantity > addable) {
            setMessage(addable > 0
                ? `추가로 담을 수 있는 수량은 ${addable}개입니다(재고 ${selectedStock}개).`
                : `이미 재고 수량만큼 담았습니다(재고 ${selectedStock}개).`);
            setAdded(false);
            return;
        }

        // F-06: 같은 의류·사이즈가 있으면 수량을 합산한다
        const result = addItem(product.id, selectedSize, quantity);
        setMessage(result.message);
        setAdded(result.ok);
    }

    return (
        <div className="container">
            <Breadcrumb
                items={[
                    { label: 'HOME', to: '/' },
                    { label: genderLabel, to: `/products?gender=${product.gender}` },
                    { label: product.name }
                ]}
            />

            <div className={styles.detail}>
                <div className={styles.imageBox}>
                    <img src={product.image} alt={product.name} className={styles.image} />
                </div>

                <div className={styles.info}>
                    <p className={styles.brand}>{product.brand}</p>
                    <h2 className={styles.name}>{product.name}</h2>
                    <PriceTag product={product} size="detail" />
                    <p className={styles.description}>{product.description}</p>

                    <div className={styles.infoBox}>
                        {/* 카테고리 해시태그: 누르면 해당 카테고리의 의류 목록으로 이동한다 */}
                        <p className={styles.hashtags}>
                            {categoryTags.map(tag =>
                                <Link key={tag.label} to={tag.to} className={styles.hashtag}>#{tag.label}</Link>
                            )}
                        </p>

                        <dl className={styles.specs}>
                            <dt>의류 종류</dt>
                            <dd>{product.type}</dd>
                            <dt>착용 계절</dt>
                            <dd>{product.season}</dd>
                            <dt>권장 성별</dt>
                            <dd>{genderLabel}</dd>
                        </dl>
                    </div>

                    <p className={styles.label}>사이즈</p>
                    {soldOut && <p className={styles.soldOut}>품절</p>}
                    <div className={styles.sizes}>
                        {product.sizes.map(size => {
                            const sizeStock = productStock[size] || 0;
                            const sizeSoldOut = sizeStock === 0;
                            const lowStock = !sizeSoldOut && sizeStock <= LOW_STOCK_LIMIT;

                            return (
                                <div key={size} className={styles.sizeCell}>
                                    <button
                                        type="button"
                                        className={size === selectedSize ? `${styles.sizeButton} ${styles.sizeSelected}` : styles.sizeButton}
                                        onClick={() => handleSizeClick(size)}
                                        aria-pressed={size === selectedSize}
                                        disabled={sizeSoldOut}
                                    >
                                        {size}
                                        {/* 재고 상태를 사이즈 버튼 안에 함께 보여 준다 (F-27) */}
                                        {sizeSoldOut && <span className={styles.sizeStock}>재고 없음</span>}
                                        {lowStock && <span className={styles.sizeStock}>재고 부족({sizeStock}개 남음)</span>}
                                    </button>

                                    {/* 재고 없음 사이즈는 그 아래에서 재입고 알림을 신청한다 (F-28) */}
                                    {sizeSoldOut && (
                                        isRequested(product.id, size)
                                            ? <span className={styles.alertDone}>신청 완료</span>
                                            : (
                                                <button
                                                    type="button"
                                                    className={styles.alertButton}
                                                    onClick={() => handleRequestAlert(size)}
                                                >
                                                    재입고 알림
                                                </button>
                                            )
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {alertMessage && <p className={styles.alertMessage}>{alertMessage}</p>}

                    <p className={styles.label}>구매 수량</p>
                    <div className={styles.quantityRow}>
                        <div className={styles.quantity}>
                            <button
                                type="button"
                                className={styles.quantityButton}
                                onClick={() => changeQuantity(quantity - 1)}
                                disabled={quantity <= MIN_QUANTITY}
                                aria-label="수량 감소"
                            >
                                −
                            </button>
                            <input
                                type="text"
                                inputMode="numeric"
                                className={styles.quantityInput}
                                value={quantityText}
                                onChange={event => setQuantityText(event.target.value)}
                                onKeyDown={handleQuantityKeyDown}
                                onBlur={confirmQuantity}
                                aria-label="구매 수량"
                            />
                            <button
                                type="button"
                                className={styles.quantityButton}
                                onClick={() => changeQuantity(quantity + 1)}
                                disabled={quantity >= quantityLimit}
                                aria-label="수량 증가"
                            >
                                +
                            </button>
                        </div>

                        {/* 판매 가격 × 수량 */}
                        <p className={styles.totalPrice}>
                            <span className={styles.totalLabel}>총 금액</span>
                            {(getSalePrice(product) * quantity).toLocaleString()}원
                        </p>
                    </div>

                    {/* 장바구니 담기 + 좋아요(찜) */}
                    <div className={styles.actions}>
                        <button type="button" className={styles.cartButton} onClick={handleAddToCart} disabled={soldOut}>
                            {soldOut ? '품절' : '장바구니 담기'}
                        </button>
                        <LikeButton productId={product.id} variant="detail" />
                    </div>
                    {message && (
                        <p className={styles.message}>
                            {message}
                            {added && <Link to="/cart" className={styles.cartLink}>장바구니 보기</Link>}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}

export default ProductDetailPage;
