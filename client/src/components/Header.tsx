import React from "react";

interface HeaderProps {
  onOpenSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ onOpenSidebar }) => {
  return (
    <header className="flex items-center justify-between h-16 px-4 bg-white shadow-sm">
      <button 
        className="md:hidden p-2 rounded-md text-neutral-dark hover:text-neutral-darker"
        onClick={onOpenSidebar}
      >
        <span className="material-icons">menu</span>
      </button>
      <div className="flex items-center ml-auto">
        <div className="ml-3 relative">
          <div className="flex items-center">
            <span className="text-sm font-medium text-neutral-darker mr-2">Admin User</span>
            <button className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white">
              <span className="material-icons text-sm">person</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
