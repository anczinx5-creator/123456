import React from 'react';
import { 
  Sprout, 
  TestTube, 
  Cpu, 
  Package, 
  BarChart3, 
  Search,
  Shield,
  FileText,
  List,
  MessageSquare,
  Settings
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface SidebarProps {
  isOpen: boolean;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, activeTab, onTabChange }) => {
  const { user } = useAuth();

  const getMenuItems = () => {
    const commonItems = [
      { id: 'tracking', label: 'Track Batch', icon: Search },
      { id: 'batches', label: 'Active Batches', icon: List },
      { id: 'audit', label: 'Audit Log', icon: FileText },
      { id: 'sms', label: 'SMS Simulator', icon: MessageSquare }
    ];

    if (user?.role === 1) { // Collector
      return [
        { id: 'collection', label: 'Collector Group', icon: Sprout },
        ...commonItems
      ];
    }

    if (user?.role === 2) { // Tester
      return [
        { id: 'quality', label: 'Testing Labs', icon: TestTube },
        ...commonItems
      ];
    }

    if (user?.role === 3) { // Processor
      return [
        { id: 'processing', label: 'Processing Unit', icon: Cpu },
        ...commonItems
      ];
    }

    if (user?.role === 4) { // Manufacturer
      return [
        { id: 'manufacturing', label: 'Manufacturing Plant', icon: Package },
        ...commonItems
      ];
    }

    // Consumer role (role 6)
    return [
      { id: 'consumer', label: 'Verify Product', icon: Shield },
      { id: 'rating', label: 'Rate Platform', icon: BarChart3 }
    ];
  };

  const menuItems = getMenuItems();

  return (
    <aside
      className={`
        fixed top-[73px] left-0 z-40 h-[calc(100vh-73px)] w-64 
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:h-[calc(100vh-73px)]
        bg-white/90 backdrop-blur-md border-r border-green-100
        flex flex-col
      `}
    >
      <nav className="h-full px-3 py-4 overflow-y-auto">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <li key={item.id}>
                <button
                  onClick={() => onTabChange(item.id)}
                  className={`
                    flex items-center w-full p-2 text-gray-900 rounded-lg
                    hover:bg-green-50 transition-colors
                    ${activeTab === item.id ? 'bg-green-100 text-green-700' : ''}
                  `}
                >
                  <IconComponent className="w-5 h-5 mr-3" />
                  <span>{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;