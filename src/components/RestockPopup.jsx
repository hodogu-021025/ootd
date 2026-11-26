import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useRestockAlerts } from '../context/RestockAlertsContext';
import { useProducts } from '../context/ProductsContext';
import styles from './RestockPopup.module.css';

// 팝업을 띄우기까지 기다리는 시간 (F-29: 재입고 일시와 사이트를 연 시각 중 늦은 시각에서 5초 뒤)
const POPUP_DELAY = 5000;

// 재입고 알림 팝업 (F-29)
// 신청한 사이즈의 재고가 1개 이상이 되면 한 팝업에 모아 알리고, 알린 신청은 다시 띄우지 않는다
function RestockPopup() {

    const { alerts, markNotified } = useRestockAlerts();
    const { products } = useProducts();

    // 팝업에 보여 줄 항목 (비어 있으면 팝업을 띄우지 않는다)
    const [popupItems, setPopupItems] = useState([]);

    // 사이트를 연 시각 (이 시각보다 앞선 재입고도 5초 뒤에 알린다)
    const [openedAt] = useState(() => Date.now());

    useEffect(() => {
        const waiting = alerts.filter(alert => !alert.notified);

        if (waiting.length === 0) {
            return;
        }

        // 신청한 의류가 삭제되었거나 사이즈가 없어졌으면 팝업 없이 '표시함'으로 처리한다
        const findProduct = productId => products.find(product => product.id === productId);

        const gone = waiting.filter(alert => {
            const product = findProduct(alert.productId);
            return product === undefined || !product.sizes.includes(alert.size);
        });

        if (gone.length > 0) {
            markNotified(gone.map(alert => ({ productId: alert.productId, size: alert.size })));
            return;
        }

        // 재입고된 신청: 신청한 사이즈의 재고가 1개 이상인 것
        const restocked = waiting
            .map(alert => ({ alert, product: findProduct(alert.productId) }))
            .filter(({ alert, product }) => (product.stock[alert.size] || 0) > 0);

        if (restocked.length === 0) {
            return;
        }

        // 팝업 시각: 재입고 일시와 사이트를 연 시각 중 늦은 시각에서 5초 뒤
        const restockTimes = restocked.map(({ alert, product }) => {
            const restockedAt = product.restockedAt ? product.restockedAt[alert.size] : undefined;
            return restockedAt ? new Date(restockedAt).getTime() : 0;
        });
        const baseTime = Math.max(openedAt, ...restockTimes);
        const delay = Math.max(0, baseTime + POPUP_DELAY - Date.now());

        const timer = setTimeout(() => {
            setPopupItems(restocked.map(({ alert, product }) => ({
                productId: alert.productId,
                size: alert.size,
                name: product.name,
                image: product.image
            })));

            markNotified(restocked.map(({ alert }) => ({ productId: alert.productId, size: alert.size })));
        }, delay);

        // 화면을 떠나거나 신청 내용이 바뀌면 기다리던 팝업을 정리한다
        return () => clearTimeout(timer);

    // 신청 목록이나 의류(재고)가 바뀔 때마다 다시 계산한다
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [alerts, products, openedAt]);

    if (popupItems.length === 0) {
        return null;
    }

    return (
        <div className={styles.popup} role="dialog" aria-label="재입고 알림">
            <div className={styles.head}>
                <p className={styles.title}>재입고 알림</p>
                <button
                    type="button"
                    className={styles.closeButton}
                    onClick={() => setPopupItems([])}
                    aria-label="닫기"
                >
                    ×
                </button>
            </div>

            <p className={styles.message}>신청하신 의류가 재입고되었습니다.</p>

            <ul className={styles.list}>
                {popupItems.map(item =>
                    <li key={`${item.productId}-${item.size}`} className={styles.item}>
                        <img src={item.image} alt="" className={styles.image} loading="lazy" decoding="async" />

                        <div className={styles.info}>
                            <p className={styles.name}>{item.name}</p>
                            <p className={styles.size}>{item.size} 사이즈</p>
                        </div>

                        <Link
                            to={`/products/${item.productId}`}
                            className={styles.link}
                            onClick={() => setPopupItems([])}
                        >
                            보러 가기
                        </Link>
                    </li>
                )}
            </ul>
        </div>
    );
}

export default RestockPopup;
