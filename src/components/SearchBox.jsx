import { useState, useRef } from 'react';
import styles from './SearchBox.module.css';

const STORAGE_KEY = 'ootd_recent_searches';

// 최근 검색어는 최대 10개까지 저장한다 (F-20)
const MAX_RECENT = 10;

// 저장해 둔 최근 검색어를 읽는다 (문자열 배열이 아니면 빈 목록으로 시작한다)
function readRecentSearches() {
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        const parsed = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) && parsed.every(item => typeof item === 'string') ? parsed : [];
    } catch {
        return [];
    }
}

// 성별 탭 오른쪽의 검색
// 돋보기를 누르면 입력창이 열리고, 다시 누르면 닫힌다. 검색은 Enter로 한다
// 입력창에 커서가 있으면 아래에 최근 검색어 목록을 보여 준다
// query: 적용된 검색어, onSearch: 검색을 실행할 때 부모에게 알린다
function SearchBox({ query, onSearch }) {

    // 입력 중인 검색어 (적용된 검색어 query와 따로 둔다)
    const [keyword, setKeyword] = useState(query);
    const [open, setOpen] = useState(query !== '');
    // 입력창이 다 펼쳐졌는지 여부: 펼쳐지는 움직임이 끝난 뒤에 최근 검색어를 보여 준다
    // (검색어가 있는 상태로 들어오면 처음부터 펼쳐져 있다)
    const [expanded, setExpanded] = useState(query !== '');
    // 입력창에 커서가 있는 동안만 최근 검색어 목록을 펼친다
    const [focused, setFocused] = useState(false);
    const [recentSearches, setRecentSearches] = useState(readRecentSearches);
    const inputRef = useRef(null);

    // 필터 변경 등으로 적용된 검색어가 바뀌면 입력창도 그 값으로 맞춘다
    const [prevQuery, setPrevQuery] = useState(query);
    if (query !== prevQuery) {
        setPrevQuery(query);
        setKeyword(query);
    }

    // 먼저 저장해 보고, 저장에 성공했을 때만 화면의 목록을 바꾼다 (실패하면 기존 목록 유지)
    function saveRecentSearches(next) {
        try {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch {
            return;
        }

        setRecentSearches(next);
    }

    // 검색어를 맨 앞에 넣는다. 같은 검색어(영문 대소문자 무시)는 지우고 앞으로 옮기며, 10개를 넘으면 오래된 것부터 지운다
    function addRecentSearch(term) {
        const lowerTerm = term.toLowerCase();
        const others = recentSearches.filter(item => item.toLowerCase() !== lowerTerm);

        saveRecentSearches([term, ...others].slice(0, MAX_RECENT));
    }

    // 검색 실행: 빈 검색어는 최근 검색어에 저장하지 않는다
    function runSearch(term) {
        const trimmed = term.trim();

        if (trimmed) {
            addRecentSearch(trimmed);
        }

        onSearch(trimmed);
    }

    // 입력창에서 Enter를 누르면 검색하고, 최근 검색어 목록을 닫는다
    function handleSubmit(event) {
        event.preventDefault();
        runSearch(keyword);
        inputRef.current.blur();
    }

    // 최근 검색어를 누르면 그 검색어로 다시 검색한다
    function handleRecentClick(term) {
        setKeyword(term);
        runSearch(term);
        inputRef.current.blur();
    }

    function handleRemove(term) {
        saveRecentSearches(recentSearches.filter(item => item !== term));
    }

    function handleClearAll() {
        saveRecentSearches([]);
    }

    // Esc를 누르면 최근 검색어 목록을 닫는다
    function handleKeyDown(event) {
        if (event.key === 'Escape') {
            inputRef.current.blur();
        }
    }

    // 돋보기: 닫혀 있으면 입력창을 열고, 열려 있으면 다시 넣는다 (적용된 검색 결과는 그대로 둔다)
    function handleToggle() {
        if (open) {
            setOpen(false);
            setExpanded(false);
            inputRef.current.blur();
            return;
        }

        setOpen(true);
        inputRef.current.focus();
    }

    // 입력창의 폭이 다 늘어나면 펼쳐진 것으로 본다
    function handleTransitionEnd(event) {
        if (event.propertyName === 'width' && open) {
            setExpanded(true);
        }
    }

    return (
        <form className={open ? `${styles.search} ${styles.searchOpen}` : styles.search} onSubmit={handleSubmit} role="search">
            <input
                ref={inputRef}
                type="text"
                className={styles.searchInput}
                value={keyword}
                onChange={event => setKeyword(event.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                onKeyDown={handleKeyDown}
                onTransitionEnd={handleTransitionEnd}
                placeholder="상품명·브랜드·종류 검색"
                aria-label="검색어"
                aria-expanded={expanded && focused}
                aria-controls="recent-searches"
                tabIndex={open ? 0 : -1}
            />
            <button
                type="button"
                className={styles.searchButton}
                onClick={handleToggle}
                aria-label={open ? '검색창 닫기' : '검색창 열기'}
                aria-expanded={open}
            >
                <svg className={styles.searchIcon} viewBox="0 0 24 24" aria-hidden="true">
                    <circle cx="10.5" cy="10.5" r="6.5" />
                    <path d="M15.5 15.5 L21 21" />
                </svg>
            </button>

            {/* 최근 검색어 목록: 입력창이 다 펼쳐진 다음 그 아래로 내려오며 나타난다
                목록 안을 눌러도 입력창의 커서가 빠지지 않게 해서, 누르는 도중에 목록이 닫히지 않게 한다 */}
            {open && expanded && focused && (
                <div
                    id="recent-searches"
                    className={styles.recent}
                    onMouseDown={event => event.preventDefault()}
                >
                    <div className={styles.recentHead}>
                        <span className={styles.recentTitle}>최근 검색어</span>
                        {recentSearches.length > 0 && (
                            <button type="button" className={styles.clearAll} onClick={handleClearAll}>
                                전체 삭제
                            </button>
                        )}
                    </div>

                    {recentSearches.length > 0
                        ? (
                            <ul className={styles.recentList}>
                                {recentSearches.map(term =>
                                    <li key={term} className={styles.recentItem}>
                                        <button
                                            type="button"
                                            className={styles.recentTerm}
                                            onClick={() => handleRecentClick(term)}
                                        >
                                            {term}
                                        </button>
                                        <button
                                            type="button"
                                            className={styles.removeButton}
                                            onClick={() => handleRemove(term)}
                                            aria-label={`${term} 삭제`}
                                        >
                                            ×
                                        </button>
                                    </li>
                                )}
                            </ul>
                        )
                        : <p className={styles.recentEmpty}>최근 검색어가 없습니다.</p>
                    }
                </div>
            )}
        </form>
    );
}

export default SearchBox;
