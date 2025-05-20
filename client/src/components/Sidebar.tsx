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
      <div className="sidebar-header">
        <h1 className="sidebar-brand">MC Plumbing</h1>
      </div>
      <div className="sidebar-body">
        {Object.entries(navItemGroups).map(([group, items]) => (
          <div key={group} className="mb-6">
            <h2 className="sidebar-section-title">
              {group}
            </h2>
            <div className="sidebar-nav">
              {items.map((item) => (
                <Link
                  key={item.path}
                  href={item.path}
                  onClick={onClose}
                  className={`sidebar-link ${isActive(item.path) ? "active" : ""}`}
                >
                  <span className="material-icons">
                    {item.icon}
                  </span>
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

export default Sidebar;
