import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import Pagination from '../components/Pagination';
import ColumnMenu from '../components/ColumnMenu';
import { useProducts, LOW_STOCK_LIMIT } from '../context/ProductsContext';
import { genderLabels } from '../mocks/products';
import { getSalePrice } from '../utils/price';
import styles from './AdminPage.module.css';

// 관리자 목록의 성별 탭
const GENDER_TABS = [
    { value: '', label: 'ALL' },
    { value: 'men', label: 'MEN' },
    { value: 'women', label: 'WOMEN' },
    { value: 'unisex', label: 'UNISEX' }
];

// 한 페이지에 보여 줄 의류 수
const PAGE_SIZE = 10;

// 칸 제목을 눌렀을 때 나오는 항목
const DATE_OPTIONS = [
    { value: '', label: '기본' },
    { value: 'createdAt-desc', label: '최신순' },
    { value: 'createdAt-asc', label: '오래된순' }
];

const PRICE_OPTIONS = [
    { value: '', label: '기본' },
    { value: 'price-asc', label: '최저가' },
    { value: 'price-desc', label: '최고가' }
];

const STOCK_OPTIONS = [
    { value: '', label: '기본' },
    { value: 'stock-asc', label: '재고 적은순' },
    { value: 'stock-desc', label: '재고 많은순' }
];

const STATE_OPTIONS = [
    { value: '', label: '전체' },
    { value: '판매중', label: '판매중' },
    { value: '재고 부족', label: '재고 부족' },
    { value: '품절', label: '품절' }
];

// 칸 제목의 드롭다운에서 고르는 정렬 기준
const SORTS = {
    'createdAt-desc': (a, b) => b.createdAt.localeCompare(a.createdAt) || b.id - a.id,
    'createdAt-asc': (a, b) => a.createdAt.localeCompare(b.createdAt) || a.id - b.id,
    'price-asc': (a, b) => getSalePrice(a) - getSalePrice(b) || a.id - b.id,
    'price-desc': (a, b) => getSalePrice(b) - getSalePrice(a) || a.id - b.id,
    'stock-asc': (a, b) => totalStock(a) - totalStock(b) || a.id - b.id,
    'stock-desc': (a, b) => totalStock(b) - totalStock(a) || a.id - b.id
};

// 사이즈별 재고를 모두 더한 수량
function totalStock(product) {
    return product.sizes.reduce((sum, size) => sum + (product.stock[size] || 0), 0);
}

// 재고 상태 (F-27 기준): 모두 0이면 품절, 1~3개인 사이즈가 있으면 재고 부족, 그 밖에는 판매중
function getStockState(product) {
    const counts = product.sizes.map(size => product.stock[size] || 0);

    if (counts.every(count => count === 0)) {
        return '품절';
    }

    return counts.some(count => count > 0 && count <= LOW_STOCK_LIMIT) ? '재고 부족' : '판매중';
}

// S-09 관리자 의류 관리 (F-23·F-24)
// 로그인 없이 주소로 들어오는 화면이다
function AdminPage() {

    const { products, deleteProduct } = useProducts();

    const [gender, setGender] = useState('');
    // 칸 제목에서 고르는 조건 (검색어·상태·정렬)
    const [keyword, setKeyword] = useState('');
    const [stockState, setStockState] = useState('');
    const [sort, setSort] = useState('');
    // 상품명 검색창을 열어 두었는지 (돋보기로 열고 닫는다)
    const [searchOpen, setSearchOpen] = useState(false);
    const [page, setPage] = useState(1);

    const searchRef = useRef(null);

    let filtered = gender ? products.filter(product => product.gender === gender) : products;

    // 상품명 검색 (영문 대소문자는 구분하지 않는다)
    if (keyword.trim() !== '') {
        const lowerKeyword = keyword.trim().toLowerCase();
        filtered = filtered.filter(product => product.name.toLowerCase().includes(lowerKeyword));
    }

    // 상태로 걸러낸다
    if (stockState !== '') {
        filtered = filtered.filter(product => getStockState(product) === stockState);
    }

    // 고른 정렬이 없으면 최근에 등록한 의류(번호가 큰 의류)가 위로 온다
    const sorted = [...filtered].sort(SORTS[sort] || ((a, b) => b.id - a.id));

    const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
    const currentPage = Math.min(page, totalPages);
    const pageProducts = sorted.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

    function handleGenderClick(nextGender) {
        setGender(nextGender);
        setPage(1);
    }

    // 칸 제목의 검색어·상태·정렬을 바꾸면 1페이지부터 다시 본다
    function handleKeywordChange(value) {
        setKeyword(value);
        setPage(1);
    }

    function handleStateChange(value) {
        setStockState(value);
        setPage(1);
    }

    // 정렬은 한 번에 한 칸만 적용한다 (다른 칸에서 고르면 그 기준으로 바뀐다)
    function handleSortChange(value) {
        setSort(value);
        setPage(1);
    }

    // 이 칸에서 고른 정렬 값 (다른 칸의 정렬이면 빈 값으로 둔다)
    function sortValueOf(prefix) {
        return sort.startsWith(prefix) ? sort : '';
    }

    // 돋보기: 검색창을 열거나 닫는다 (닫을 때는 검색어도 지운다)
    function toggleSearch() {
        if (searchOpen) {
            setSearchOpen(false);
            handleKeywordChange('');
            return;
        }

        setSearchOpen(true);
        // 화면에 나온 뒤 커서를 넣는다
        setTimeout(() => searchRef.current?.focus(), 0);
    }

    // F-24 삭제: 확인 창에서 확인했을 때만 지운다
    function handleDelete(product) {
        if (!window.confirm(`‘${product.name}’을(를) 삭제할까요? 삭제한 의류는 목록과 검색에서 사라집니다.`)) {
            return;
        }

        if (!deleteProduct(product.id)) {
            window.alert('삭제에 실패했습니다. 다시 시도해 주세요.');
        }
    }

    return (
        <div className="container">
            <div className={styles.head}>
                <h2 className={styles.title}>관리자 페이지</h2>
                <p className={styles.description}>의류 등록·수정·삭제와 재고 관리를 합니다.</p>
            </div>

            <div className={styles.layout}>
                {/* 좌측 메뉴 */}
                <aside className={styles.menu}>
                    <span className={`${styles.menuButton} ${styles.menuCurrent}`}>상품 리스트</span>
                    <Link to="/admin/new" className={styles.menuButton}>상품 추가</Link>
                </aside>

                <div>
                    {/* 성별 탭 */}
                    <div className={styles.tabs}>
                        {GENDER_TABS.map(tab =>
                            <button
                                key={tab.label}
                                type="button"
                                className={tab.value === gender ? `${styles.tab} ${styles.tabActive}` : styles.tab}
                                onClick={() => handleGenderClick(tab.value)}
                                aria-pressed={tab.value === gender}
                            >
                                {tab.label}
                            </button>
                        )}
                        <span className={styles.count}>{sorted.length}개</span>
                    </div>

                    {/* 상품명 칸의 돋보기로 열고 닫는 검색 바
                        (열고 닫을 때 표가 밀리지 않도록 자리는 늘 비워 둔다) */}
                    <div className={searchOpen ? styles.searchBar : `${styles.searchBar} ${styles.searchHidden}`}>
                            <input
                                ref={searchRef}
                                type="text"
                                className={styles.searchInput}
                                value={keyword}
                                tabIndex={searchOpen ? 0 : -1}
                                onChange={event => handleKeywordChange(event.target.value)}
                                placeholder="상품명으로 검색"
                                aria-label="상품명 검색"
                            />
                            <button type="button" className={styles.searchClose} onClick={toggleSearch}>
                                검색 닫기
                            </button>
                        </div>

                    {/* 결과가 없어도 칸 제목(검색·정렬·상태)은 계속 쓸 수 있도록 표를 늘 그린다 */}
                    {/* 좁은 화면에서는 표를 가로로 밀어 본다(칸이 많아 줄이면 글자가 한 자씩 꺾인다) */}
                    <div className={styles.tableWrap}>
                    <table className={styles.table}>
                    <thead>
                        <tr>
                            <th scope="col">사진</th>
                            <th scope="col">
                                <div className={styles.columnHead}>
                                    <span>상품명</span>
                                    <button
                                        type="button"
                                        className={styles.searchButton}
                                        onClick={toggleSearch}
                                        aria-label={searchOpen ? '상품명 검색창 닫기' : '상품명 검색창 열기'}
                                        aria-expanded={searchOpen}
                                    >
                                        <svg className={styles.searchIcon} viewBox="0 0 24 24" aria-hidden="true">
                                            <circle cx="10.5" cy="10.5" r="6.5" />
                                            <path d="M15.5 15.5 L21 21" />
                                        </svg>
                                    </button>
                                </div>
                                {keyword.trim() !== '' && (
                                    <span className={styles.columnCurrent}>‘{keyword.trim()}’ 검색 중</span>
                                )}
                            </th>
                            <th scope="col">
                                <ColumnMenu
                                    title="등록일"
                                    options={DATE_OPTIONS}
                                    value={sortValueOf('createdAt')}
                                    onSelect={handleSortChange}
                                />
                            </th>
                            <th scope="col">
                                <ColumnMenu
                                    title="가격"
                                    options={PRICE_OPTIONS}
                                    value={sortValueOf('price')}
                                    onSelect={handleSortChange}
                                />
                            </th>
                            <th scope="col">
                                <ColumnMenu
                                    title="사이즈별 재고"
                                    options={STOCK_OPTIONS}
                                    value={sortValueOf('stock')}
                                    onSelect={handleSortChange}
                                />
                            </th>
                            <th scope="col">
                                <ColumnMenu
                                    title="상태"
                                    options={STATE_OPTIONS}
                                    value={stockState}
                                    onSelect={handleStateChange}
                                />
                            </th>
                            <th scope="col">관리</th>
                        </tr>
                    </thead>
                    <tbody>
                        {pageProducts.map(product =>
                            <tr key={product.id}>
                                <td>
                                    <img src={product.image} alt="" className={styles.image} loading="lazy" decoding="async" />
                                </td>
                                <td>
                                    <p className={styles.productBrand}>{product.brand}</p>
                                    <p className={styles.productName}>{product.name}</p>
                                    <p className={styles.productCategory}>
                                        {genderLabels[product.gender]} · {product.category} › {product.group} › {product.item}
                                    </p>
                                </td>
                                <td className={styles.date}>{product.createdAt || '-'}</td>
                                <td className={styles.price}>
                                    {getSalePrice(product).toLocaleString()}원
                                    {product.discountRate > 0 && (
                                        <span className={styles.discount}>{product.discountRate}% 할인</span>
                                    )}
                                </td>
                                <td>
                                    <ul className={styles.stockList}>
                                        {product.sizes.map(size =>
                                            <li key={size} className={(product.stock[size] || 0) === 0 ? `${styles.stockItem} ${styles.stockEmpty}` : styles.stockItem}>
                                                <span className={styles.stockSize}>{size}</span>
                                                <span>{product.stock[size] || 0}</span>
                                            </li>
                                        )}
                                    </ul>
                                </td>
                                <td className={styles.state}>{getStockState(product)}</td>
                                <td>
                                    <div className={styles.actions}>
                                        <Link to={`/products/${product.id}`} className={styles.actionButton}>조회</Link>
                                        <Link to={`/admin/${product.id}/edit`} className={styles.actionButton}>수정</Link>
                                        <button
                                            type="button"
                                            className={styles.actionButton}
                                            onClick={() => handleDelete(product)}
                                        >
                                            삭제
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        )}
                            {sorted.length === 0 && (
                                <tr>
                                    <td colSpan="7" className={styles.empty}>
                                        {keyword.trim() !== '' || stockState !== '' ? '조건에 맞는 제품이 없습니다.' : '등록된 제품이 없습니다.'}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                    </div>

                    {sorted.length > PAGE_SIZE && (
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={setPage}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}

export default AdminPage;
