import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

import Layout from './components/layOut'
import LoginPage from './pages/login/logInPage'
import Dashboard from './pages/dashboard'
import AdminPage from './pages/admin/adminPage'
import ServiceDeliveryPage from './pages/service-delivery/serviceDeliveryPage'
import Suppliers from './pages/supplier/suppliers'
import PromotionsAndSub from './pages/promotions/promotionsAndSub'
import Support from './pages/support/support'
import Reports from './pages/reports/reports'


const Authenticated = ({ children }) => {
  const token = localStorage.getItem("authToken");
};

export default function App() {
  return (
    <>
      <Routes>
        {/* Public route: Login (no layout) */}
        <Route path="/" element={<LoginPage />} />

        {/* Routes that show the layout */}
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Authenticated><Dashboard /></Authenticated>} />
          <Route path="/admins" element={<Authenticated><AdminPage /></Authenticated>} />
          <Route path="/service-delivery" element={<Authenticated><ServiceDeliveryPage /></Authenticated>} />
          <Route path="/suppliers" element={<Authenticated><Suppliers /></Authenticated>} />
          <Route path="/promotions" element={<Authenticated><PromotionsAndSub /></Authenticated>} />
          <Route path="/support" element={<Authenticated><Support /></Authenticated>} />
          <Route path="/reports" element={<Authenticated><Reports /></Authenticated>} />
        </Route>

        {/* fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* ✅ Toast container mounted once for the whole app */}
      <ToastContainer position="top-right" autoClose={3000} />
    </>
  )
}
