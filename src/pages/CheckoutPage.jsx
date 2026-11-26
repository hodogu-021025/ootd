import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useOrders } from '../context/OrdersContext';
import { getSalePrice, SHIPPING_FEE } from '../utils/price';
import { writeStorageAll } from '../utils/storage';
import { useProducts } from '../context/ProductsContext';
import styles from './CheckoutPage.module.css';

// 배송 정보 입력 항목 (이름, 화면 표시 이름, 비었을 때 안내)
const SHIPPING_FIELDS = [
    { name: 'name', label: '수령인 이름', placeholder: '홍길동', error: '수령인 이름을 입력하세요.' },
    { name: 'phone', label: '연락처', placeholder: '010-0000-0000', error: '연락처를 입력하세요.' },
    { name: 'address', label: '주소', placeholder: '서울시 ○○구 ○○로 00', error: '주소를 입력하세요.' }
];

const EMPTY_SHIPPING = { name: '', phone: '', address: '' };

// S-05 주문서: 장바구니 전체를 주문 대상으로 확인하고(F-10) 배송 정보를 입력한다(F-11)
function CheckoutPage() {

    const { items, prepareRemoveItems } = useCart();
    const { prepareOrder } = useOrders();
    const { getStock, prepareStockDecrease } = useProducts();
    const navigate = useNavigate();

    const [shipping, setShipping] = useState(EMPTY_SHIPPING);
    const [errors, setErrors] = useState({});
    const [submitError, setSubmitError] = useState('');
    // 주문 완료를 여러 번 눌러도 한 번만 처리한다 (F-12 예외 처리)
    const [submitting, setSubmitting] = useState(false);

    // 주문할 수 있는 상태인지 확인 (비어 있거나 구매 불가 항목이 있으면 장바구니로 돌려보낸다)
    if (items.length === 0 || items.some(item => !item.available)) {
        return (
            <div className="container">
                <h2 className={styles.title}>주문서</h2>
                <div className={styles.empty}>
                    <p>주문할 상품을 확인할 수 없습니다. 장바구니에서 다시 시작해 주세요.</p>
                    <Link to="/cart" className={styles.outlineButton}>장바구니로</Link>
                </div>
            </div>
        );
    }

    const subtotal = items.reduce((sum, item) => sum + getSalePrice(item.product) * item.quantity, 0);
    const finalAmount = subtotal + SHIPPING_FEE;

    function handleChange(event) {
        const { name, value } = event.target;
        setShipping({ ...shipping, [name]: value });

        // 고쳐 쓰기 시작하면 그 항목의 오류 안내를 지운다
        if (errors[name]) {
            setErrors({ ...errors, [name]: '' });
        }
    }

    // 빈 값이나 공백만 있는 항목을 찾아 항목별 오류를 만든다 (연락처 형식은 검사하지 않는다)
    function validate() {
        const nextErrors = {};

        SHIPPING_FIELDS.forEach(field => {
            if (shipping[field.name].trim() === '') {
                nextErrors[field.name] = field.error;
            }
        });

        return nextErrors;
    }

    function handleSubmit(event) {
        event.preventDefault();

        if (submitting) {
            return;
        }

        const nextErrors = validate();
        setErrors(nextErrors);

        if (Object.keys(nextErrors).length > 0) {
            return;
        }

        setSubmitting(true);
        setSubmitError('');

        const trimmed = {
            name: shipping.name.trim(),
            phone: shipping.phone.trim(),
            address: shipping.address.trim()
        };

        // F-12: 주문 직전에 재고를 다시 확인한다 (F-27)
        const shortage = items.find(item => item.quantity > getStock(item.productId, item.size));

        if (shortage) {
            setSubmitError(`${shortage.product.name}(${shortage.size})의 재고가 부족합니다. 장바구니에서 수량을 확인해 주세요.`);
            setSubmitting(false);
            return;
        }

        // F-12: 주문 내역·장바구니·재고를 각각 계산해 두고 한 번에 저장한다
        const orderItems = items.map(item => ({ productId: item.productId, size: item.size, quantity: item.quantity }));

        const stockStep = prepareStockDecrease(orderItems);
        const orderStep = prepareOrder(items, trimmed);
        const cartStep = prepareRemoveItems(orderItems);

        if (!stockStep || !orderStep || !cartStep) {
            setSubmitError('저장된 정보를 읽지 못해 주문할 수 없습니다. 위 안내에서 초기화를 먼저 선택하세요.');
            setSubmitting(false);
            return;
        }

        // 하나라도 저장에 실패하면 모두 저장 전 상태로 되돌아간다
        if (!writeStorageAll([stockStep.entry, orderStep.entry, cartStep.entry])) {
            setSubmitError('주문 저장에 실패했습니다. 다시 시도해 주세요.');
            setSubmitting(false);
            return;
        }

        // 저장에 성공했으므로 화면 상태도 함께 반영한다
        stockStep.apply();
        orderStep.apply();
        cartStep.apply();

        // 뒤로 가기로 주문서에 돌아와 같은 주문을 다시 하지 않도록 현재 기록을 바꿔 이동한다
        navigate(`/order-complete/${orderStep.order.id}`, { replace: true });
    }

    return (
        <div className="container">
            <h2 className={styles.title}>주문서</h2>

            <form className={styles.layout} onSubmit={handleSubmit} noValidate>
                <div>
                    {/* 주문 상품 */}
                    <section className={styles.section}>
                        <h3 className={styles.sectionTitle}>주문 상품 ({items.length})</h3>

                        <ul className={styles.items}>
                            {items.map(item => {
                                const salePrice = getSalePrice(item.product);

                                return (
                                    <li key={`${item.productId}-${item.size}`} className={styles.item}>
                                        <img src={item.product.image} alt="" className={styles.itemImage} loading="lazy" decoding="async" />

                                        <div className={styles.itemInfo}>
                                            <p className={styles.itemBrand}>{item.product.brand}</p>
                                            <p className={styles.itemName}>{item.product.name}</p>
                                            <p className={styles.itemMeta}>
                                                {item.size} · {salePrice.toLocaleString()}원 · {item.quantity}개
                                            </p>
                                        </div>

                                        <p className={styles.itemTotal}>{(salePrice * item.quantity).toLocaleString()}원</p>
                                    </li>
                                );
                            })}
                        </ul>
                    </section>

                    {/* 배송 정보 */}
                    <section className={styles.section}>
                        <h3 className={styles.sectionTitle}>배송 정보</h3>

                        {SHIPPING_FIELDS.map(field =>
                            <div key={field.name} className={styles.field}>
                                <label htmlFor={`shipping-${field.name}`} className={styles.label}>{field.label}</label>
                                <input
                                    id={`shipping-${field.name}`}
                                    name={field.name}
                                    type="text"
                                    className={errors[field.name] ? `${styles.input} ${styles.inputError}` : styles.input}
                                    value={shipping[field.name]}
                                    onChange={handleChange}
                                    placeholder={field.placeholder}
                                    aria-invalid={Boolean(errors[field.name])}
                                />
                                {errors[field.name] && <p className={styles.fieldError}>{errors[field.name]}</p>}
                            </div>
                        )}
                    </section>
                </div>

                <aside className={styles.summary}>
                    <p className={styles.summaryTitle}>결제 금액</p>

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
                        <span>최종 금액</span>
                        <span className={styles.totalAmount}>{finalAmount.toLocaleString()}원</span>
                    </div>

                    <button type="submit" className={styles.orderButton} disabled={submitting}>
                        주문 완료
                    </button>

                    {submitError && <p className={styles.submitError}>{submitError}</p>}

                    <p className={styles.note}>* 모의 주문이므로 실제 결제는 이루어지지 않습니다.</p>
                </aside>
            </form>
        </div>
    );
}

export default CheckoutPage;
