import React from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-neutral-light">
      {/* Sidebar for mobile (hidden by default) */}
      <div 
        className={`${
          sidebarOpen ? "block" : "hidden"
        } fixed inset-0 z-40 md:hidden`}
      >
        <div 
          className="absolute inset-0 bg-black opacity-30"
          onClick={() => setSidebarOpen(false)}
        />
        <div className="relative flex flex-col w-64 h-full bg-white">
          <Sidebar onClose={() => setSidebarOpen(false)} />
        </div>
      </div>

      {/* Sidebar for desktop */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64">
          <Sidebar />
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header onOpenSidebar={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
};

export default Layout;
