import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { CustomerAuthProvider } from './context/CustomerAuthContext';
import { OrdersProvider } from './context/OrdersContext';
import { StoreProvider } from './context/StoreContext';
import { AdminAuthProvider } from './context/AdminAuthContext';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Catalog } from './pages/Catalog';
import { ProductPage } from './pages/ProductPage';
import { Cart } from './pages/Cart';
import { Delivery } from './pages/Delivery';
import { Contacts } from './pages/Contacts';
import { AccountAuth } from './pages/AccountAuth';
import { Account } from './pages/Account';
import { AdminLayout } from './admin/AdminLayout';
import { AdminLogin } from './admin/AdminLogin';
import { AdminDashboard } from './admin/AdminDashboard';
import { AdminProducts } from './admin/AdminProducts';
import { AdminProductForm } from './admin/AdminProductForm';
import { AdminCategories } from './admin/AdminCategories';
import { AdminSettings } from './admin/AdminSettings';
import { AdminImport } from './admin/AdminImport';
import { AdminOrders } from './admin/AdminOrders';
import { AdminCustomers } from './admin/AdminCustomers';

function App() {
  return (
    <StoreProvider>
      <OrdersProvider>
        <CustomerAuthProvider>
        <AdminAuthProvider>
          <CartProvider>
            <BrowserRouter>
            <Routes>
              <Route element={<Layout />}>
                <Route index element={<Home />} />
                <Route path="catalog" element={<Catalog />} />
                <Route path="catalog/:categorySlug" element={<Catalog />} />
                <Route path="product/:slug" element={<ProductPage />} />
                <Route path="cart" element={<Cart />} />
                <Route path="delivery" element={<Delivery />} />
                <Route path="contacts" element={<Contacts />} />
                <Route path="account/login" element={<AccountAuth />} />
                <Route path="account" element={<Account />} />
              </Route>

              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="products" element={<AdminProducts />} />
                <Route path="products/new" element={<AdminProductForm />} />
                <Route path="products/:id" element={<AdminProductForm />} />
                <Route path="categories" element={<AdminCategories />} />
                <Route path="import" element={<AdminImport />} />
                <Route path="orders" element={<AdminOrders />} />
                <Route path="customers" element={<AdminCustomers />} />
                <Route path="settings" element={<AdminSettings />} />
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            </BrowserRouter>
          </CartProvider>
        </AdminAuthProvider>
        </CustomerAuthProvider>
      </OrdersProvider>
    </StoreProvider>
  );
}

export default App;
