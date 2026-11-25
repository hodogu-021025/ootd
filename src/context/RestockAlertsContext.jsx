import { createContext, useContext, useState } from 'react';
import { readStorage, writeStorage, clearStorage } from '../utils/storage';

const STORAGE_KEY = 'ootd_restock_alerts';

const RestockAlertsContext = createContext(null);

// 저장된 재입고 알림 신청의 구조 검사
// [{ productId: 숫자, size: 글자, requestedAt: 글자, notified: 참/거짓 }]
function isAlerts(value) {
    return Array.isArray(value) && value.every(alert =>
        alert !== null
        && typeof alert === 'object'
        && Number.isInteger(alert.productId)
        && typeof alert.size === 'string'
        && typeof alert.requestedAt === 'string'
        && typeof alert.notified === 'boolean'
    );
}

function pad(value) {
    return String(value).padStart(2, '0');
}

function formatDateTime(date) {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

// 재입고 알림 신청을 관리한다 (F-28)
// notified가 false면 아직 팝업으로 알리지 않은 신청이다
function RestockAlertsProvider({ children }) {

    const [stored] = useState(() => readStorage(STORAGE_KEY, isAlerts));
    const [alerts, setAlerts] = useState(stored.value || []);
    const [storageBroken, setStorageBroken] = useState(stored.broken);

    // 먼저 저장해 보고, 성공했을 때만 화면의 신청 목록을 바꾼다
    function saveAlerts(next) {
        if (storageBroken || !writeStorage(STORAGE_KEY, next)) {
            return false;
        }

        setAlerts(next);
        return true;
    }

    // 아직 알리지 않은 신청이 있는지 (같은 의류·같은 사이즈는 하나만 만든다)
    function isRequested(productId, size) {
        return alerts.some(alert => alert.productId === productId && alert.size === size && !alert.notified);
    }

    // F-28 재입고 알림 신청
    function requestAlert(productId, size) {
        if (isRequested(productId, size)) {
            return true;
        }

        return saveAlerts([...alerts, {
            productId,
            size,
            requestedAt: formatDateTime(new Date()),
            notified: false
        }]);
    }

    // 신청 취소 (재입고 알림 목록에서 지울 때)
    function removeAlert(productId, size) {
        return saveAlerts(alerts.filter(alert => !(alert.productId === productId && alert.size === size && !alert.notified)));
    }

    // F-29 팝업으로 알린 신청은 '표시함'으로 바꿔 다시 띄우지 않는다
    // targets: [{ productId, size }]
    function markNotified(targets) {
        return saveAlerts(alerts.map(alert =>
            targets.some(target => target.productId === alert.productId && target.size === alert.size)
                ? { ...alert, notified: true }
                : alert
        ));
    }

    // F-14 초기화
    function resetStorage() {
        if (!clearStorage(STORAGE_KEY)) {
            return false;
        }

        setAlerts([]);
        setStorageBroken(false);
        return true;
    }

    const value = { alerts, storageBroken, isRequested, requestAlert, removeAlert, markNotified, resetStorage };

    return <RestockAlertsContext.Provider value={value}>{children}</RestockAlertsContext.Provider>;
}

// 컴포넌트에서 재입고 알림 신청을 꺼내 쓰기 위한 훅
function useRestockAlerts() {
    const context = useContext(RestockAlertsContext);

    if (!context) {
        throw new Error('useRestockAlerts는 RestockAlertsProvider 안에서만 쓸 수 있습니다.');
    }

    return context;
}

export { RestockAlertsProvider, useRestockAlerts };
