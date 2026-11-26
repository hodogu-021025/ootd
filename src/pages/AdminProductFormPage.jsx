import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useProducts } from '../context/ProductsContext';
import { genderLabels } from '../mocks/products';
import { menCategories, womenCategories, unisexCategories } from '../mocks/categories';
import { productImageNames, getProductImage } from '../mocks/images';
import { getSalePrice } from '../utils/price';
import styles from './AdminProductFormPage.module.css';

const CATEGORIES_BY_GENDER = {
    men: menCategories,
    women: womenCategories,
    unisex: unisexCategories
};

const GENDERS = ['men', 'women', 'unisex'];
const SEASONS = ['봄·여름', '봄·가을', '가을·겨울', '사계절'];
const SIZES = ['S', 'M', 'L', 'XL', 'FREE'];

// 할인율 범위 (공통 규칙: 0~90의 정수)
const MAX_DISCOUNT_RATE = 90;

// 빈 입력값 (상품 추가로 들어왔을 때의 시작 값)
const EMPTY_FORM = {
    name: '',
    description: '',
    brand: '',
    gender: 'women',
    season: '사계절',
    category: '',
    group: '',
    item: '',
    price: '',
    discountRate: '0',
    imageName: '',
    // 사이즈별 재고: 고른 사이즈만 값을 갖는다 ({ S: '10' })
    stock: {}
};

// 수정할 의류를 입력값 형태로 바꾼다 (숫자는 입력창에서 다루기 쉽게 글자로 둔다)
function toForm(product) {
    const stock = {};
    product.sizes.forEach(size => {
        stock[size] = String(product.stock[size] || 0);
    });

    return {
        name: product.name,
        description: product.description,
        brand: product.brand,
        gender: product.gender,
        season: product.season,
        category: product.category,
        group: product.group,
        item: product.item,
        price: String(product.price),
        discountRate: String(product.discountRate),
        imageName: product.imageName,
        stock
    };
}

// S-09 관리자 의류 등록·수정 (F-23·F-24)
// 주소에 의류 번호가 있으면 수정, 없으면 등록이다
function AdminProductFormPage() {

    const { productId } = useParams();
    const { getProduct, addProduct, updateProduct } = useProducts();
    const navigate = useNavigate();

    const editing = productId !== undefined;
    const product = editing ? getProduct(Number(productId)) : undefined;

    const [form, setForm] = useState(() => (product ? toForm(product) : EMPTY_FORM));
    const [errors, setErrors] = useState({});
    const [saveError, setSaveError] = useState('');

    // 수정할 의류가 없는 경우 (삭제된 번호로 들어왔을 때)
    if (editing && !product) {
        return (
            <div className="container">
                <div className={styles.notFound}>
                    <p>수정할 의류를 찾을 수 없습니다.</p>
                    <Link to="/admin" className={styles.outlineButton}>상품 리스트로</Link>
                </div>
            </div>
        );
    }

    const categories = CATEGORIES_BY_GENDER[form.gender];
    const groups = categories.find(category => category.name === form.category)?.groups || [];
    const items = groups.find(group => group.name === form.group)?.items || [];
    const selectedSizes = Object.keys(form.stock);

    // 입력값 하나를 바꾼다 (그 항목의 오류 안내는 지운다)
    function change(name, value) {
        setForm(prev => ({ ...prev, [name]: value }));
        setErrors(prev => ({ ...prev, [name]: '' }));
        setSaveError('');
    }

    // 성별을 바꾸면 카테고리 목록이 달라지므로 분류 선택을 비운다
    function handleGenderChange(value) {
        setForm(prev => ({ ...prev, gender: value, category: '', group: '', item: '' }));
        setErrors(prev => ({ ...prev, category: '' }));
    }

    function handleCategoryChange(value) {
        setForm(prev => ({ ...prev, category: value, group: '', item: '' }));
        setErrors(prev => ({ ...prev, category: '' }));
    }

    function handleGroupChange(value) {
        setForm(prev => ({ ...prev, group: value, item: '' }));
        setErrors(prev => ({ ...prev, category: '' }));
    }

    // 사이즈를 고르면 재고 칸이 생기고, 해제하면 사라진다
    function toggleSize(size) {
        setForm(prev => {
            const stock = { ...prev.stock };

            if (size in stock) {
                delete stock[size];
            } else {
                stock[size] = '0';
            }

            return { ...prev, stock };
        });
        setErrors(prev => ({ ...prev, sizes: '' }));
    }

    function changeStock(size, value) {
        setForm(prev => ({ ...prev, stock: { ...prev.stock, [size]: value } }));
        setErrors(prev => ({ ...prev, sizes: '' }));
    }

    // 버튼으로 수량을 더하거나 뺀다 (숫자가 아니면 0에서 시작하고, 0 아래로는 내려가지 않는다)
    function addStock(size, amount) {
        const current = isCount(form.stock[size]) ? Number(form.stock[size]) : 0;
        changeStock(size, String(Math.max(0, current + amount)));
    }

    // 0 이상의 정수인지 확인한다
    function isCount(value) {
        return /^\d+$/.test(value.trim());
    }

    function validate() {
        const nextErrors = {};

        if (form.name.trim() === '') nextErrors.name = '상품명을 입력하세요.';
        if (form.brand.trim() === '') nextErrors.brand = '브랜드를 입력하세요.';
        if (form.description.trim() === '') nextErrors.description = '상품 설명을 입력하세요.';
        if (form.category === '' || form.group === '') nextErrors.category = '대분류와 중분류를 선택하세요.';
        if (items.length > 0 && form.item === '') nextErrors.category = '세부 항목까지 선택하세요.';
        if (!isCount(form.price)) nextErrors.price = '가격은 0 이상의 정수로 입력하세요.';

        if (!isCount(form.discountRate) || Number(form.discountRate) > MAX_DISCOUNT_RATE) {
            nextErrors.discountRate = `할인율은 0~${MAX_DISCOUNT_RATE}의 정수로 입력하세요.`;
        }

        if (selectedSizes.length === 0) {
            nextErrors.sizes = '사이즈를 하나 이상 선택하세요.';
        } else if (selectedSizes.some(size => !isCount(form.stock[size]))) {
            nextErrors.sizes = '재고 수량은 0 이상의 정수로 입력하세요.';
        }

        if (form.imageName === '') nextErrors.imageName = '사진을 선택하세요.';

        return nextErrors;
    }

    function handleSubmit(event) {
        event.preventDefault();

        const nextErrors = validate();
        setErrors(nextErrors);

        if (Object.keys(nextErrors).length > 0) {
            return;
        }

        // 사이즈는 S·M·L·XL·FREE 순서로 저장한다
        const sizes = SIZES.filter(size => size in form.stock);
        const stock = {};
        sizes.forEach(size => {
            stock[size] = Number(form.stock[size]);
        });

        const data = {
            imageName: form.imageName,
            brand: form.brand.trim(),
            name: form.name.trim(),
            price: Number(form.price),
            discountRate: Number(form.discountRate),
            // 의류 종류는 대분류와 같다
            type: form.category,
            category: form.category,
            group: form.group,
            item: form.item,
            season: form.season,
            sizes,
            stock,
            gender: form.gender,
            description: form.description.trim()
        };

        const saved = editing ? updateProduct(product.id, data) : addProduct(data);

        if (!saved) {
            setSaveError('저장에 실패했습니다. 다시 시도해 주세요.');
            return;
        }

        navigate('/admin');
    }

    // 할인 적용 가격 미리 보기
    const previewPrice = isCount(form.price) && isCount(form.discountRate)
        ? getSalePrice({ price: Number(form.price), discountRate: Number(form.discountRate) })
        : null;

    return (
        <div className="container">
            <div className={styles.head}>
                <h2 className={styles.title}>{editing ? '상품 수정' : '상품 추가'}</h2>
                <Link to="/admin" className={styles.outlineButton}>상품 리스트로</Link>
            </div>

            <form onSubmit={handleSubmit} noValidate>
                <div className={styles.columns}>
                    {/* 좌측: 글로 적는 정보 */}
                    <section className={styles.column}>
                        <div className={styles.field}>
                            <label htmlFor="product-name" className={styles.label}>상품명</label>
                            <input
                                id="product-name"
                                type="text"
                                className={errors.name ? `${styles.input} ${styles.inputError}` : styles.input}
                                value={form.name}
                                onChange={event => change('name', event.target.value)}
                            />
                            {errors.name && <p className={styles.error}>{errors.name}</p>}
                        </div>

                        <div className={styles.field}>
                            <label htmlFor="product-description" className={styles.label}>상품 설명</label>
                            <textarea
                                id="product-description"
                                rows="4"
                                className={errors.description ? `${styles.textarea} ${styles.inputError}` : styles.textarea}
                                value={form.description}
                                onChange={event => change('description', event.target.value)}
                            />
                            {errors.description && <p className={styles.error}>{errors.description}</p>}
                        </div>

                        <div className={styles.field}>
                            <label htmlFor="product-brand" className={styles.label}>브랜드</label>
                            <input
                                id="product-brand"
                                type="text"
                                className={errors.brand ? `${styles.input} ${styles.inputError}` : styles.input}
                                value={form.brand}
                                onChange={event => change('brand', event.target.value)}
                            />
                            {errors.brand && <p className={styles.error}>{errors.brand}</p>}
                        </div>

                        <div className={styles.field}>
                            <label htmlFor="product-gender" className={styles.label}>성별</label>
                            <select
                                id="product-gender"
                                className={styles.select}
                                value={form.gender}
                                onChange={event => handleGenderChange(event.target.value)}
                            >
                                {GENDERS.map(gender =>
                                    <option key={gender} value={gender}>{genderLabels[gender]}</option>
                                )}
                            </select>
                        </div>

                        <div className={styles.field}>
                            <label htmlFor="product-season" className={styles.label}>착용 계절</label>
                            <select
                                id="product-season"
                                className={styles.select}
                                value={form.season}
                                onChange={event => change('season', event.target.value)}
                            >
                                {SEASONS.map(season =>
                                    <option key={season} value={season}>{season}</option>
                                )}
                            </select>
                        </div>

                        <div className={styles.field}>
                            <span className={styles.label}>분류 (대분류 › 중분류 › 세부 항목)</span>
                            <div className={styles.categoryRow}>
                                <select
                                    className={errors.category ? `${styles.select} ${styles.inputError}` : styles.select}
                                    value={form.category}
                                    onChange={event => handleCategoryChange(event.target.value)}
                                    aria-label="대분류"
                                >
                                    <option value="">대분류</option>
                                    {categories.map(category =>
                                        <option key={category.name} value={category.name}>{category.name}</option>
                                    )}
                                </select>

                                <select
                                    className={styles.select}
                                    value={form.group}
                                    onChange={event => handleGroupChange(event.target.value)}
                                    disabled={form.category === ''}
                                    aria-label="중분류"
                                >
                                    <option value="">중분류</option>
                                    {groups.map(group =>
                                        <option key={group.name} value={group.name}>{group.name}</option>
                                    )}
                                </select>

                                <select
                                    className={styles.select}
                                    value={form.item}
                                    onChange={event => change('item', event.target.value)}
                                    disabled={items.length === 0}
                                    aria-label="세부 항목"
                                >
                                    <option value="">세부 항목</option>
                                    {items.map(item =>
                                        <option key={item} value={item}>{item}</option>
                                    )}
                                </select>
                            </div>
                            {errors.category && <p className={styles.error}>{errors.category}</p>}
                        </div>
                    </section>

                    {/* 우측: 재고·가격·사진 */}
                    <section className={styles.column}>
                        <div className={styles.field}>
                            <span className={styles.label}>사이즈별 재고</span>
                            <div className={styles.sizes}>
                                {SIZES.map(size => {
                                    const checked = size in form.stock;

                                    return (
                                        <div key={size} className={styles.sizeRow}>
                                            <label className={styles.sizeLabel}>
                                                <input
                                                    type="checkbox"
                                                    checked={checked}
                                                    onChange={() => toggleSize(size)}
                                                />
                                                {size}
                                            </label>
                                            {/* 입고·반품처럼 여러 개를 한 번에 더하거나 뺄 때 쓴다 */}
                                            <button
                                                type="button"
                                                className={styles.addButton}
                                                onClick={() => addStock(size, -10)}
                                                disabled={!checked}
                                            >
                                                −10
                                            </button>

                                            <div className={styles.stockControl}>
                                                <button
                                                    type="button"
                                                    className={styles.stockButton}
                                                    onClick={() => addStock(size, -1)}
                                                    disabled={!checked}
                                                    aria-label={`${size} 재고 1개 빼기`}
                                                >
                                                    −
                                                </button>
                                                <input
                                                    type="text"
                                                    inputMode="numeric"
                                                    className={styles.stockInput}
                                                    value={checked ? form.stock[size] : ''}
                                                    onChange={event => changeStock(size, event.target.value)}
                                                    disabled={!checked}
                                                    aria-label={`${size} 재고 수량`}
                                                />
                                                <button
                                                    type="button"
                                                    className={styles.stockButton}
                                                    onClick={() => addStock(size, 1)}
                                                    disabled={!checked}
                                                    aria-label={`${size} 재고 1개 더하기`}
                                                >
                                                    +
                                                </button>
                                            </div>

                                            <button
                                                type="button"
                                                className={styles.addButton}
                                                onClick={() => addStock(size, 10)}
                                                disabled={!checked}
                                            >
                                                +10
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                            {errors.sizes && <p className={styles.error}>{errors.sizes}</p>}
                        </div>

                        <div className={styles.field}>
                            <label htmlFor="product-price" className={styles.label}>가격 (원)</label>
                            <input
                                id="product-price"
                                type="text"
                                inputMode="numeric"
                                className={errors.price ? `${styles.input} ${styles.inputError}` : styles.input}
                                value={form.price}
                                onChange={event => change('price', event.target.value)}
                            />
                            {errors.price && <p className={styles.error}>{errors.price}</p>}
                        </div>

                        <div className={styles.field}>
                            <label htmlFor="product-discount" className={styles.label}>할인율 (%)</label>
                            <input
                                id="product-discount"
                                type="text"
                                inputMode="numeric"
                                className={errors.discountRate ? `${styles.input} ${styles.inputError}` : styles.input}
                                value={form.discountRate}
                                onChange={event => change('discountRate', event.target.value)}
                            />
                            {errors.discountRate && <p className={styles.error}>{errors.discountRate}</p>}
                            {previewPrice !== null && (
                                <p className={styles.preview}>판매 가격: {previewPrice.toLocaleString()}원</p>
                            )}
                        </div>

                        <div className={styles.field}>
                            <span className={styles.label}>사진</span>
                            <div className={styles.imageGrid}>
                                {productImageNames.map(name =>
                                    <button
                                        key={name}
                                        type="button"
                                        className={name === form.imageName ? `${styles.imageButton} ${styles.imageSelected}` : styles.imageButton}
                                        onClick={() => change('imageName', name)}
                                        aria-pressed={name === form.imageName}
                                        title={name}
                                    >
                                        <img src={getProductImage(name)} alt={name} className={styles.image} loading="lazy" decoding="async" />
                                    </button>
                                )}
                            </div>
                            {errors.imageName && <p className={styles.error}>{errors.imageName}</p>}
                        </div>
                    </section>
                </div>

                <div className={styles.buttons}>
                    <button type="submit" className={styles.saveButton}>{editing ? '수정 저장' : '등록'}</button>
                    <Link to="/admin" className={styles.cancelButton}>취소</Link>
                </div>

                {saveError && <p className={styles.error}>{saveError}</p>}
            </form>
        </div>
    );
}

export default AdminProductFormPage;
