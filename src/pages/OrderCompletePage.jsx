import { Link, useParams } from 'react-router-dom';
import { useOrders } from '../context/OrdersContext';
import styles from './OrderCompletePage.module.css';

// S-06 주문 완료: 주문번호와 완료 안내를 보여 주고 주문 내역으로 이동할 수 있게 한다
function OrderCompletePage() {

    const { orderId } = useParams();
    const { orders } = useOrders();
    const order = orders.find(item => item.id === orderId);

    if (!order) {
        return (
            <div className="container">
                <div className={styles.box}>
                    <p className={styles.message}>주문 정보를 찾을 수 없습니다.</p>
                    <div className={styles.buttons}>
                        <Link to="/orders" className={styles.primaryButton}>주문 내역 보기</Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="container">
            <div className={styles.box}>
                <p className={styles.check} aria-hidden="true">✓</p>
                <h2 className={styles.title}>주문이 완료되었습니다.</h2>

                <dl className={styles.info}>
                    <dt>주문번호</dt>
                    <dd>{order.id}</dd>
                    <dt>주문 일시</dt>
                    <dd>{order.orderedAt}</dd>
                    <dt>받는 분</dt>
                    <dd>{order.shipping.name}</dd>
                    <dt>결제 금액</dt>
                    <dd className={styles.amount}>{order.totalPrice.toLocaleString()}원</dd>
                </dl>

                <div className={styles.buttons}>
                    <Link to="/orders" className={styles.primaryButton}>주문 내역 보기</Link>
                    <Link to="/products" className={styles.outlineButton}>계속 쇼핑하기</Link>
                </div>
            </div>
        </div>
    );
}

export default OrderCompletePage;
