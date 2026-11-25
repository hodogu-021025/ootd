import { useState, useEffect, useRef } from 'react';
import styles from './ColumnMenu.module.css';

// 표의 칸 제목 자체를 누르면 펼쳐지는 드롭다운 (관리자 목록의 정렬·상태 고르기)
// title: 칸 이름, options: [{ value, label }], value: 고른 값(''이면 기본), onSelect: 골랐을 때
function ColumnMenu({ title, options, value, onSelect }) {

    const [open, setOpen] = useState(false);
    const menuRef = useRef(null);

    // 열려 있는 동안 메뉴 바깥을 누르거나 Esc를 누르면 닫는다
    useEffect(() => {
        if (!open) return;

        function handleMouseDown(event) {
            if (!menuRef.current.contains(event.target)) {
                setOpen(false);
            }
        }

        function handleKeyDown(event) {
            if (event.key === 'Escape') {
                setOpen(false);
            }
        }

        document.addEventListener('mousedown', handleMouseDown);
        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('mousedown', handleMouseDown);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [open]);

    function handleSelect(nextValue) {
        onSelect(nextValue);
        setOpen(false);
    }

    // 기본값이 아닐 때만 칸 제목 아래에 무엇을 골랐는지 보여 준다
    const current = value ? options.find(option => option.value === value) : undefined;

    return (
        <div ref={menuRef} className={styles.menu}>
            <button
                type="button"
                className={value ? `${styles.titleButton} ${styles.titleActive}` : styles.titleButton}
                onClick={() => setOpen(!open)}
                aria-expanded={open}
            >
                <span className={styles.titleText}>{title}</span>
                <span className={open ? `${styles.caret} ${styles.caretOpen}` : styles.caret} aria-hidden="true">▾</span>
            </button>

            {current && <span className={styles.current}>{current.label}</span>}

            {open && (
                <ul className={styles.dropdown}>
                    {options.map(option => {
                        const isCurrent = option.value === value;

                        return (
                            <li key={option.value || 'default'}>
                                <button
                                    type="button"
                                    className={isCurrent ? `${styles.option} ${styles.optionCurrent}` : styles.option}
                                    onClick={() => handleSelect(option.value)}
                                    aria-pressed={isCurrent}
                                >
                                    {option.label}
                                    {isCurrent && <span className={styles.check} aria-hidden="true">✓</span>}
                                </button>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}

export default ColumnMenu;
