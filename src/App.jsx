import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import ProductListPage from './pages/ProductListPage';
import ProductDetailPage from './pages/ProductDetailPage';
import ListsPage from './pages/ListsPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import OrderCompletePage from './pages/OrderCompletePage';
import OrdersPage from './pages/OrdersPage';
import WishlistPage from './pages/WishlistPage';
import AdminPage from './pages/AdminPage';
import AdminProductFormPage from './pages/AdminProductFormPage';
import RestockAlertsPage from './pages/RestockAlertsPage';

function App() {

    return (
        <Routes>
            {/* 홈: 헤더를 표지 사진 위에 반투명하게 겹친다 */}
            <Route path="/" element={<Layout transparentHeader />}>
                <Route index element={<HomePage />} />
            </Route>

            {/* 나머지 화면: 기본 헤더 */}
            <Route element={<Layout />}>
                {/* 임시 화면: 페이지 컴포넌트를 만들면 교체 */}
                <Route path="products" element={<ProductListPage />} />
                <Route path="products/:productId" element={<ProductDetailPage />} />
                <Route path="cart" element={<CartPage />} />
                <Route path="checkout" element={<CheckoutPage />} />
                <Route path="order-complete/:orderId" element={<OrderCompletePage />} />
                <Route path="orders" element={<OrdersPage />} />
                <Route path="lists" element={<ListsPage />} />
                <Route path="wishlist" element={<WishlistPage />} />
                <Route path="restock-alerts" element={<RestockAlertsPage />} />
                <Route path="*" element={<h2 className="container">페이지를 찾을 수 없습니다.</h2>} />
            </Route>

            {/* 관리자 화면: 재입고 알림 팝업을 띄우지 않는다 (F-29) */}
            <Route element={<Layout restockPopup={false} />}>
                <Route path="admin" element={<AdminPage />} />
                <Route path="admin/new" element={<AdminProductFormPage />} />
                <Route path="admin/:productId/edit" element={<AdminProductFormPage />} />
            </Route>
        </Routes>
    );
}

export default App;
