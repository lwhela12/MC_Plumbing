import React from "react";
import { Link, useLocation } from "wouter";

interface SidebarProps {
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onClose }) => {
  const [location] = useLocation();

  const isActive = (path: string) => {
    return location === path;
  };

  const navItems = [
    { path: "/", label: "Dashboard", icon: "dashboard", group: "Payroll" },
    { path: "/weekly-payroll", label: "Weekly Payroll", icon: "paid", group: "Payroll" },
    { path: "/reports", label: "Reports", icon: "content_paste", group: "Payroll" },
    { path: "/plumbers", label: "Plumbers", icon: "people", group: "Management" },
    { path: "/settings", label: "Settings", icon: "settings", group: "Management" },
  ];

  const navItemGroups = navItems.reduce((groups, item) => {
    if (!groups[item.group]) {
      groups[item.group] = [];
    }
    groups[item.group].push(item);
    return groups;
  }, {} as Record<string, typeof navItems>);

  return (
    <>
      <div className="flex items-center justify-between h-16 px-4 bg-sidebar-primary">
        <h1 className="text-xl font-bold text-sidebar-primary-foreground">MC Plumbing</h1>
      </div>
      <nav className="flex-1 px-3 py-4 bg-sidebar-background overflow-y-auto">
        {Object.entries(navItemGroups).map(([group, items]) => (
          <div key={group} className="mb-6">
            <h2 className="px-2 mb-2 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/70">
              {group}
            </h2>
            <div className="space-y-1">
              {items.map((item) => (
                <Link
                  key={item.path}
                  href={item.path}
                  onClick={onClose}
                  className={`sidebar-item ${isActive(item.path) ? "active" : ""}`}
                >
                  <span className="material-icons text-[20px]">
                    {item.icon}
                  </span>
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </nav>
    </>
  );
};

export default Sidebar;
