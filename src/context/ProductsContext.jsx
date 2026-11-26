import { createContext, useContext, useState } from 'react';
import { mockProducts } from '../mocks/products';
import { getProductImage } from '../mocks/images';
import { readStorage, writeStorage, clearStorage } from '../utils/storage';

const STORAGE_KEY = 'ootd_products';

// 기초 의류 데이터(mocks/products.js)의 이름·사진 설명을 크게 바꾸면 이 번호를 올린다.
// 저장된 데이터의 번호가 다르면 기초 의류의 설명 항목만 새 값으로 바꾸고, 재고와 관리자가 추가한 의류는 그대로 둔다
// 2: 사진을 Unsplash 무료 사진으로 바꾸면서 이름·브랜드·설명을 새로 썼다
const PRODUCT_DATA_VERSION = 2;
const DESCRIPTIVE_FIELDS = ['brand', 'name', 'description', 'type', 'category', 'group', 'item', 'season', 'gender', 'imageName'];

// 저장된 의류 목록에 새 기초 데이터의 설명 항목을 덮어쓴다 (id 가 같은 기초 의류만)
function refreshDescriptions(storedProducts) {
    const base = new Map(mockProducts.map(product => [product.id, product]));
    return storedProducts.map(product => {
        const fresh = base.get(product.id);
        if (!fresh) {
            return product;
        }
        const next = { ...product };
        DESCRIPTIVE_FIELDS.forEach(field => {
            next[field] = fresh[field];
        });
        return next;
    });
}

// 재고 상태 기준 (F-27): 4개 이상 정상, 1~3개 재고 부족, 0개 재고 없음
export const LOW_STOCK_LIMIT = 3;

const ProductsContext = createContext(null);

// 저장된 의류 데이터의 구조 검사: { products: 배열, nextId: 숫자 } 형태여야 한다
function isProductData(value) {
    return value !== null
        && typeof value === 'object'
        && Number.isInteger(value.nextId)
        && isProducts(value.products);
}

function isProducts(value) {
    return Array.isArray(value) && value.every(product =>
        product !== null
        && typeof product === 'object'
        && Number.isInteger(product.id)
        && typeof product.name === 'string'
        && typeof product.price === 'number'
        && Array.isArray(product.sizes)
        && product.stock !== null
        && typeof product.stock === 'object'
    );
}

// 저장할 때는 사진 이름만 남긴다 (사진 파일 경로는 빌드할 때마다 달라지므로 저장하지 않는다)
function toStored(products) {
    return products.map(product => {
        const copy = { ...product };
        delete copy.image;
        return copy;
    });
}

// 화면에서 쓰기 좋게 사진을 붙인다
function attachImage(product) {
    return { ...product, image: getProductImage(product.imageName) };
}

function pad(value) {
    return String(value).padStart(2, '0');
}

function formatDateTime(date) {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

// 의류 데이터와 사이즈별 재고를 한 곳에서 관리한다
// 처음에는 mock 데이터로 시작하고, 주문·취소·관리자 수정으로 바뀐 내용은 localStorage에 저장한다
function ProductsProvider({ children }) {

    const [stored] = useState(() => readStorage(STORAGE_KEY, isProductData));
    const [products, setProducts] = useState(() => {
        if (!stored.value) {
            return mockProducts;
        }
        return stored.value.dataVersion === PRODUCT_DATA_VERSION
            ? stored.value.products
            : refreshDescriptions(stored.value.products);
    });
    // 다음에 등록할 의류 번호 (한 번 쓴 번호는 다시 쓰지 않는다)
    const [nextId, setNextId] = useState(stored.value ? stored.value.nextId : Math.max(...mockProducts.map(product => product.id)) + 1);
    const [storageBroken, setStorageBroken] = useState(stored.broken);

    // 먼저 저장해 보고, 성공했을 때만 화면의 의류 데이터를 바꾼다
    function saveProducts(next, nextNextId = nextId) {
        if (storageBroken || !writeStorage(STORAGE_KEY, { products: toStored(next), nextId: nextNextId, dataVersion: PRODUCT_DATA_VERSION })) {
            return false;
        }

        setProducts(next);
        setNextId(nextNextId);
        return true;
    }

    function getProduct(productId) {
        return products.find(product => product.id === productId);
    }

    // 한 사이즈의 재고 수량
    function getStock(productId, size) {
        const product = getProduct(productId);
        return product && Number.isInteger(product.stock[size]) ? product.stock[size] : 0;
    }

    // 의류의 사이즈별 재고 전체 ({ S: 3, M: 0, ... })
    function getProductStock(productId) {
        const product = getProduct(productId);
        return product ? product.stock : {};
    }

    // 재고를 바꾼 목록을 계산한다 (저장은 하지 않는다)
    // changes: [{ productId, size, amount }] (양수면 늘리고 음수면 줄인다)
    // 재고가 0에서 1 이상이 되면 그 사이즈의 재입고 일시를 기록한다 (공통 규칙)
    function computeStock(changes) {
        const now = formatDateTime(new Date());

        return products.map(product => {
            const productChanges = changes.filter(change => change.productId === product.id);

            if (productChanges.length === 0) {
                return product;
            }

            const stock = { ...product.stock };
            const restockedAt = { ...product.restockedAt };

            productChanges.forEach(({ size, amount }) => {
                const before = Number.isInteger(stock[size]) ? stock[size] : 0;
                const after = Math.max(0, before + amount);
                stock[size] = after;

                if (before === 0 && after > 0) {
                    restockedAt[size] = now;
                }
            });

            return { ...product, stock, restockedAt };
        });
    }

    // 계산한 재고를 저장한다
    function changeStock(changes) {
        return saveProducts(computeStock(changes));
    }

    // F-12 주문: 재고를 줄인 저장 내용만 만들어 둔다 (주문·장바구니와 함께 한 번에 저장한다)
    // 저장할 내용(entry)과, 저장에 성공했을 때 화면에 반영하는 방법(apply)을 함께 돌려준다
    function prepareStockDecrease(items) {
        if (storageBroken) {
            return null;
        }

        const next = computeStock(items.map(item => ({ productId: item.productId, size: item.size, amount: -item.quantity })));

        return {
            entry: { key: STORAGE_KEY, value: { products: toStored(next), nextId, dataVersion: PRODUCT_DATA_VERSION } },
            apply: () => setProducts(next)
        };
    }

    // F-18 주문 취소: 주문 수량만큼 재고를 되돌린다 (삭제된 의류·없어진 사이즈는 제외)
    function increaseStock(items) {
        const targets = items.filter(item => {
            const product = getProduct(item.productId);
            return product !== undefined && product.sizes.includes(item.size);
        });

        if (targets.length === 0) {
            return true;
        }

        return changeStock(targets.map(item => ({ productId: item.productId, size: item.size, amount: item.quantity })));
    }

    // F-23 관리자 의류 등록: 저장해 둔 다음 번호를 쓰고, 등록일을 오늘로 기록한다
    function addProduct(data) {
        const now = new Date();
        const createdAt = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
        const product = { ...data, id: nextId, createdAt, restockedAt: {} };

        return saveProducts([...products, product], nextId + 1) ? product : null;
    }

    // F-24 관리자 의류 수정: 번호와 등록일은 그대로 두고 나머지를 바꾼다
    // 재고가 0에서 1 이상이 되면 그 사이즈의 재입고 일시를 기록한다 (F-25)
    function updateProduct(productId, data) {
        const now = formatDateTime(new Date());

        const next = products.map(product => {
            if (product.id !== productId) {
                return product;
            }

            const restockedAt = { ...product.restockedAt };

            Object.entries(data.stock).forEach(([size, count]) => {
                const before = Number.isInteger(product.stock[size]) ? product.stock[size] : 0;

                if (before === 0 && count > 0) {
                    restockedAt[size] = now;
                }
            });

            return { ...product, ...data, id: product.id, createdAt: product.createdAt, restockedAt };
        });

        return saveProducts(next);
    }

    // F-24 관리자 의류 삭제
    function deleteProduct(productId) {
        return saveProducts(products.filter(product => product.id !== productId));
    }

    // F-14 초기화: 저장된 의류 데이터를 지우고 mock 데이터로 다시 시작한다
    function resetStorage() {
        if (!clearStorage(STORAGE_KEY)) {
            return false;
        }

        setProducts(mockProducts);
        setNextId(Math.max(...mockProducts.map(product => product.id)) + 1);
        setStorageBroken(false);
        return true;
    }

    // 화면에서 쓰는 목록에는 사진을 붙여 둔다
    const productsWithImage = products.map(attachImage);

    const value = {
        products: productsWithImage,
        storageBroken,
        getProduct: productId => productsWithImage.find(product => product.id === productId),
        getStock,
        getProductStock,
        increaseStock,
        prepareStockDecrease,
        addProduct,
        updateProduct,
        deleteProduct,
        resetStorage
    };

    return <ProductsContext.Provider value={value}>{children}</ProductsContext.Provider>;
}

// 컴포넌트에서 의류 데이터·재고를 꺼내 쓰기 위한 훅
function useProducts() {
    const context = useContext(ProductsContext);

    if (!context) {
        throw new Error('useProducts는 ProductsProvider 안에서만 쓸 수 있습니다.');
    }

    return context;
}

export { ProductsProvider, useProducts };
