import { useState, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Breadcrumb from '../components/Breadcrumb';
import ProductCard from '../components/ProductCard';
import CategoryMenu from '../components/CategoryMenu';
import Pagination from '../components/Pagination';
import SearchBox from '../components/SearchBox';
import SortMenu from '../components/SortMenu';
import { genderLabels } from '../mocks/products';
import { useProducts } from '../context/ProductsContext';
import { menCategories, womenCategories, unisexCategories } from '../mocks/categories';
import { DEFAULT_SORT, toSortValue, sortProducts, makeRandomRank } from '../utils/sort';
import styles from './ProductListPage.module.css';

// CLOTHES 화면의 성별 탭 (여러 개를 함께 고를 수 있다)
const GENDER_TABS = [
    { gender: 'men', label: 'MENS' },
    { gender: 'women', label: 'WOMENS' },
    { gender: 'unisex', label: 'UNISEX' }
];

// 계절 필터에서 고를 수 있는 계절
// 의류의 착용 계절(봄·여름, 가을·겨울 등)에 그 계절이 들어 있으면 해당한다
// 사계절 의류는 '사계절'을 골랐을 때만 나온다 (여름을 골라도 사계절 의류는 나오지 않는다)
const SEASONS = ['봄', '여름', '가을', '겨울', '사계절'];

function matchesSeason(product, season) {
    return product.season.split('·').includes(season);
}

// 한 페이지에 보여 줄 의류 수 (가로 4 × 세로 3)
const PAGE_SIZE = 12;

// 성별별 카테고리
const CATEGORIES_BY_GENDER = {
    men: menCategories,
    women: womenCategories,
    unisex: unisexCategories
};

// 검색어가 상품명·의류 종류·브랜드 중 하나에 들어 있는지 확인한다 (F-02)
// 영문 대소문자는 구분하지 않는다. 의류 종류는 대분류·중분류·세부 항목을 모두 본다 (예: 상의, 니트, 반소매)
function matchesQuery(product, query) {
    const lowerQuery = query.toLowerCase();
    const fields = [product.name, product.brand, product.category, product.group, product.item];

    return fields.some(field => field.toLowerCase().includes(lowerQuery));
}

// S-02 의류 목록
function ProductListPage() {

    // /products?gender=men&category=상의&group=티셔츠&item=반소매 에서 값을 읽는다
    const { products: allProducts } = useProducts();
    const [searchParams, setSearchParams] = useSearchParams();
    const gender = searchParams.get('gender');
    const genderLabel = genderLabels[gender];
    const categories = CATEGORIES_BY_GENDER[gender];

    const selected = {
        category: searchParams.get('category'),
        group: searchParams.get('group'),
        item: searchParams.get('item')
    };

    // 선택한 브랜드: /products?gender=men&brand=디키즈 (없으면 전체 브랜드)
    const brand = searchParams.get('brand') || '';

    // 선택한 계절: /products?gender=men&season=여름 (없거나 잘못된 값이면 전체 계절)
    const seasonParam = searchParams.get('season');
    const season = SEASONS.includes(seasonParam) ? seasonParam : '';

    // 적용된 검색어: /products?gender=men&q=니트 (새로고침해도 유지, localStorage에는 저장하지 않는다)
    const query = searchParams.get('q') || '';

    // 정렬 기준: /products?gender=men&sort=price (없거나 잘못된 값이면 등록순)
    const sortParam = searchParams.get('sort');
    const sort = toSortValue(sortParam);

    // CLOTHES 화면에서 고른 성별 탭 (아무것도 고르지 않으면 전체)
    // 화면 안에서만 쓰는 일시적인 상태라 저장하지 않는다
    const [selectedGenders, setSelectedGenders] = useState([]);

    // 좁은 화면(휴대폰·태블릿)에서 카테고리 메뉴를 펼친 성별 페이지. 넓은 화면에서는 메뉴가 늘 보이므로 쓰지 않는다
    // 성별 값으로 기억해 두어, 다른 성별 페이지로 옮기면 메뉴는 접힌 채로 시작한다
    const [filterOpenFor, setFilterOpenFor] = useState(null);
    const filterOpen = filterOpenFor === gender;
    const setFilterOpen = open => setFilterOpenFor(open ? gender : null);

    // 성별이 없거나 잘못된 값이면 전체 의류 목록으로 본다
    const pageTitle = genderLabel || 'CLOTHES';

    // CLOTHES 화면: 정렬을 고르기 전에는 무작위로 배치하고, 페이지를 나누지 않고 모두 보여 준다
    const isClothesPage = !genderLabel;
    const isRandomOrder = isClothesPage && !sortParam;

    // 무작위 순서표: CLOTHES 화면에 들어올 때마다 새로 섞는다
    // (탭·검색으로 화면이 다시 그려질 때는 같은 순서를 유지한다)
    const [shuffle, setShuffle] = useState(() => ({ page: pageTitle, rank: makeRandomRank(allProducts) }));
    if (shuffle.page !== pageTitle) {
        setShuffle({ page: pageTitle, rank: makeRandomRank(allProducts) });
    }

    // 성별 페이지: 그 성별의 의류만
    // CLOTHES: 고른 성별의 의류만, 고른 탭이 없으면 전체
    let products = allProducts;

    if (genderLabel) {
        products = allProducts.filter(product => product.gender === gender);
    } else if (selectedGenders.length > 0) {
        products = allProducts.filter(product => selectedGenders.includes(product.gender));
    }

    // 브랜드 목록: 이 성별 의류에 있는 브랜드와 의류 수 (가나다순)
    const brandCounts = {};
    products.forEach(product => {
        brandCounts[product.brand] = (brandCounts[product.brand] || 0) + 1;
    });
    const brands = Object.keys(brandCounts)
        .sort((a, b) => a.localeCompare(b, 'ko'))
        .map(name => ({ name, count: brandCounts[name] }));

    // 계절 목록: 이 성별 의류 중 계절마다 해당하는 의류 수
    const seasons = SEASONS.map(name => ({
        name,
        count: products.filter(product => matchesSeason(product, name)).length
    }));

    // 브랜드를 골랐으면 그 브랜드 의류만 남긴다
    if (brand) {
        products = products.filter(product => product.brand === brand);
    }

    // 계절을 골랐으면 그 계절에 입는 의류만 남긴다
    if (season) {
        products = products.filter(product => matchesSeason(product, season));
    }

    // 카테고리를 골랐으면 고른 단계까지 일치하는 의류만 남긴다
    // (상의만 골랐으면 상의 전체, 상의 › 티셔츠까지 골랐으면 티셔츠만)
    if (selected.category) {
        products = products.filter(product =>
            product.category === selected.category
            && (!selected.group || product.group === selected.group)
            && (!selected.item || product.item === selected.item)
        );
    }

    // 검색어가 있으면 검색어가 들어 있는 의류만 남긴다
    if (query) {
        products = products.filter(product => matchesQuery(product, query));
    }

    // 걸러진 결과에 정렬을 적용한다 (원본 배열은 바꾸지 않는다)
    // CLOTHES 화면에서 정렬을 고르지 않았으면 무작위 순서표대로 놓는다
    products = isRandomOrder
        ? [...products].sort((a, b) => shuffle.rank[a.id] - shuffle.rank[b.id])
        : sortProducts(products, sort);

    // 페이지 번호 (저장하지 않는 일시적인 상태)
    // 성별·브랜드·계절·카테고리·성별 탭·검색어·정렬 조건이 바뀌면 1페이지부터 다시 본다:
    // 페이지를 고른 때의 조건(key)과 지금 조건이 다르면 1페이지로 계산한다
    const filterKey = [gender, brand, season, selected.category, selected.group, selected.item, selectedGenders.join(','), query, sort].join('|');
    const [pageState, setPageState] = useState({ key: filterKey, page: 1 });

    const totalPages = Math.max(1, Math.ceil(products.length / PAGE_SIZE));
    const savedPage = pageState.key === filterKey ? pageState.page : 1;
    const currentPage = Math.min(savedPage, totalPages);

    // CLOTHES 화면은 페이지를 나누지 않는다
    const pageProducts = isClothesPage
        ? products
        : products.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

    // 페이지를 바꾸면 목록 맨 위로 스크롤한다
    const listTopRef = useRef(null);

    function handlePageChange(page) {
        setPageState({ key: filterKey, page });
        listTopRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    // 탭을 누르면 선택에 넣고, 이미 골랐으면 뺀다
    function handleGenderToggle(tabGender) {
        if (selectedGenders.includes(tabGender)) {
            setSelectedGenders(selectedGenders.filter(item => item !== tabGender));
        } else {
            setSelectedGenders([...selectedGenders, tabGender]);
        }
    }

    // 정렬 기준 변경: 검색어·필터는 그대로 두고 정렬만 바꾼다 (F-17)
    // 성별 페이지의 기본값(등록순)은 주소에 적지 않고, CLOTHES 화면은 정렬이 없으면 무작위라서 등록순도 적는다
    function handleSortChange(nextSort) {
        applyConditions({ nextSort: nextSort === DEFAULT_SORT && !isClothesPage ? '' : nextSort });
    }

    // 탐색 조건(검색어·브랜드·계절·카테고리·정렬)을 주소에 함께 저장한다 (F-22)
    // 하나를 바꿔도 나머지 조건은 그대로 두며, 결과가 바뀌므로 페이지만 1로 돌아간다
    function applyConditions({ nextQuery = query, nextBrand = brand, nextSeason = season, nextCategory = selected, nextSort = sortParam }) {
        const params = {};

        if (gender) params.gender = gender;
        if (nextQuery) params.q = nextQuery;
        if (nextBrand) params.brand = nextBrand;
        if (nextSeason) params.season = nextSeason;
        if (nextCategory.category) params.category = nextCategory.category;
        if (nextCategory.group) params.group = nextCategory.group;
        if (nextCategory.item) params.item = nextCategory.item;
        if (nextSort) params.sort = nextSort;

        setSearchParams(params);
    }

    // 검색 실행 (빈 검색어는 검색 제한을 해제한다). 브랜드·계절·카테고리·정렬은 그대로 둔다
    function handleSearch(nextQuery) {
        applyConditions({ nextQuery });
    }

    // 초기화: 브랜드·계절·카테고리·검색어·정렬을 모두 처음 상태로 되돌린다 (성별 페이지는 유지, 페이지는 1로)
    // 좁은 화면에서는 조건을 고르면 메뉴를 접어 바로 결과가 보이게 한다
    function handleReset() {
        setSearchParams({ gender });
        setFilterOpen(false);
    }

    // 카테고리·브랜드·계절은 각각 바꿔도 나머지 조건을 유지한다
    function handleCategorySelect(nextCategory) {
        applyConditions({ nextCategory });
        setFilterOpen(false);
    }

    function handleBrandSelect(nextBrand) {
        applyConditions({ nextBrand });
        setFilterOpen(false);
    }

    function handleSeasonSelect(nextSeason) {
        applyConditions({ nextSeason });
        setFilterOpen(false);
    }

    // 위치 표시: HOME › MEN › 상의 › 티셔츠 › 반소매
    // 마지막 항목만 현재 위치이고, 그 앞 항목은 해당 단계로 돌아가는 링크가 된다
    const trail = [{ label: 'HOME', to: '/' }, { label: pageTitle, to: `/products?gender=${gender}` }];

    if (selected.category) {
        trail.push({ label: selected.category, to: `/products?gender=${gender}&category=${selected.category}` });
    }
    if (selected.category && selected.group) {
        trail.push({ label: selected.group, to: `/products?gender=${gender}&category=${selected.category}&group=${selected.group}` });
    }
    if (selected.category && selected.group && selected.item) {
        trail.push({ label: selected.item });
    }

    // 마지막 항목은 링크를 없앤다
    const breadcrumbItems = trail.map((crumb, index) =>
        index === trail.length - 1 ? { label: crumb.label } : crumb
    );

    const currentTitle = trail[trail.length - 1].label;

    // 결과가 한 페이지(12개) 이하이거나 CLOTHES 화면이면 페이지 번호를 숨긴다 (F-19)
    // 검색 중이면 검색어와 결과 개수를 보여 준다
    const searchSummary = query && (
        <div className={styles.searchSummary}>
            <p className={styles.searchResult}>
                ‘{query}’ 검색 결과 <strong>{products.length}</strong>개
            </p>
            <button type="button" className={styles.searchClear} onClick={() => handleSearch('')}>
                검색 해제
            </button>
        </div>
    );

    // 조건이 하나라도 걸려 있는지 (없는데 결과가 0이면 등록된 의류 자체가 없는 것이다)
    const hasConditions = Boolean(query || brand || season || selected.category);

    // 검색 결과 없음 / 조건에 맞는 결과 없음 / 등록된 의류 없음을 나누어 안내한다 (F-02·F-22)
    let emptyMessage = '등록된 제품이 없습니다.';

    if (query) {
        emptyMessage = '검색 결과가 없습니다.';
    } else if (hasConditions) {
        emptyMessage = '조건에 맞는 제품이 없습니다.';
    }

    const productArea = products.length > 0
        ? (
            <>
                {searchSummary}
                <div className={styles.grid}>
                    {pageProducts.map(product =>
                        <ProductCard key={product.id} product={product} />
                    )}
                </div>

                {!isClothesPage && products.length > PAGE_SIZE && (
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={handlePageChange}
                    />
                )}
            </>
        )
        : (
            <>
                {searchSummary}
                <div className={styles.empty}>
                    <p>{emptyMessage}</p>
                    {/* 조합 결과가 없으면 조건을 한 번에 풀 수 있게 한다 (F-22) */}
                    {hasConditions && (
                        <button type="button" className={styles.emptyReset} onClick={handleReset}>
                            조건 초기화
                        </button>
                    )}
                </div>
            </>
        );

    return (
        <div className="container">
            <Breadcrumb items={genderLabel ? breadcrumbItems : [{ label: 'HOME', to: '/' }, { label: pageTitle }]} />

            {/* 페이지를 바꿀 때 이 위치로 스크롤한다 */}
            <h2 ref={listTopRef} className={styles.title}>{genderLabel ? currentTitle : pageTitle}</h2>

            {/* 성별 페이지(MEN·WOMEN·UNISEX)의 성별 탭: 누르면 해당 성별 페이지로 바로 이동한다 */}
            {genderLabel && (
                <nav className={styles.tabs} aria-label="성별">
                    {GENDER_TABS.map(tab => {
                        const isCurrent = tab.gender === gender;

                        return (
                            <div
                                key={tab.gender}
                                className={isCurrent ? `${styles.tabItem} ${styles.tabItemActive}` : styles.tabItem}
                            >
                                <Link
                                    to={`/products?gender=${tab.gender}`}
                                    className={styles.tab}
                                    aria-current={isCurrent ? 'page' : undefined}
                                >
                                    {tab.label}
                                </Link>
                            </div>
                        );
                    })}

                    {/* 탭 줄 오른쪽 끝: 검색(돋보기) + 정렬(햄버거) */}
                    <div className={styles.tools}>
                        <SearchBox query={query} onSearch={handleSearch} />
                        <SortMenu sort={isRandomOrder ? null : sort} onSortChange={handleSortChange} />
                    </div>
                </nav>
            )}

            {/* CLOTHES 화면의 성별 탭
                - 이름을 누르면 해당 성별을 목록에 넣거나 뺀다 (여러 개 선택 가능)
                - 오른쪽 위 화살표를 누르면 해당 성별 페이지로 이동한다 */}
            {!genderLabel && (
                <div className={styles.tabs} role="group" aria-label="성별 선택">
                    {GENDER_TABS.map(tab => {
                        const isSelected = selectedGenders.includes(tab.gender);

                        return (
                            <div
                                key={tab.gender}
                                className={isSelected ? `${styles.tabItem} ${styles.tabItemActive}` : styles.tabItem}
                            >
                                <button
                                    type="button"
                                    className={styles.tab}
                                    onClick={() => handleGenderToggle(tab.gender)}
                                    aria-pressed={isSelected}
                                >
                                    {tab.label}
                                </button>

                                <Link
                                    to={`/products?gender=${tab.gender}`}
                                    className={styles.tabArrow}
                                    aria-label={`${tab.label} 페이지로 이동`}
                                >
                                    {/* 글자 기호(↗)는 굵기 조절이 안 되어 선 두께를 정할 수 있는 SVG로 그린다 */}
                                    <svg className={styles.tabArrowIcon} viewBox="0 0 12 12" aria-hidden="true">
                                        <path d="M3 9 L9 3 M4 3 H9 V8" />
                                    </svg>
                                </Link>
                            </div>
                        );
                    })}

                    {/* 탭 줄 오른쪽 끝: 검색(돋보기) + 정렬(햄버거) */}
                    <div className={styles.tools}>
                        <SearchBox query={query} onSearch={handleSearch} />
                        <SortMenu sort={isRandomOrder ? null : sort} onSortChange={handleSortChange} />
                    </div>
                </div>
            )}

            {categories
                ? (
                    <div className={styles.layout}>
                        {/* 좁은 화면에서만 보이는 단추: 카테고리 메뉴를 펼치고 접는다 */}
                        <button
                            type="button"
                            className={styles.filterToggle}
                            aria-expanded={filterOpen}
                            aria-controls="category-menu"
                            onClick={() => setFilterOpen(!filterOpen)}
                        >
                            {filterOpen ? '필터 닫기' : '필터'}
                        </button>
                        <aside
                            id="category-menu"
                            className={filterOpen ? `${styles.sidebar} ${styles.sidebarOpen}` : styles.sidebar}
                        >
                            <CategoryMenu
                                categories={categories}
                                selected={selected}
                                onSelect={handleCategorySelect}
                                brands={brands}
                                selectedBrand={brand}
                                onBrandSelect={handleBrandSelect}
                                seasons={seasons}
                                selectedSeason={season}
                                onSeasonSelect={handleSeasonSelect}
                                onReset={handleReset}
                            />
                        </aside>
                        <div>{productArea}</div>
                    </div>
                )
                : productArea
            }
        </div>
    );
}

export default ProductListPage;
