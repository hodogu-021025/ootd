import { Link } from 'react-router-dom';
import ootdLogo from '../image/ootd_logo.webp';
import ootdName from '../image/ootd_name.webp';
import styles from './Footer.module.css';

// 헤더와 같은 로고·메뉴를 쓰는 공통 푸터 (헤더의 장바구니 아이콘은 푸터에서 CART 글자로 둔다)
const FOOTER_MENUS = [
    { to: '/', label: 'HOME' },
    { to: '/products', label: 'CLOTHES' },
    { to: '/lists', label: 'LISTS' },
    { to: '/orders', label: 'ORDERS' },
    { to: '/cart', label: 'CART' }
];

function Footer() {

    return (
        <footer className={styles.footer}>
            <div className={styles.inner}>
                {/* 윗줄: 로고(왼쪽) + 메뉴(오른쪽) */}
                <div className={styles.top}>
                    <Link to="/" className={styles.logo}>
                        <img src={ootdLogo} alt="" className={styles.logoIcon} />
                        <img src={ootdName} alt="OOTD" className={styles.logoName} />
                    </Link>

                    <nav aria-label="푸터 메뉴">
                        <ul className={styles.menu}>
                            {FOOTER_MENUS.map(menu =>
                                <li key={menu.to}>
                                    <Link to={menu.to} className={styles.menuLink}>{menu.label}</Link>
                                </li>
                            )}
                        </ul>
                    </nav>
                </div>

                {/* 아랫줄: 안내 문구와 저작권 */}
                <div className={styles.bottom}>
                    <p>React 수업 프로젝트 · 실제 결제와 배송은 진행되지 않는 모의 의류 쇼핑몰입니다.</p>
                    <p className={styles.copy}>&copy; 2026 OOTD</p>
                </div>
            </div>
        </footer>
    );
}

export default Footer;
