import React from 'react'
import Sidebar from '../components/Sidebar'
import { Outlet } from 'react-router-dom'

function Layout() {
  return (
    <div className='app-container'>
      <Sidebar />
      <Outlet />
    </div>
  )
}

export default Layout