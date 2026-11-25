import { createContext, useContext, useState } from 'react';
import { readStorage, writeStorage, clearStorage } from '../utils/storage';
import { useProducts } from './ProductsContext';

const STORAGE_KEY = 'ootd_cart';

// 한 항목(의류 + 사이즈)의 수량 범위
export const MIN_QUANTITY = 1;
export const MAX_QUANTITY = 99;

const CartContext = createContext(null);

function isValidQuantity(quantity) {
    return Number.isInteger(quantity) && quantity >= MIN_QUANTITY && quantity <= MAX_QUANTITY;
}

// 저장된 장바구니의 구조 검사: [{ productId: 숫자, size: 글자, quantity: 1~99 }] 형태여야 한다
function isCartLines(value) {
    return Array.isArray(value) && value.every(line =>
        line !== null
        && typeof line === 'object'
        && Number.isInteger(line.productId)
        && typeof line.size === 'string'
        && isValidQuantity(line.quantity)
    );
}

// 저장된 장바구니 줄(의류 ID·사이즈·수량)에 현재 의류 정보를 붙인다
// 의류가 삭제되었거나 그 사이즈가 없어졌으면 구매 불가 항목이다 (02 기능 명세서 '구매 불가 항목')
function attachProduct(line, findProduct) {
    const product = findProduct(line.productId) || null;
    const available = product !== null && product.sizes.includes(line.size);

    return { ...line, product, available };
}

// 장바구니 담기·수량 변경·삭제를 한 곳에서 관리한다
function CartProvider({ children }) {

    const { getProduct } = useProducts();

    // 저장된 값을 읽어 온다. 읽지 못했으면 원본을 지우지 않고 빈 장바구니로 보여 주며 저장을 막는다 (F-14)
    const [stored] = useState(() => readStorage(STORAGE_KEY, isCartLines));
    const [lines, setLines] = useState(stored.value || []);
    const [storageBroken, setStorageBroken] = useState(stored.broken);
    const [error, setError] = useState('');

    // 먼저 저장해 보고, 저장에 성공했을 때만 화면의 장바구니를 바꾼다
    // (저장 실패 시 기존 장바구니를 유지한다: F-08·F-09 예외 처리)
    function saveLines(next) {
        if (storageBroken) {
            setError('저장된 장바구니 정보를 읽지 못해 변경할 수 없습니다. 위 안내에서 초기화를 먼저 선택하세요.');
            return false;
        }

        if (!writeStorage(STORAGE_KEY, next)) {
            setError('장바구니 저장에 실패했습니다. 다시 시도하세요.');
            return false;
        }

        setLines(next);
        setError('');
        return true;
    }

    // F-06 장바구니 담기: 같은 의류·같은 사이즈가 있으면 수량을 합산한다
    // 결과 안내 문구를 돌려주어 상세 화면에서 보여 준다
    function addItem(productId, size, quantity = 1) {
        if (storageBroken) {
            return { ok: false, message: '저장된 장바구니 정보를 읽지 못해 담을 수 없습니다.' };
        }

        const existing = lines.find(line => line.productId === productId && line.size === size);
        const nextQuantity = (existing ? existing.quantity : 0) + quantity;

        if (nextQuantity > MAX_QUANTITY) {
            return { ok: false, message: `한 상품은 최대 ${MAX_QUANTITY}개까지 담을 수 있습니다.` };
        }

        const next = existing
            ? lines.map(line => line === existing ? { ...line, quantity: nextQuantity } : line)
            : [...lines, { productId, size, quantity }];

        if (!saveLines(next)) {
            return { ok: false, message: '장바구니 저장에 실패했습니다. 다시 시도하세요.' };
        }

        return { ok: true, message: '장바구니에 담았습니다.' };
    }

    // F-08 수량 변경: 1~99의 정수만 확정한다
    function updateQuantity(productId, size, quantity) {
        if (!isValidQuantity(quantity)) {
            setError(`수량은 ${MIN_QUANTITY}~${MAX_QUANTITY}개 사이로 정할 수 있습니다.`);
            return;
        }

        saveLines(lines.map(line =>
            line.productId === productId && line.size === size ? { ...line, quantity } : line
        ));
    }

    // F-09 장바구니 삭제
    function removeItem(productId, size) {
        saveLines(lines.filter(line => !(line.productId === productId && line.size === size)));
    }

    // F-12 주문: 주문한 항목을 뺀 장바구니의 저장 내용만 준비한다 (주문·재고와 함께 한 번에 저장한다)
    function prepareRemoveItems(targets) {
        if (storageBroken) {
            return null;
        }

        const next = lines.filter(line =>
            !targets.some(target => target.productId === line.productId && target.size === line.size)
        );

        return {
            entry: { key: STORAGE_KEY, value: next },
            apply: () => {
                setLines(next);
                setError('');
            }
        };
    }

    // F-14 초기화: 사용자가 선택하고 확인했을 때만 저장된 값을 지우고 빈 장바구니로 시작한다
    function resetStorage() {
        if (!clearStorage(STORAGE_KEY)) {
            setError('장바구니 초기화에 실패했습니다. 다시 시도하세요.');
            return false;
        }

        setLines([]);
        setStorageBroken(false);
        setError('');
        return true;
    }

    const items = lines.map(line => attachProduct(line, getProduct));
    const count = items.reduce((sum, item) => sum + item.quantity, 0);

    const value = { items, count, error, storageBroken, addItem, updateQuantity, removeItem, prepareRemoveItems, resetStorage };

    return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

// 컴포넌트에서 장바구니 상태·기능을 꺼내 쓰기 위한 훅
function useCart() {
    const context = useContext(CartContext);

    if (!context) {
        throw new Error('useCart는 CartProvider 안에서만 쓸 수 있습니다.');
    }

    return context;
}

export { CartProvider, useCart };
