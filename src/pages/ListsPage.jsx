import { useState } from 'react';
import { Link } from 'react-router-dom';
import Breadcrumb from '../components/Breadcrumb';
import PriceTag from '../components/PriceTag';
import ootdLogo from '../image/ootd_logo.webp';
import { useProducts } from '../context/ProductsContext';
import { useRestockAlerts } from '../context/RestockAlertsContext';
import { useWishlist } from '../context/WishlistContext';
import styles from './ListsPage.module.css';

// 미리 보기 한 쪽에 보여 줄 의류 수
const PREVIEW_SIZE = 3;

// 카드 아래에서 등록한 의류를 세 개씩 넘겨 본다 (‹ 이전 · 다음 ›)
// items: [{ key, product, image, name, to, meta }], emptyText: 등록한 의류가 없을 때 보여 줄 문구
function ListPreview({ items, emptyText }) {

    const [page, setPage] = useState(1);

    const totalPages = Math.max(1, Math.ceil(items.length / PREVIEW_SIZE));
    // 목록이 줄어들어 쪽 번호가 범위를 넘으면 마지막 쪽을 보여 준다
    const currentPage = Math.min(page, totalPages);
    const shown = items.slice((currentPage - 1) * PREVIEW_SIZE, currentPage * PREVIEW_SIZE);
    // 남는 자리는 빈 카드로 채워 두 목록 카드의 높이를 맞춘다
    const blankCount = PREVIEW_SIZE - shown.length;

    return (
        <div className={styles.preview}>
            <div className={styles.previewRow}>
                <button
                    type="button"
                    className={styles.moveButton}
                    onClick={() => setPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    aria-label="이전 의류"
                >
                    ‹
                </button>

                <div className={styles.items}>
                    {shown.map(item =>
                        <div key={item.key} className={styles.item}>
                            <div className={styles.itemImageBox}>
                                {item.image && <img src={item.image} alt="" className={styles.itemImage} />}
                            </div>

                            <p className={styles.itemBrand}>{item.product ? item.product.brand : ''}</p>

                            <p className={styles.itemName}>
                                {item.to
                                    ? <Link to={item.to}>{item.name}</Link>
                                    : item.name
                                }
                            </p>

                            <div className={styles.itemPrice}>
                                {item.product && <PriceTag product={item.product} />}
                            </div>

                            <p className={styles.itemMeta}>{item.meta}</p>
                        </div>
                    )}

                    {/* 빈 카드: 의류 카드와 같은 자리를 비워 두어 두 목록의 높이를 맞춘다 */}
                    {Array.from({ length: blankCount }, (_, index) =>
                        <div key={`blank-${index}`} className={styles.itemBlank} aria-hidden="true">
                            <img src={ootdLogo} alt="" className={styles.blankLogo} />
                            <div className={styles.itemImageBox}></div>
                            <p className={styles.itemBrand}></p>
                            <p className={styles.itemName}></p>
                            <div className={styles.itemPrice}></div>
                            <p className={styles.itemMeta}></p>
                        </div>
                    )}
                </div>

                <button
                    type="button"
                    className={styles.moveButton}
                    onClick={() => setPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    aria-label="다음 의류"
                >
                    ›
                </button>
            </div>

            <p className={styles.previewCount}>
                {items.length > 0
                    ? `${currentPage} / ${totalPages}`
                    : emptyText
                }
            </p>
        </div>
    );
}

// LISTS 페이지: 좋아요 목록·재입고 알림 목록으로 가는 입구와 등록한 의류 미리 보기
function ListsPage() {

    const { likedIds } = useWishlist();
    const { alerts } = useRestockAlerts();
    const { getProduct } = useProducts();

    // 좋아요 목록: 등록한 순서대로 (삭제된 의류는 product가 없다)
    const likedItems = likedIds.map(id => {
        const product = getProduct(id);

        return {
            key: String(id),
            product: product || null,
            image: product ? product.image : null,
            name: product ? product.name : '판매가 종료된 의류',
            to: product ? `/products/${id}` : null,
            meta: ''
        };
    });

    // 재입고 알림 목록: 최근에 신청한 것부터
    const alertItems = [...alerts].reverse().map(alert => {
        const product = getProduct(alert.productId);
        const stock = product ? product.stock[alert.size] || 0 : 0;
        const state = alert.notified
            ? '알림 받음'
            : (stock > 0 ? '재입고됨' : '재입고 기다리는 중');

        return {
            key: `${alert.productId}-${alert.size}-${alert.requestedAt}`,
            product: product || null,
            image: product ? product.image : null,
            name: product ? product.name : '판매가 종료된 의류',
            to: product ? `/products/${product.id}` : null,
            meta: `${alert.size} 사이즈 · ${state}`
        };
    });

    return (
        <div className="container">
            <Breadcrumb items={[{ label: 'HOME', to: '/' }, { label: 'LISTS' }]} />

            <h2 className={styles.title}>LISTS</h2>

            <div className={styles.cards}>
                <section className={styles.card}>
                    <Link to="/wishlist" className={styles.cardHeader}>
                        <span className={styles.cardTitle}>좋아요 목록 <span className={styles.cardCount}>{likedItems.length}</span></span>
                        <span className={styles.cardDescription}>좋아요를 누른 의류를 모아 봅니다.</span>
                        <span className={styles.cardArrow} aria-hidden="true">›</span>
                    </Link>

                    <ListPreview items={likedItems} emptyText="좋아요한 의류가 없습니다." />
                </section>

                <section className={styles.card}>
                    <Link to="/restock-alerts" className={styles.cardHeader}>
                        <span className={styles.cardTitle}>재입고 알림 목록 <span className={styles.cardCount}>{alertItems.length}</span></span>
                        <span className={styles.cardDescription}>재입고 알림을 신청한 의류를 확인합니다.</span>
                        <span className={styles.cardArrow} aria-hidden="true">›</span>
                    </Link>

                    <ListPreview items={alertItems} emptyText="신청한 재입고 알림이 없습니다." />
                </section>
            </div>
        </div>
    );
}

export default ListsPage;
