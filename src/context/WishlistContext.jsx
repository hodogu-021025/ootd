import { createContext, useContext, useState } from 'react';
import { readStorage, writeStorage, clearStorage } from '../utils/storage';

const STORAGE_KEY = 'ootd_wishlist';

const WishlistContext = createContext(null);

// 저장된 좋아요 목록의 구조 검사: 의류 ID(숫자) 배열이어야 한다
function isLikedIds(value) {
    return Array.isArray(value) && value.every(Number.isInteger);
}

// 좋아요(찜) 등록·해제를 한 곳에서 관리한다 (F-16)
// 사이즈와 관계없이 의류 단위로 등록하며, 같은 ID는 한 번만 들어간다
function WishlistProvider({ children }) {

    // 저장된 값을 읽어 온다. 읽지 못했으면 원본을 지우지 않고 빈 목록으로 보여 주며 저장을 막는다 (F-14)
    const [stored] = useState(() => readStorage(STORAGE_KEY, isLikedIds));
    const [likedIds, setLikedIds] = useState(stored.value || []);
    const [storageBroken, setStorageBroken] = useState(stored.broken);

    // 먼저 저장해 보고, 저장에 성공했을 때만 화면의 좋아요 상태를 바꾼다 (실패 시 기존 상태 유지)
    function saveIds(next) {
        if (storageBroken || !writeStorage(STORAGE_KEY, next)) {
            return false;
        }

        setLikedIds(next);
        return true;
    }

    // F-14 초기화: 사용자가 선택하고 확인했을 때만 저장된 값을 지우고 빈 목록으로 시작한다
    function resetStorage() {
        if (!clearStorage(STORAGE_KEY)) {
            return false;
        }

        setLikedIds([]);
        setStorageBroken(false);
        return true;
    }

    function isLiked(productId) {
        return likedIds.includes(productId);
    }

    // 등록되어 있으면 해제하고, 없으면 목록 끝에 등록한다
    function toggleLike(productId) {
        return isLiked(productId)
            ? saveIds(likedIds.filter(id => id !== productId))
            : saveIds([...likedIds, productId]);
    }

    const value = { likedIds, storageBroken, isLiked, toggleLike, resetStorage };

    return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

// 컴포넌트에서 좋아요 상태·기능을 꺼내 쓰기 위한 훅
function useWishlist() {
    const context = useContext(WishlistContext);

    if (!context) {
        throw new Error('useWishlist는 WishlistProvider 안에서만 쓸 수 있습니다.');
    }

    return context;
}

export { WishlistProvider, useWishlist };
