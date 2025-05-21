import React from "react";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";

interface HeaderProps {
  onOpenSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ onOpenSidebar }) => {
  const [location] = useLocation();

  const handleLogout = async () => {
    await apiRequest("POST", "/api/logout");
    window.location.href = "/";
  };
  
  // Get title based on current path
  const getTitle = () => {
    switch (location) {
      case "/":
        return "Dashboard";
      case "/weekly-payroll":
        return "Weekly Payroll";
      case "/reports":
        return "Reports";
      case "/plumbers":
        return "Plumbers";
      default:
        return "MC Plumbing";
    }
  };

  return (
    <header className="header">
      <div className="flex items-center">
        <button 
          className="md:hidden flex items-center justify-center w-10 h-10 rounded-md text-gray-500 hover:bg-gray-100 mr-2"
          onClick={onOpenSidebar}
        >
          <span className="material-icons">menu</span>
        </button>
        <h1 className="header-title">{getTitle()}</h1>
      </div>
      
      <div className="header-actions">
        <div className="flex items-center gap-4">
          <button className="btn btn-secondary px-3 py-1 text-xs hidden sm:flex items-center gap-1">
            <span className="material-icons text-sm">help_outline</span>
            <span>Help</span>
          </button>
          
          <button onClick={handleLogout} className="btn btn-secondary px-3 py-1 text-xs flex items-center gap-1">
            <span className="material-icons text-sm">logout</span>
            <span>Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
