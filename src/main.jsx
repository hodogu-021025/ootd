import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { CartProvider } from './context/CartContext.jsx';
import { OrdersProvider } from './context/OrdersContext.jsx';
import { WishlistProvider } from './context/WishlistContext.jsx';
import { RestockAlertsProvider } from './context/RestockAlertsContext.jsx';
import { ProductsProvider } from './context/ProductsContext.jsx';
import './styles/global.css';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <BrowserRouter>
            {/* 의류 데이터·재고와 장바구니·주문 내역·좋아요를 여러 화면에서 함께 쓰도록 앱 전체를 감싼다 */}
            <ProductsProvider>
            <CartProvider>
                <OrdersProvider>
                    <WishlistProvider>
                        <RestockAlertsProvider>
                            <App />
                        </RestockAlertsProvider>
                    </WishlistProvider>
                </OrdersProvider>
            </CartProvider>
            </ProductsProvider>
        </BrowserRouter>
    </StrictMode>
);
