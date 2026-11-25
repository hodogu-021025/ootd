import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import StorageNotice from './StorageNotice';
import RestockPopup from './RestockPopup';
import styles from './Layout.module.css';

// 모든 페이지에 공통으로 들어가는 틀 (Header + 페이지 내용 + Footer)
// transparentHeader: 헤더를 페이지 맨 위 내용(홈 표지) 위에 반투명하게 겹칠지 여부
// restockPopup: 재입고 알림 팝업을 띄울지 여부 (관리자 화면에서는 띄우지 않는다)
function Layout({ transparentHeader = false, restockPopup = true }) {

    return (
        <div className={styles.layout}>
            <Header transparent={transparentHeader} />

            {/* 저장된 데이터를 읽지 못했을 때만 나오는 안내 (F-14) */}
            <StorageNotice />

            <main className={styles.main}>
                <Outlet />
            </main>

            {restockPopup && <RestockPopup />}

            <Footer />
        </div>
    );
}

export default Layout;
