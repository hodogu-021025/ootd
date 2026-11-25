import { Link } from 'react-router-dom';
import { useOrders } from '../context/OrdersContext';
import { orderStatusLabels } from '../mocks/orders';
import { useProducts } from '../context/ProductsContext';
import styles from './OrdersPage.module.css';

// 주문 하나를 보여 주는 카드
// onCancel: 주문 취소를 눌렀을 때 (상태가 '주문 완료'인 주문에만 취소 버튼을 보여 준다)
function OrderCard({ order, onCancel, findImage }) {

    const cancelled = order.status === 'cancelled';

    return (
        <article className={styles.order}>
            <div className={styles.orderHead}>
                <div>
                    <p className={styles.orderNumber}>주문번호 {order.id}</p>
                    <p className={styles.orderDate}>{order.orderedAt}</p>
                    {cancelled && <p className={styles.cancelDate}>{order.cancelledAt} 취소</p>}
                </div>

                <div className={styles.statusArea}>
                    <span className={cancelled ? `${styles.status} ${styles.statusCancelled}` : styles.status}>
                        {orderStatusLabels[order.status]}
                    </span>

                    {order.status === 'paid' && (
                        <button type="button" className={styles.cancelButton} onClick={() => onCancel(order)}>
                            주문 취소
                        </button>
                    )}
                </div>
            </div>

            <ul className={styles.items}>
                {order.items.map(item => {
                    const image = findImage(item.productId);

                    return (
                        <li key={`${item.productId}-${item.size}`} className={styles.item}>
                            {image
                                ? <img src={image} alt="" className={styles.itemImage} />
                                : <div className={styles.itemImage}></div>
                            }

                            <div className={styles.itemInfo}>
                                <p className={styles.itemBrand}>{item.brand}</p>
                                <p className={styles.itemName}>{item.name}</p>
                                <p className={styles.itemMeta}>{item.size} · {item.salePrice.toLocaleString()}원 · {item.quantity}개</p>
                            </div>

                            <p className={styles.itemTotal}>{item.totalPrice.toLocaleString()}원</p>
                        </li>
                    );
                })}
            </ul>

            <div className={styles.orderFoot}>
                <span className={styles.shipping}>받는 분 {order.shipping.name}</span>
                <span className={styles.shippingFee}>배송비 {(order.shippingFee || 0).toLocaleString()}원</span>
                <span>최종 금액</span>
                <span className={styles.total}>{order.totalPrice.toLocaleString()}원</span>
            </div>
        </article>
    );
}

// S-07 주문 내역 (주문 취소는 R-10 작업 때 이 화면에 추가한다)
function OrdersPage() {

    const { orders: storedOrders, cancelOrder } = useOrders();
    const { getProduct, increaseStock } = useProducts();

    // 주문 항목의 사진: 주문에는 사진을 저장하지 않으므로 현재 의류 목록에서 찾는다 (삭제된 의류는 빈 칸)
    function findImage(productId) {
        const product = getProduct(productId);
        return product ? product.image : null;
    }

    // 확인 창에서 확인을 눌렀을 때만 취소한다 (F-18)
    function handleCancel(order) {
        if (!window.confirm(`${order.id} 주문을 취소하시겠습니까?`)) {
            return;
        }

        if (!cancelOrder(order.id)) {
            window.alert('주문 취소에 실패했습니다. 다시 시도해 주세요.');
            return;
        }

        // F-18: 주문한 수량만큼 재고를 되돌린다 (삭제된 의류·없어진 사이즈는 제외)
        if (!increaseStock(order.items)) {
            window.alert('주문은 취소되었지만 재고를 되돌리지 못했습니다.');
        }
    }

    // 최근 주문부터 보이도록 정렬한다 (주문번호가 날짜 + 순번이라 큰 번호가 최신이다)
    const orders = [...storedOrders].sort((a, b) => b.id.localeCompare(a.id));

    return (
        <div className="container">
            <h2 className={styles.title}>주문 내역</h2>

            {orders.length > 0
                ? (
                    <div className={styles.orderList}>
                        {orders.map(order =>
                            <OrderCard key={order.id} order={order} onCancel={handleCancel} findImage={findImage} />
                        )}
                    </div>
                )
                : <p className={styles.empty}>주문 내역이 없습니다.</p>
            }

            <div className={styles.moreButtonWrap}>
                <Link to="/products" className={styles.moreButton}>계속 쇼핑하기</Link>
            </div>
        </div>
    );
}

export default OrdersPage;
