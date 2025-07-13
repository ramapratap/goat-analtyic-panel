import React, { useState, useEffect } from 'react';
import { HeroDeal } from '../../types';
import { Download, Search, ExternalLink, Tag, Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface HeroDealsProps {
  onExport: (type: 'hero-deals', format: 'csv' | 'json') => void;
}

const HeroDeals: React.FC<HeroDealsProps> = ({ onExport }) => {
  const [deals, setDeals] = useState<HeroDeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedVertical, setSelectedVertical] = useState('all');

  useEffect(() => {
    fetchDeals();
  }, []);

  const fetchDeals = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/analytics/hero-deals', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setDeals(data);
      }
    } catch (error) {
      console.error('Failed to fetch hero deals:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredDeals = deals.filter(deal => {
    const matchesSearch = deal.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         deal.deal.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         deal.fsn.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || deal.category === selectedCategory;
    const matchesVertical = selectedVertical === 'all' || deal.vertical === selectedVertical;
    
    return matchesSearch && matchesCategory && matchesVertical;
  });

  const categories = [...new Set(deals.map(deal => deal.category))];
  const verticals = [...new Set(deals.map(deal => deal.vertical))];

  const getDealValue = (dealText: string): number => {
    const match = dealText.match(/(\d+)/);
    return match ? parseInt(match[1]) : 0;
  };

  const totalDeals = deals.length;
  const avgDealValue = deals.length > 0 ? 
    deals.reduce((sum, deal) => sum + getDealValue(deal.deal), 0) / deals.length : 0;

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Hero Deals</h2>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onExport('hero-deals', 'csv')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <Tag className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Total Deals</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900">{totalDeals}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <Tag className="w-5 h-5 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-900">Categories</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900">{categories.length}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <Tag className="w-5 h-5 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-900">Verticals</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900">{verticals.length}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <Tag className="w-5 h-5 text-orange-600" />
            <h3 className="text-lg font-semibold text-gray-900">Avg Deal Value</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900">₹{avgDealValue.toFixed(0)}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <div className="relative flex-1 min-w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search deals..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Categories</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>

          <select
            value={selectedVertical}
            onChange={(e) => setSelectedVertical(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Verticals</option>
            {verticals.map(vertical => (
              <option key={vertical} value={vertical}>{vertical}</option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-900">Product</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Category</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Vertical</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Deal</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">FSN</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Date</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Link</th>
              </tr>
            </thead>
            <tbody>
              {filteredDeals.map((deal, index) => (
                <tr key={deal.id} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                  <td className="py-3 px-4">
                    <div>
                      <p className="font-medium text-gray-900">{deal.productName}</p>
                      <p className="text-sm text-gray-600">{deal.verticalCleaning}</p>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-900">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                      {deal.category}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-900">
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                      {deal.vertical}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-medium">
                      {deal.deal}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-900 font-mono">
                    {deal.fsn}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-900">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      {format(new Date(deal.timestamp), 'MMM dd, yyyy')}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    {deal.productLink && (
                      <a
                        href={deal.productLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredDeals.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No deals found matching your criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default HeroDeals;