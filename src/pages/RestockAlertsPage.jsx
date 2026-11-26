import { Link } from 'react-router-dom';
import Breadcrumb from '../components/Breadcrumb';
import { useRestockAlerts } from '../context/RestockAlertsContext';
import { useProducts } from '../context/ProductsContext';
import styles from './RestockAlertsPage.module.css';

// 재입고 알림 목록: 신청한 의류·사이즈와 상태를 보여 준다 (F-28)
function RestockAlertsPage() {

    const { alerts, removeAlert } = useRestockAlerts();
    const { getProduct } = useProducts();

    // 최근에 신청한 것부터 보여 준다
    const items = [...alerts].reverse();

    return (
        <div className="container">
            <Breadcrumb items={[{ label: 'HOME', to: '/' }, { label: 'LISTS', to: '/lists' }, { label: '재입고 알림 목록' }]} />

            <h2 className={styles.title}>
                재입고 알림 목록 <span className={styles.count}>{items.length}</span>
            </h2>

            {items.length > 0
                ? (
                    <ul className={styles.list}>
                        {items.map(alert => {
                            const product = getProduct(alert.productId);
                            const stock = product ? product.stock[alert.size] || 0 : 0;

                            return (
                                <li key={`${alert.productId}-${alert.size}-${alert.requestedAt}`} className={styles.item}>
                                    {product
                                        ? <img src={product.image} alt="" className={styles.image} loading="lazy" decoding="async" />
                                        : <div className={styles.image}></div>
                                    }

                                    <div className={styles.info}>
                                        <p className={styles.name}>
                                            {product
                                                ? <Link to={`/products/${product.id}`}>{product.name}</Link>
                                                : '판매가 종료된 의류'
                                            }
                                        </p>
                                        <p className={styles.meta}>{alert.size} 사이즈 · {alert.requestedAt} 신청</p>
                                    </div>

                                    <p className={styles.state}>
                                        {alert.notified
                                            ? '알림 받음'
                                            : (stock > 0 ? '재입고됨' : '재입고 기다리는 중')
                                        }
                                    </p>

                                    {!alert.notified && (
                                        <button
                                            type="button"
                                            className={styles.removeButton}
                                            onClick={() => removeAlert(alert.productId, alert.size)}
                                        >
                                            신청 취소
                                        </button>
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                )
                : (
                    <div className={styles.empty}>
                        <p>신청한 재입고 알림이 없습니다.</p>
                        <Link to="/products" className={styles.outlineButton}>의류 보러 가기</Link>
                    </div>
                )
            }
        </div>
    );
}

export default RestockAlertsPage;
