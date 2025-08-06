// import React from 'react';
// import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import './App.css';
import SidebarContext from './contexts/SidebarContext';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Layout from './layouts/Layout';
import Dashboard from './components/Dashboard';
import ChatContext from './contexts/ChatContext';


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
    <ChatContext>
      <SidebarContext>
        {/* <div className="app-container">
        <Sidebar />
        <ChatArea />
      </div> */}
        <RouterProvider router={router} />

      </SidebarContext>
    </ChatContext>
  );
}

export default App;
