import { useWishlist } from '../context/WishlistContext';
import styles from './LikeButton.module.css';

// 의류 좋아요(찜) 하트 버튼: 누르면 등록·해제한다 (F-16)
// productId: 의류 ID, variant: 'card'(상품 사진 위 작은 원형) 또는 'detail'(상세 화면의 네모 버튼)
function LikeButton({ productId, variant = 'card' }) {

    const { isLiked, toggleLike } = useWishlist();
    const liked = isLiked(productId);

    return (
        <button
            type="button"
            className={`${styles.button} ${styles[variant]}`}
            onClick={() => toggleLike(productId)}
            aria-pressed={liked}
            aria-label={liked ? '좋아요 해제' : '좋아요'}
        >
            <svg
                className={liked ? `${styles.heart} ${styles.heartLiked}` : styles.heart}
                viewBox="0 0 24 24"
                aria-hidden="true"
            >
                <path d="M12 21s-7.5-4.7-9.4-9A5.2 5.2 0 0 1 12 6.2 5.2 5.2 0 0 1 21.4 12c-1.9 4.3-9.4 9-9.4 9z" />
            </svg>
        </button>
    );
}

export default LikeButton;
