// import React from 'react';
// import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import './App.css';
import SidebarContext from './contexts/SidebarContext';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Layout from './layouts/layout';
import Dashboard from './components/Dashboard';


function App() {
  const router = createBrowserRouter([
    {
      element: <Layout />,
      children: [{
        path: "/",
        element: <Dashboard />
      },
      {
        path: "/chat/:id",
        element: <ChatArea />
      }]
    }
  ])
  return (
    <SidebarContext>
      {/* <div className="app-container">
        <Sidebar />
        <ChatArea />
      </div> */}
      <RouterProvider router={router} />

    </SidebarContext>
  );
}

export default App;
