import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  BarChart3, 
  Users, 
  ShoppingCart, 
  Ticket, 
  TrendingUp, 
  Settings, 
  LogOut, 
  Shield,
  Eye,
  Edit
} from 'lucide-react';
import { clsx } from 'clsx';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange }) => {
  const { user, logout } = useAuth();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3, roles: ['admin', 'editor', 'viewer'] },
    { id: 'products', label: 'Product Analytics', icon: ShoppingCart, roles: ['admin', 'editor', 'viewer'] },
    { id: 'product-feedback', label: 'Product Feedback', icon: TrendingUp, roles: ['admin', 'editor', 'viewer'] },
    { id: 'coupons', label: 'Coupon Analytics', icon: Ticket, roles: ['admin', 'editor', 'viewer'] },
    { id: 'hero-deals', label: 'Hero Deals', icon: TrendingUp, roles: ['admin', 'editor', 'viewer'] },
    { id: 'user-flows', label: 'User Flows', icon: TrendingUp, roles: ['admin', 'editor', 'viewer'] },
    { id: 'users', label: 'User Management', icon: Users, roles: ['admin'] },
    { id: 'settings', label: 'Settings', icon: Settings, roles: ['admin', 'editor'] },
  ];

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Shield className="w-4 h-4" />;
      case 'editor': return <Edit className="w-4 h-4" />;
      case 'viewer': return <Eye className="w-4 h-4" />;
      default: return null;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'editor': return 'bg-blue-100 text-blue-800';
      case 'viewer': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="w-64 bg-white border-r border-gray-200 h-screen flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-900">Analytics Hub</h1>
        <div className="mt-3 flex items-center gap-2">
          <div className={clsx('px-2 py-1 rounded-full flex items-center gap-1 text-xs font-medium', getRoleColor(user?.role || ''))}>
            {getRoleIcon(user?.role || '')}
            {user?.role?.toUpperCase()}
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {menuItems
          .filter(item => item.roles.includes(user?.role || ''))
          .map(item => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={clsx(
                  'w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all duration-200',
                  activeTab === item.id
                    ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                )}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </button>
            );
          })}
      </nav>

      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-medium">
              {user?.name?.charAt(0) || user?.email?.charAt(0)}
            </span>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">{user?.name || user?.email}</p>
            <p className="text-xs text-gray-500">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-red-50 hover:text-red-700 transition-all duration-200"
        >
          <LogOut className="w-5 h-5" />
          Sign Out
        </button>
      </div>
    </div>
  );
};

export default Sidebar;