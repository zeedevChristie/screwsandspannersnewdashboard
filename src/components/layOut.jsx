import React from 'react'
import { Outlet } from 'react-router-dom'
import Navbar from './navBar'
import Sidebar from './sidebar'

export default function Layout() {
  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />

      <div
        className="
          flex-1 flex flex-col h-screen overflow-y-scroll 
          [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden
        "
      >
        <Navbar />
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
