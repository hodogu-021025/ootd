// localStorage 읽기·쓰기 도우미 (F-14 저장 데이터 복원)

// 저장된 값을 읽어 구조까지 확인한다
// { value, broken } - broken이 true면 읽기·변환·구조 검사에 실패한 것이다
// 저장된 값이 아예 없는 경우(처음 접속)는 실패가 아니라 value가 null이다
export function readStorage(key, isValidValue) {
    try {
        const raw = window.localStorage.getItem(key);

        if (raw === null) {
            return { value: null, broken: false };
        }

        const parsed = JSON.parse(raw);

        if (!isValidValue(parsed)) {
            return { value: null, broken: true };
        }

        return { value: parsed, broken: false };
    } catch {
        // 읽기나 JSON 변환에 실패해도 저장된 원본은 지우지 않는다
        return { value: null, broken: true };
    }
}

// 저장에 성공하면 true, 실패하면 false를 돌려준다
export function writeStorage(key, value) {
    try {
        window.localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch {
        return false;
    }
}

// 사용자가 초기화를 선택했을 때만 저장된 값을 지운다
export function clearStorage(key) {
    try {
        window.localStorage.removeItem(key);
        return true;
    } catch {
        return false;
    }
}

// 여러 저장 값을 한 번에 저장한다 (F-12: 주문 저장·장바구니 정리·재고 차감을 함께 반영한다)
// entries: [{ key, value }]. 하나라도 실패하면 이미 쓴 값을 되돌리고 false를 돌려준다
export function writeStorageAll(entries) {
    const backups = [];

    try {
        entries.forEach(entry => {
            // 되돌릴 수 있도록 지금 저장된 값을 먼저 기억한다
            backups.push({ key: entry.key, raw: window.localStorage.getItem(entry.key) });
            window.localStorage.setItem(entry.key, JSON.stringify(entry.value));
        });

        return true;
    } catch {
        backups.forEach(backup => {
            try {
                if (backup.raw === null) {
                    window.localStorage.removeItem(backup.key);
                } else {
                    window.localStorage.setItem(backup.key, backup.raw);
                }
            } catch {
                // 되돌리기까지 실패하면 더 할 수 있는 일이 없다
            }
        });

        return false;
    }
}
