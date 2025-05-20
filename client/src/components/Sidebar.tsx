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
      <div className="flex items-center justify-center h-16 px-4 bg-primary text-white">
        <h1 className="text-xl font-medium">MC Plumbing Admin</h1>
      </div>
      <nav className="flex-1 px-2 py-4 bg-white">
        {Object.entries(navItemGroups).map(([group, items]) => (
          <div key={group} className="mb-6">
            <h2 className="px-4 text-xs font-semibold text-neutral-dark uppercase tracking-wider">
              {group}
            </h2>
            <div className="mt-2">
              {items.map((item) => (
                <Link
                  key={item.path}
                  href={item.path}
                  onClick={onClose}
                  className={`group flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                    isActive(item.path)
                      ? "text-white bg-primary"
                      : "text-neutral-darker hover:text-primary hover:bg-neutral-light"
                  }`}
                >
                  <span className={`material-icons mr-3 ${isActive(item.path) ? "text-white" : "text-neutral-dark"}`}>
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
