import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

import Layout from './components/layOut'
import LoginPage from './pages/login/logInPage'
import Dashboard from './pages/dashboard'
import AdminPage from './pages/admin/adminPage'
import ServiceDeliveryPage from './pages/service-delivery/serviceDeliveryPage'

export default function App() {
  return (
    <>
      <Routes>
        {/* Public route: Login (no layout) */}
        <Route path="/" element={<LoginPage />} />

        {/* Routes that show the layout chrome */}
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/admins" element={<AdminPage />} />
          <Route path="/service-delivery" element={<ServiceDeliveryPage />} />
        </Route>

        {/* fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* ✅ Toast container mounted once for the whole app */}
      <ToastContainer position="top-right" autoClose={3000} />
    </>
  )
}
