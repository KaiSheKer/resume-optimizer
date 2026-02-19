"use client";

import { useState, useRef, useEffect } from "react";

interface Tab {
  id: string;
  label: string;
}

interface TabsProps {
  tabs: Tab[];
  defaultTab?: string;
  onChange?: (tabId: string) => void;
  children: (activeTab: string) => React.ReactNode;
}

export function Tabs({ tabs, defaultTab, onChange, children }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id);
  const [indicatorStyle, setIndicatorStyle] = useState({
    left: 0,
    width: 0,
  });
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    const activeIndex = tabs.findIndex((tab) => tab.id === activeTab);
    const activeElement = tabRefs.current[activeIndex];

    if (activeElement) {
      setIndicatorStyle({
        left: activeElement.offsetLeft,
        width: activeElement.offsetWidth,
      });
    }
  }, [activeTab, tabs]);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    onChange?.(tabId);
  };

  return (
    <div className="w-full">
      {/* Tab Headers */}
      <div className="relative border-b border-claude-border dark:border-gray-700">
        <div className="flex space-x-8">
          {tabs.map((tab, index) => (
            <button
              key={tab.id}
              ref={(el) => { tabRefs.current[index] = el; }}
              onClick={() => handleTabChange(tab.id)}
              className={`relative pb-3 px-1 text-sm font-medium transition-colors duration-200 ${
                activeTab === tab.id
                  ? "text-claude-text-primary dark:text-white"
                  : "text-claude-text-secondary dark:text-gray-400 hover:text-claude-text-primary dark:hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        {/* Indicator */}
        <div
          className="absolute bottom-0 h-0.5 bg-claude-orange transition-all duration-300 ease-in-out"
          style={{
            left: `${indicatorStyle.left}px`,
            width: `${indicatorStyle.width}px`,
          }}
        />
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {children(activeTab)}
      </div>
    </div>
  );
}
