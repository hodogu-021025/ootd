import { useState, useEffect, useRef } from 'react';
import { SORT_OPTIONS } from '../utils/sort';
import styles from './SortMenu.module.css';

// 햄버거 버튼을 누르면 정렬 기준이 드롭다운으로 펼쳐진다
// sort: 현재 정렬 값(null이면 아직 고르지 않은 무작위 배치), onSortChange: 정렬 기준을 골랐을 때 호출
function SortMenu({ sort, onSortChange }) {

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

        // 닫히거나 화면을 떠날 때 이벤트 정리
        return () => {
            document.removeEventListener('mousedown', handleMouseDown);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [open]);

    function handleSelect(value) {
        onSortChange(value);
        setOpen(false);
    }

    const currentOption = SORT_OPTIONS.find(option => option.value === sort);
    const currentLabel = currentOption ? currentOption.label : '무작위';

    return (
        <div ref={menuRef} className={styles.sortMenu}>
            <button
                type="button"
                className={styles.menuButton}
                onClick={() => setOpen(!open)}
                aria-label={`정렬: ${currentLabel}`}
                aria-expanded={open}
                aria-controls="sort-menu"
            >
                <svg className={styles.menuIcon} viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M4 6 H20 M4 12 H20 M4 18 H20" />
                </svg>
            </button>

            {open && (
                <ul id="sort-menu" className={styles.dropdown}>
                    {SORT_OPTIONS.map(option => {
                        const isCurrent = option.value === sort;

                        return (
                            <li key={option.value}>
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

export default SortMenu;
