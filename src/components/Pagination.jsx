import styles from './Pagination.module.css';

// 페이지 번호 이동 (이전 · 번호 · 다음)
// currentPage: 현재 페이지, totalPages: 전체 페이지 수, onPageChange: 페이지를 바꿀 때 부모에게 알린다
function Pagination({ currentPage, totalPages, onPageChange }) {

    // 1, 2, 3 ... totalPages
    const pageNumbers = Array.from({ length: totalPages }, (_, index) => index + 1);

    return (
        <nav className={styles.pagination} aria-label="페이지">
            <button
                type="button"
                className={styles.moveButton}
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
            >
                이전
            </button>

            {pageNumbers.map(page =>
                <button
                    key={page}
                    type="button"
                    className={page === currentPage ? `${styles.pageButton} ${styles.current}` : styles.pageButton}
                    onClick={() => onPageChange(page)}
                    aria-current={page === currentPage ? 'page' : undefined}
                >
                    {page}
                </button>
            )}

            <button
                type="button"
                className={styles.moveButton}
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
            >
                다음
            </button>
        </nav>
    );
}

export default Pagination;
