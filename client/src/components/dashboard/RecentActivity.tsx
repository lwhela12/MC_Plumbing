import React from "react";
import { useQuery } from "@tanstack/react-query";
import { formatDate } from "@/lib/dateUtils";
import { Job, Payroll, Plumber } from "@shared/schema";

interface Activity {
  id: number;
  type: "job" | "plumber" | "payroll";
  message: string;
  date: Date;
  icon: string;
  iconClass: string;
}

const RecentActivity: React.FC = () => {
  const { data: activities, isLoading } = useQuery<Activity[]>({
    queryKey: ["/api/activities"],
    queryFn: async () => {
      // For simplicity, we'll create some mock activities based on actual data
      const [jobs, plumbers, payrolls] = await Promise.all([
        fetch("/api/jobs").then(res => res.json()) as Promise<Job[]>,
        fetch("/api/plumbers").then(res => res.json()) as Promise<Plumber[]>,
        fetch("/api/payrolls").then(res => res.json()) as Promise<Payroll[]>
      ]);
      
      const activities: Activity[] = [];
      
      // Add job activities
      jobs.slice(0, 2).forEach((job, index) => {
        const plumber = plumbers.find(p => p.id === job.plumberId);
        if (plumber) {
          activities.push({
            id: job.id,
            type: "job",
            message: `Added payroll entry for ${plumber.name}`,
            date: new Date(job.date),
            icon: "edit",
            iconClass: "bg-primary-light bg-opacity-20 text-primary",
          });
        }
      });
      
      // Add plumber activities
      if (plumbers.length > 0) {
        activities.push({
          id: plumbers[0].id,
          type: "plumber",
          message: `Updated commission rate for ${plumbers[0].name}`,
          date: new Date(Date.now() - 24 * 60 * 60 * 1000), // yesterday
          icon: "person",
          iconClass: "bg-secondary-light bg-opacity-20 text-secondary",
        });
      }
      
      // Add payroll activities
      if (payrolls.length > 0) {
        activities.push({
          id: payrolls[0].id * 100, // Using a multiplier to create a unique ID
          type: "payroll",
          message: "Generated weekly payroll report",
          date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // a week ago
          icon: "article",
          iconClass: "bg-primary-light bg-opacity-20 text-primary",
        });
        
        activities.push({
          id: payrolls[0].id * 100 + 1, // Adding 1 to ensure uniqueness
          type: "payroll",
          message: "Payroll finalized for previous week",
          date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // a week ago
          icon: "notifications",
          iconClass: "bg-warning-light bg-opacity-20 text-warning",
        });
      }
      
      return activities.sort((a, b) => b.date.getTime() - a.date.getTime());
    },
    refetchInterval: false,
  });

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-card p-6">
        <h2 className="text-lg font-medium text-neutral-darker mb-4">Recent Activity</h2>
        <div className="space-y-4">
          <p className="text-sm text-neutral-dark">Loading activities...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-card p-6">
      <h2 className="text-lg font-medium text-neutral-darker mb-4">Recent Activity</h2>
      <div className="space-y-4">
        {activities && activities.length > 0 ? (
          activities.map((activity) => (
            <div key={`${activity.type}-${activity.id}-${activity.message}`} className="flex items-start">
              <div className={`p-2 rounded-full ${activity.iconClass} mr-3`}>
                <span className="material-icons text-sm">{activity.icon}</span>
              </div>
              <div>
                <p className="text-sm font-medium text-neutral-darker">{activity.message}</p>
                <p className="text-xs text-neutral-dark">{formatDate(activity.date)}</p>
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-neutral-dark">No recent activities</p>
        )}
      </div>
    </div>
  );
};

export default RecentActivity;
