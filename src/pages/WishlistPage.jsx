import { Link } from 'react-router-dom';
import Breadcrumb from '../components/Breadcrumb';
import ProductCard from '../components/ProductCard';
import { useWishlist } from '../context/WishlistContext';
import { useProducts } from '../context/ProductsContext';
import styles from './WishlistPage.module.css';

// S-08 좋아요 목록: 좋아요한 의류를 등록한 순서대로 보여 준다 (F-16)
function WishlistPage() {

    const { likedIds, toggleLike } = useWishlist();
    const { getProduct } = useProducts();

    // 좋아요한 ID마다 현재 의류 정보를 찾는다 (삭제된 의류는 product가 없다)
    const items = likedIds.map(id => ({
        id,
        product: getProduct(id)
    }));

    return (
        <div className="container">
            <Breadcrumb items={[{ label: 'HOME', to: '/' }, { label: 'LISTS', to: '/lists' }, { label: '좋아요 목록' }]} />

            <h2 className={styles.title}>
                좋아요 목록 <span className={styles.count}>{items.length}</span>
            </h2>

            {items.length > 0
                ? (
                    <div className={styles.grid}>
                        {items.map(item =>
                            item.product
                                ? <ProductCard key={item.id} product={item.product} />
                                : (
                                    // 의류 데이터에 없는 의류(삭제된 의류): 정보 없음 + 해제 버튼
                                    <div key={item.id} className={styles.missing}>
                                        <div className={styles.missingBox}>정보 없음</div>
                                        <button
                                            type="button"
                                            className={styles.removeButton}
                                            onClick={() => toggleLike(item.id)}
                                        >
                                            좋아요 해제
                                        </button>
                                    </div>
                                )
                        )}
                    </div>
                )
                : (
                    <div className={styles.empty}>
                        <p>좋아요한 의류가 없습니다.</p>
                        <Link to="/products" className={styles.outlineButton}>의류 보러 가기</Link>
                    </div>
                )
            }
        </div>
    );
}

export default WishlistPage;
