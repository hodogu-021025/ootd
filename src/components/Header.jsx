import { Link, NavLink } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import ootdLogo from '../image/ootd_logo.webp';
import ootdName from '../image/ootd_name.webp';
import cartIcon from '../image/cart_icon.webp';
import styles from './Header.module.css';

// transparent: 표지 사진 위에 반투명하게 겹쳐 보일지 여부 (홈 화면)
function Header({ transparent = false }) {

    // 장바구니에 담긴 상품 수 (수량 합계)
    const { count: cartCount } = useCart();

    // 관리자 버튼도 현재 경로면 표시를 바꾼다
    function getAdminClass({ isActive }) {
        return isActive ? `${styles.adminButton} ${styles.adminActive}` : styles.adminButton;
    }

    // 현재 경로의 메뉴에 active 클래스 추가
    function getMenuClass({ isActive }) {
        return isActive ? `${styles.menuLink} ${styles.active}` : styles.menuLink;
    }

    return (
        <header className={transparent ? `${styles.header} ${styles.transparent}` : styles.header}>
            <div className={styles.inner}>
                <div className={styles.logoArea}>
                    <Link to="/" className={styles.logo}>
                        <img src={ootdLogo} alt="" className={styles.logoIcon} />
                        <img src={ootdName} alt="OOTD" className={styles.logoName} />
                    </Link>

                    {/* 관리자 페이지로 들어가는 버튼 (로그인 없이 주소로만 접근하는 화면이다) */}
                    <NavLink to="/admin" className={getAdminClass}>ADMIN</NavLink>
                </div>

                <nav>
                    <ul className={styles.menu}>
                        <li><NavLink to="/" end className={getMenuClass}>HOME</NavLink></li>
                        <li><NavLink to="/products" className={getMenuClass}>CLOTHES</NavLink></li>
                        <li><NavLink to="/lists" className={getMenuClass}>LISTS</NavLink></li>
                        <li><NavLink to="/orders" className={getMenuClass}>ORDERS</NavLink></li>
                        <li>
                            <NavLink to="/cart" className={getMenuClass}>
                                <img src={cartIcon} alt="장바구니" className={styles.cartIcon} />
                                {cartCount > 0 && <span className={styles.badge}>{cartCount}</span>}
                            </NavLink>
                        </li>
                    </ul>
                </nav>
            </div>
        </header>
    );
}

export default Header;
