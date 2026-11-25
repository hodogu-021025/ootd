import { getSalePrice } from './price';

// 정렬 기준 (F-17)
export const SORT_OPTIONS = [
    { value: 'registered', label: '등록순' },
    { value: 'latest', label: '최신순' },
    { value: 'price', label: '가격순' },
    { value: 'discount', label: '할인율순' }
];

export const DEFAULT_SORT = 'registered';

// 주소 등에서 읽은 값이 정렬 기준에 없으면 기본값(등록순)으로 본다
export function toSortValue(value) {
    return SORT_OPTIONS.some(option => option.value === value) ? value : DEFAULT_SORT;
}

// 정렬한 새 배열을 돌려준다 (원본 배열은 바꾸지 않는다)
// 등록순·최신순은 의류 ID 기준, 가격순은 판매 가격이 낮은 순, 할인율순은 할인율이 높은 순이다
// 가격순·할인율순에서 값이 같으면 ID 오름차순으로 정한다
export function sortProducts(products, sort) {
    const sorted = [...products];

    if (sort === 'latest') {
        sorted.sort((a, b) => b.id - a.id);
    } else if (sort === 'price') {
        sorted.sort((a, b) => getSalePrice(a) - getSalePrice(b) || a.id - b.id);
    } else if (sort === 'discount') {
        sorted.sort((a, b) => b.discountRate - a.discountRate || a.id - b.id);
    } else {
        sorted.sort((a, b) => a.id - b.id);
    }

    return sorted;
}

// 무작위 순서표를 만든다 ({ 의류 ID: 순서 }). CLOTHES 화면의 기본 배치에 쓴다
// 카드를 섞는 방법: 뒤에서부터 한 장씩 앞쪽의 아무 카드와 자리를 바꾼다
export function makeRandomRank(products) {
    const ids = products.map(product => product.id);

    for (let i = ids.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [ids[i], ids[j]] = [ids[j], ids[i]];
    }

    const rank = {};
    ids.forEach((id, index) => {
        rank[id] = index;
    });

    return rank;
}
