import React from "react";

interface HeaderProps {
  onOpenSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ onOpenSidebar }) => {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 bg-background border-b border-border/40">
      <button 
        className="md:hidden flex items-center justify-center w-10 h-10 rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        onClick={onOpenSidebar}
      >
        <span className="material-icons">menu</span>
      </button>
      
      <div className="flex-1 md:flex md:justify-end">
        <div className="flex items-center gap-4">
          <button className="action-button action-button-secondary px-3 py-1.5 text-xs">
            <span className="material-icons text-sm">help_outline</span>
            <span>Help</span>
          </button>
          
          <div className="relative flex items-center">
            <span className="hidden md:block text-sm font-medium mr-2">Admin User</span>
            <button className="flex items-center justify-center w-9 h-9 rounded-full bg-primary text-primary-foreground hover:bg-primary/90">
              <span className="material-icons text-sm">person</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
