// 상품 사진 등록표: 사진 이름으로 실제 사진을 찾는다
// 관리자가 등록한 상품은 저장소에 사진 이름만 저장하고, 화면에서 이 표로 사진을 찾는다
import women01 from '../image/women_01.webp';
import women02 from '../image/women_02.webp';
import women03 from '../image/women_03.webp';
import women04 from '../image/women_04.webp';
import women05 from '../image/women_05.webp';
import women06 from '../image/women_06.webp';
import women07 from '../image/women_07.webp';
import women08 from '../image/women_08.webp';
import women09 from '../image/women_09.webp';
import women10 from '../image/women_10.webp';
import unisex04 from '../image/unisex_04.webp';
import unisex05 from '../image/unisex_05.webp';
import unisex06 from '../image/unisex_06.webp';
import unisex07 from '../image/unisex_07.webp';
import unisex08 from '../image/unisex_08.webp';
import unisex09 from '../image/unisex_09.webp';
import unisex10 from '../image/unisex_10.webp';
import unisex11 from '../image/unisex_11.webp';
import women11 from '../image/women_11.webp';
import women12 from '../image/women_12.webp';
import women13 from '../image/women_13.webp';
import women14 from '../image/women_14.webp';
import women15 from '../image/women_15.webp';
import women16 from '../image/women_16.webp';
import men01 from '../image/men_01.webp';
import men02 from '../image/men_02.webp';
import men03 from '../image/men_03.webp';
import men04 from '../image/men_04.webp';
import men05 from '../image/men_05.webp';
import unisex01 from '../image/unisex_01.webp';
import unisex02 from '../image/unisex_02.webp';
import unisex03 from '../image/unisex_03.webp';
import product44 from '../image/products/product_44.webp';
import product45 from '../image/products/product_45.webp';
import product46 from '../image/products/product_46.webp';
import product47 from '../image/products/product_47.webp';
import product48 from '../image/products/product_48.webp';
import product49 from '../image/products/product_49.webp';
import product50 from '../image/products/product_50.webp';
import product51 from '../image/products/product_51.webp';
import product52 from '../image/products/product_52.webp';
import product53 from '../image/products/product_53.webp';
import product54 from '../image/products/product_54.webp';
import product55 from '../image/products/product_55.webp';
import product56 from '../image/products/product_56.webp';
import product57 from '../image/products/product_57.webp';
import product58 from '../image/products/product_58.webp';
import product59 from '../image/products/product_59.webp';
import product60 from '../image/products/product_60.webp';
import product61 from '../image/products/product_61.webp';
import product62 from '../image/products/product_62.webp';
import product63 from '../image/products/product_63.webp';
import product64 from '../image/products/product_64.webp';
import product65 from '../image/products/product_65.webp';
import product66 from '../image/products/product_66.webp';
import product67 from '../image/products/product_67.webp';
import product68 from '../image/products/product_68.webp';
import product69 from '../image/products/product_69.webp';
import product70 from '../image/products/product_70.webp';
import product71 from '../image/products/product_71.webp';
import product72 from '../image/products/product_72.webp';
import product73 from '../image/products/product_73.webp';
import product74 from '../image/products/product_74.webp';
import product75 from '../image/products/product_75.webp';
import product76 from '../image/products/product_76.webp';
import product77 from '../image/products/product_77.webp';
import product78 from '../image/products/product_78.webp';
import product79 from '../image/products/product_79.webp';
import product80 from '../image/products/product_80.webp';
import product81 from '../image/products/product_81.webp';
import product82 from '../image/products/product_82.webp';
import product83 from '../image/products/product_83.webp';
import product84 from '../image/products/product_84.webp';
import product85 from '../image/products/product_85.webp';
import product86 from '../image/products/product_86.webp';
import product87 from '../image/products/product_87.webp';
import product88 from '../image/products/product_88.webp';
import product89 from '../image/products/product_89.webp';
import product90 from '../image/products/product_90.webp';
import product91 from '../image/products/product_91.webp';
import product92 from '../image/products/product_92.webp';
import product93 from '../image/products/product_93.webp';
import product94 from '../image/products/product_94.webp';
import product95 from '../image/products/product_95.webp';
import product96 from '../image/products/product_96.webp';
import product97 from '../image/products/product_97.webp';
import product98 from '../image/products/product_98.webp';

export const productImages = {
    'women_01': women01,
    'women_02': women02,
    'women_03': women03,
    'women_04': women04,
    'women_05': women05,
    'women_06': women06,
    'women_07': women07,
    'women_08': women08,
    'women_09': women09,
    'women_10': women10,
    'unisex_04': unisex04,
    'unisex_05': unisex05,
    'unisex_06': unisex06,
    'unisex_07': unisex07,
    'unisex_08': unisex08,
    'unisex_09': unisex09,
    'unisex_10': unisex10,
    'unisex_11': unisex11,
    'women_11': women11,
    'women_12': women12,
    'women_13': women13,
    'women_14': women14,
    'women_15': women15,
    'women_16': women16,
    'men_01': men01,
    'men_02': men02,
    'men_03': men03,
    'men_04': men04,
    'men_05': men05,
    'unisex_01': unisex01,
    'unisex_02': unisex02,
    'unisex_03': unisex03,
    'products/product_44': product44,
    'products/product_45': product45,
    'products/product_46': product46,
    'products/product_47': product47,
    'products/product_48': product48,
    'products/product_49': product49,
    'products/product_50': product50,
    'products/product_51': product51,
    'products/product_52': product52,
    'products/product_53': product53,
    'products/product_54': product54,
    'products/product_55': product55,
    'products/product_56': product56,
    'products/product_57': product57,
    'products/product_58': product58,
    'products/product_59': product59,
    'products/product_60': product60,
    'products/product_61': product61,
    'products/product_62': product62,
    'products/product_63': product63,
    'products/product_64': product64,
    'products/product_65': product65,
    'products/product_66': product66,
    'products/product_67': product67,
    'products/product_68': product68,
    'products/product_69': product69,
    'products/product_70': product70,
    'products/product_71': product71,
    'products/product_72': product72,
    'products/product_73': product73,
    'products/product_74': product74,
    'products/product_75': product75,
    'products/product_76': product76,
    'products/product_77': product77,
    'products/product_78': product78,
    'products/product_79': product79,
    'products/product_80': product80,
    'products/product_81': product81,
    'products/product_82': product82,
    'products/product_83': product83,
    'products/product_84': product84,
    'products/product_85': product85,
    'products/product_86': product86,
    'products/product_87': product87,
    'products/product_88': product88,
    'products/product_89': product89,
    'products/product_90': product90,
    'products/product_91': product91,
    'products/product_92': product92,
    'products/product_93': product93,
    'products/product_94': product94,
    'products/product_95': product95,
    'products/product_96': product96,
    'products/product_97': product97,
    'products/product_98': product98
};

// 관리자 화면에서 고를 수 있는 사진 이름 목록
export const productImageNames = Object.keys(productImages);

// 이름으로 사진을 찾는다 (없는 이름이면 undefined)
export function getProductImage(imageName) {
    return productImages[imageName];
}
