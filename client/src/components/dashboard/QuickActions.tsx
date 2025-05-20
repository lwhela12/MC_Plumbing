import React from "react";
import { Link } from "wouter";

const QuickActions: React.FC = () => {
  const actions = [
    { label: "New Payroll Entry", icon: "add_circle", path: "/weekly-payroll" },
    { label: "Add Plumber", icon: "person_add", path: "/plumbers" },
    { label: "Generate Reports", icon: "assessment", path: "/reports" },
    { label: "View History", icon: "history", path: "/reports" },
  ];

  return (
    <div className="bg-white rounded-lg shadow-card p-6">
      <h2 className="text-lg font-medium text-neutral-darker mb-4">Quick Actions</h2>
      <div className="grid grid-cols-2 gap-4">
        {actions.map((action) => (
          <Link
            key={action.label}
            href={action.path}
            className="flex flex-col items-center justify-center p-4 border border-neutral rounded-lg hover:bg-neutral-light transition-colors"
          >
            <span className="material-icons text-primary mb-2">{action.icon}</span>
            <span className="text-sm font-medium text-neutral-darker">{action.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default QuickActions;
