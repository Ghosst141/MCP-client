import { useContext } from 'react'
import Sidebar from '../components/Sidebar'
import { Outlet } from 'react-router-dom'
import { SideContext } from '../contexts/SidebarContext'

function Layout() {
  const context = useContext(SideContext);
  if (!context) throw new Error("SidebarContext is undefined");
  
  const { isSideopen, setSideOpen } = context;

  const handleOverlayClick = () => {
    setSideOpen(false);
  };

  return (
    <div className='app-container'>
      <Sidebar />
      {/* Mobile overlay */}
      <div 
        className={`sidebar-overlay ${!isSideopen ? '' : 'active'}`}
        onClick={handleOverlayClick}
      ></div>
      <Outlet />
    </div>
  )
}

export default Layout

// export default Layout