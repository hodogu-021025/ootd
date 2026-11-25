import { createContext, useContext, useState } from 'react';
import { getSalePrice, SHIPPING_FEE } from '../utils/price';
import { readStorage, writeStorage, clearStorage } from '../utils/storage';

const STORAGE_KEY = 'ootd_orders';

const OrdersContext = createContext(null);

// 저장된 주문 내역의 구조 검사: [{ id: 글자, orderedAt: 글자, items: 배열 }] 형태여야 한다
function isOrders(value) {
    return Array.isArray(value) && value.every(order =>
        order !== null
        && typeof order === 'object'
        && typeof order.id === 'string'
        && typeof order.orderedAt === 'string'
        && Array.isArray(order.items)
    );
}

function pad(value) {
    return String(value).padStart(2, '0');
}

// 2026-09-21 14:30 형태의 일시
function formatDateTime(date) {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

// 주문번호: 주문일(YYMMDD) + 그날 몇 번째 주문인지(8자리)를 이어 붙인다
function makeOrderId(existingOrders, now) {
    const datePart = `${pad(now.getFullYear() % 100)}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
    const todayCount = existingOrders.filter(order => order.id.startsWith(datePart)).length;

    return `${datePart}${String(todayCount + 1).padStart(8, '0')}`;
}

// 장바구니 항목과 배송 정보로 주문 한 건을 만든다
// 의류 정보는 주문 시점 값을 그대로 보관해, 이후 가격이 바뀌어도 과거 주문 금액은 다시 계산하지 않는다
function makeOrder(cartItems, shipping, existingOrders) {
    const now = new Date();

    const items = cartItems.map(item => {
        const salePrice = getSalePrice(item.product);

        return {
            productId: item.product.id,
            brand: item.product.brand,
            name: item.product.name,
            size: item.size,
            price: item.product.price,
            discountRate: item.product.discountRate,
            salePrice: salePrice,
            quantity: item.quantity,
            totalPrice: salePrice * item.quantity
        };
    });

    const itemsTotal = items.reduce((sum, item) => sum + item.totalPrice, 0);

    return {
        id: makeOrderId(existingOrders, now),
        orderedAt: formatDateTime(now),
        status: 'paid',
        items: items,
        shipping: shipping,
        shippingFee: SHIPPING_FEE,
        totalPrice: itemsTotal + SHIPPING_FEE
    };
}

// 주문 내역 저장·조회와, 주문서에서 주문 완료를 눌렀을 때 새 주문을 만드는 일을 관리한다
function OrdersProvider({ children }) {

    // 저장된 값을 읽어 온다. 읽지 못했으면 원본을 지우지 않고 빈 목록으로 보여 주며 저장을 막는다 (F-14)
    const [stored] = useState(() => readStorage(STORAGE_KEY, isOrders));
    const [orders, setOrders] = useState(stored.value || []);
    const [storageBroken, setStorageBroken] = useState(stored.broken);

    // F-12 주문: 새 주문을 만들어 저장 내용만 준비한다 (재고·장바구니와 함께 한 번에 저장한다)
    // cartItems: [{ product, size, quantity }], shipping: { name, phone, address }
    function prepareOrder(cartItems, shipping) {
        if (storageBroken) {
            return null;
        }

        const order = makeOrder(cartItems, shipping, orders);
        const next = [order, ...orders];

        return {
            order,
            entry: { key: STORAGE_KEY, value: next },
            apply: () => setOrders(next)
        };
    }

    // F-18 모의 주문 취소: 주문 전체를 취소 상태로 바꾸고 취소 일시를 기록한다
    // 주문 기록과 금액은 그대로 남기며, 장바구니로 의류를 되돌리지도 않는다
    // (재고 기능(F-27)을 구현하면 여기서 주문 수량만큼 재고를 되돌린다)
    function cancelOrder(orderId) {
        if (storageBroken) {
            return false;
        }

        const target = orders.find(order => order.id === orderId);

        // 이미 취소한 주문은 다시 취소하지 않는다
        if (!target || target.status !== 'paid') {
            return false;
        }

        const next = orders.map(order =>
            order.id === orderId
                ? { ...order, status: 'cancelled', cancelledAt: formatDateTime(new Date()) }
                : order
        );

        // 저장에 실패하면 기존 '주문 완료' 상태를 유지한다
        if (!writeStorage(STORAGE_KEY, next)) {
            return false;
        }

        setOrders(next);
        return true;
    }

    // F-14 초기화: 사용자가 선택하고 확인했을 때만 저장된 값을 지우고 빈 목록으로 시작한다
    function resetStorage() {
        if (!clearStorage(STORAGE_KEY)) {
            return false;
        }

        setOrders([]);
        setStorageBroken(false);
        return true;
    }

    const value = { orders, storageBroken, prepareOrder, cancelOrder, resetStorage };

    return <OrdersContext.Provider value={value}>{children}</OrdersContext.Provider>;
}

// 컴포넌트에서 주문 내역·기능을 꺼내 쓰기 위한 훅
function useOrders() {
    const context = useContext(OrdersContext);

    if (!context) {
        throw new Error('useOrders는 OrdersProvider 안에서만 쓸 수 있습니다.');
    }

    return context;
}

export { OrdersProvider, useOrders };
