import React from "react";
import { TrendingUp, TrendingDown } from "lucide-react";

interface MetricsCardProps {
  title: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  trend?: number;
  color: "red" | "orange" | "purple" | "yellow" | "green" | "blue";
}

const colorClasses = {
  red: "bg-red-50 border-red-200 text-red-900",
  orange: "bg-orange-50 border-orange-200 text-orange-900",
  purple: "bg-purple-50 border-purple-200 text-purple-900",
  yellow: "bg-yellow-50 border-yellow-200 text-yellow-900",
  green: "bg-green-50 border-green-200 text-green-900",
  blue: "bg-blue-50 border-blue-200 text-blue-900",
};

const iconColorClasses = {
  red: "text-red-600",
  orange: "text-orange-600",
  purple: "text-purple-600",
  yellow: "text-yellow-600",
  green: "text-green-600",
  blue: "text-blue-600",
};

export const MetricsCard: React.FC<MetricsCardProps> = ({
  title,
  value,
  icon: Icon,
  trend,
  color,
}) => {
  return (
    <div className={`border rounded-lg p-6 ${colorClasses[color]}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <p className="text-sm font-medium opacity-75">{title}</p>
          <h3 className="text-3xl font-bold mt-2">{value.toLocaleString()}</h3>
        </div>
        <Icon className={`w-8 h-8 ${iconColorClasses[color]}`} />
      </div>

      {trend !== undefined && (
        <div className="flex items-center gap-1 text-sm">
          {trend > 0 ? (
            <>
              <TrendingUp className="w-4 h-4 text-red-600" />
              <span className="text-red-600 font-medium">
                +{trend}% from yesterday
              </span>
            </>
          ) : trend < 0 ? (
            <>
              <TrendingDown className="w-4 h-4 text-green-600" />
              <span className="text-green-600 font-medium">
                {trend}% from yesterday
              </span>
            </>
          ) : (
            <span className="text-gray-600">No change</span>
          )}
        </div>
      )}
    </div>
  );
};
