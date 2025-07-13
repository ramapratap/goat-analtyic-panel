import React, { useState } from 'react';
import { UserFlow } from '../../types';
import { Download, Filter, Search, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';

interface UserFlowAnalyticsProps {
  userFlows: UserFlow[];
  onExport: (type: 'flows', format: 'csv' | 'json') => void;
}

const UserFlowAnalytics: React.FC<UserFlowAnalyticsProps> = ({ userFlows, onExport }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSource, setSelectedSource] = useState('all');
  const [selectedAction, setSelectedAction] = useState('all');

  const filteredFlows = userFlows.filter(flow => {
    const matchesSearch = flow.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         flow.source.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         flow.destination.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSource = selectedSource === 'all' || flow.source === selectedSource;
    const matchesAction = selectedAction === 'all' || flow.action === selectedAction;
    
    return matchesSearch && matchesSource && matchesAction;
  });

  const sources = [...new Set(userFlows.map(flow => flow.source))];
  const actions = [...new Set(userFlows.map(flow => flow.action))];

  const getActionColor = (action: string) => {
    switch (action) {
      case 'view': return 'bg-blue-100 text-blue-800';
      case 'click': return 'bg-green-100 text-green-800';
      case 'purchase': return 'bg-purple-100 text-purple-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">User Flow Analytics</h2>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onExport('flows', 'csv')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <div className="relative flex-1 min-w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search flows..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <select
            value={selectedSource}
            onChange={(e) => setSelectedSource(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Sources</option>
            {sources.map(source => (
              <option key={source} value={source}>{source}</option>
            ))}
          </select>

          <select
            value={selectedAction}
            onChange={(e) => setSelectedAction(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Actions</option>
            {actions.map(action => (
              <option key={action} value={action}>{action}</option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-900">Timestamp</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">User ID</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Source</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Destination</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Action</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Session</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Details</th>
              </tr>
            </thead>
            <tbody>
              {filteredFlows.map((flow, index) => (
                <tr key={flow.id} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                  <td className="py-3 px-4 text-sm text-gray-900">
                    {format(new Date(flow.timestamp), 'MMM dd, HH:mm')}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-900 font-mono">
                    {flow.userId.substring(0, 8)}...
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-900">
                    {flow.source}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-900">
                    {flow.destination}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getActionColor(flow.action)}`}>
                      {flow.action}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-900 font-mono">
                    {flow.sessionId.substring(0, 8)}...
                  </td>
                  <td className="py-3 px-4">
                    <button className="text-blue-600 hover:text-blue-800">
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredFlows.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No user flows found matching your criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserFlowAnalytics;