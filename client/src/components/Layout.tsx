import React from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  return (
    <div className="app-container">
      {/* Sidebar for mobile (hidden by default) */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div 
            className="fixed inset-0 bg-gray-600 bg-opacity-50"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="fixed left-0 top-0 bottom-0 flex flex-col w-64 max-w-xs bg-white shadow-lg">
            <Sidebar onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Sidebar for desktop */}
      <div className="sidebar">
        <Sidebar />
      </div>

      {/* Main content */}
      <div className="main-content">
        <Header onOpenSidebar={() => setSidebarOpen(true)} />
        <main className="main-area">{children}</main>
      </div>
    </div>
  );
};

export default Layout;
