import { useCart } from '../context/CartContext';
import { useOrders } from '../context/OrdersContext';
import { useWishlist } from '../context/WishlistContext';
import { useProducts } from '../context/ProductsContext';
import { useRestockAlerts } from '../context/RestockAlertsContext';
import styles from './StorageNotice.module.css';

// 저장된 데이터를 읽지 못했을 때 모든 화면 위에 띄우는 안내 (F-14)
// 원본은 지우지 않고, 사용자가 초기화를 선택해 확인해야만 지운다
function StorageNotice() {

    const cart = useCart();
    const orders = useOrders();
    const wishlist = useWishlist();
    const products = useProducts();
    const restockAlerts = useRestockAlerts();

    // 읽지 못한 저장 데이터의 이름과 초기화 방법을 모은다
    const broken = [
        { name: '장바구니', broken: cart.storageBroken, reset: cart.resetStorage },
        { name: '주문 내역', broken: orders.storageBroken, reset: orders.resetStorage },
        { name: '좋아요 목록', broken: wishlist.storageBroken, reset: wishlist.resetStorage },
        { name: '의류 데이터', broken: products.storageBroken, reset: products.resetStorage },
        { name: '재입고 알림', broken: restockAlerts.storageBroken, reset: restockAlerts.resetStorage }
    ].filter(item => item.broken);

    if (broken.length === 0) {
        return null;
    }

    const names = broken.map(item => item.name).join('·');

    function handleReset() {
        if (!window.confirm(`저장된 ${names} 정보를 지우고 처음 상태로 시작할까요?`)) {
            return;
        }

        const failed = broken.filter(item => !item.reset());

        if (failed.length > 0) {
            window.alert('초기화에 실패했습니다. 다시 시도해 주세요.');
        }
    }

    return (
        <div className={styles.notice} role="alert">
            <p className={styles.text}>
                저장된 {names} 정보를 읽지 못했습니다. 내용이 손상되었을 수 있어 저장이 필요한 동작을 잠시 막아 두었습니다.
                초기화하면 저장된 {names} 정보를 지우고 처음 상태로 시작합니다.
            </p>
            <button type="button" className={styles.button} onClick={handleReset}>
                초기화
            </button>
        </div>
    );
}

export default StorageNotice;
