import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

import Layout from './components/layOut'
import LoginPage from './pages/login/logInPage'
import AdminPage from './pages/admin/adminPage'
import ServiceDeliveryPage from './pages/service-delivery/serviceDeliveryPage'
import Suppliers from './pages/supplier/suppliers'
import Reports from './pages/reports/reports'
import PromotionsAndSubscription from './pages/promotionsAndSubscription/promotionsAndSubscription'
import Support from './pages/support/supportTab/support'
import Overview from './pages/overview/overview'


const Authenticated = ({ children }) => {
  const token = localStorage.getItem("authToken");

  if (!token) {
    return <Navigate to="/" replace />;
  }
  
  // Otherwise, render the children
  return children;
};

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<LoginPage />} />

        {/* Routes that show the layout */}
        <Route element={<Layout />}>
          <Route path="/overview" element={<Authenticated><Overview /></Authenticated>} />
          <Route path="/admins" element={<Authenticated><AdminPage /></Authenticated>} />
          <Route path="/service-delivery" element={<Authenticated><ServiceDeliveryPage /></Authenticated>} />
          <Route path="/suppliers" element={<Authenticated><Suppliers /></Authenticated>} />
          <Route path="/promotionsAndSubscriptions" element={<Authenticated><PromotionsAndSubscription /></Authenticated>} />
          <Route path="/support" element={<Authenticated><Support /></Authenticated>} />
          <Route path="/reports" element={<Authenticated><Reports /></Authenticated>} />
        </Route>

        {/* fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* ✅ Toast container mounted once for the whole app */}
      <ToastContainer position="top-right" autoClose={5000} />
    </>
  )
}
