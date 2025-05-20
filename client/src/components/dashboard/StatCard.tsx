import React from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: string;
  color: "primary" | "secondary";
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color }) => {
  const colorClasses = {
    primary: "bg-primary-light bg-opacity-20 text-primary",
    secondary: "bg-secondary-light bg-opacity-20 text-secondary",
  };

  return (
    <div className="bg-white rounded-lg shadow-card p-5">
      <div className="flex items-center">
        <div className={`p-3 rounded-full ${colorClasses[color]}`}>
          <span className="material-icons">{icon}</span>
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-neutral-dark">{title}</p>
          <p className="text-2xl font-semibold text-neutral-darker">{value}</p>
        </div>
      </div>
    </div>
  );
};

export default StatCard;
