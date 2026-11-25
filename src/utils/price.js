// 금액 계산 도우미

// 배송비: 배송비 기능을 구현하지 않으므로 항상 0원이다 (02 기능 명세서)
export const SHIPPING_FEE = 0;

// 판매 가격: 정가에서 할인율(0~90%)만큼 빼고 원 단위 미만은 버린다
export function getSalePrice(product) {
    return Math.floor(product.price * (100 - product.discountRate) / 100);
}
