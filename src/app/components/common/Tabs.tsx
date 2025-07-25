import React from 'react';

interface TabProps {
  children: React.ReactNode;
  activeTab: string;
  onChange: (tab: string) => void;
}

interface TabItemProps {
  value: string;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export function Tabs({ children, activeTab, onChange }: TabProps) {
  return (
    <div className="w-full">
      <div className="flex space-x-1 border-b border-gray-200">
        {React.Children.map(children, (child) => {
          if (React.isValidElement<TabItemProps>(child)) {
            const isActive = activeTab === child.props.value;
            return (
              <button
                onClick={() => !child.props.disabled && onChange(child.props.value)}
                disabled={child.props.disabled}
                className={`
                  flex items-center space-x-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors
                  ${isActive 
                    ? 'border-blue-500 text-blue-600 bg-blue-50' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                  ${child.props.disabled 
                    ? 'opacity-50 cursor-not-allowed' 
                    : 'cursor-pointer'
                  }
                `}
              >
                {child.props.icon}
                <span>{child.props.label}</span>
              </button>
            );
          }
          return child;
        })}
      </div>
    </div>
  );
}

export function TabItem({ value, label, icon, disabled }: TabItemProps) {
  // This component is used for defining tab structure, actual rendering is handled by Tabs
  return null;
}

interface TabPanelProps {
  value: string;
  activeTab: string;
  children: React.ReactNode;
}

export function TabPanel({ value, activeTab, children }: TabPanelProps) {
  if (value !== activeTab) return null;
  
  return (
    <div className="mt-6">
      {children}
    </div>
  );
}