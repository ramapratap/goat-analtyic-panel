import React, { useState, useEffect } from 'react';
import { ProductFeedback as ProductFeedbackType } from '../../types';
import { Download, Search, Star, MessageSquare, User } from 'lucide-react';
import { format } from 'date-fns';

interface ProductFeedbackProps {
  onExport: (type: 'feedback', format: 'csv' | 'json') => void;
}

const ProductFeedback: React.FC<ProductFeedbackProps> = ({ onExport }) => {
  const [feedback, setFeedback] = useState<ProductFeedbackType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedRating, setSelectedRating] = useState('all');

  useEffect(() => {
    fetchFeedback();
  }, []);

  const fetchFeedback = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/analytics/product-feedback', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setFeedback(data);
      }
    } catch (error) {
      console.error('Failed to fetch feedback:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredFeedback = feedback.filter(item => {
    const matchesSearch = item.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.feedback.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesRating = selectedRating === 'all' || 
                         (selectedRating === '5' && item.rating === 5) ||
                         (selectedRating === '4' && item.rating === 4) ||
                         (selectedRating === '3' && item.rating === 3) ||
                         (selectedRating === '2' && item.rating === 2) ||
                         (selectedRating === '1' && item.rating === 1);
    
    return matchesSearch && matchesCategory && matchesRating;
  });

  const categories = [...new Set(feedback.map(item => item.category))];
  const avgRating = feedback.length > 0 ? 
    feedback.reduce((sum, item) => sum + item.rating, 0) / feedback.length : 0;

  const ratingDistribution = [1, 2, 3, 4, 5].map(rating => ({
    rating,
    count: feedback.filter(item => item.rating === rating).length
  }));

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
      />
    ));
  };

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
        <h2 className="text-2xl font-bold text-gray-900">Product Feedback</h2>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onExport('feedback', 'csv')}
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
            <MessageSquare className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Total Feedback</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900">{feedback.length}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <Star className="w-5 h-5 text-yellow-600" />
            <h3 className="text-lg font-semibold text-gray-900">Average Rating</h3>
          </div>
          <div className="flex items-center gap-2">
            <p className="text-3xl font-bold text-gray-900">{avgRating.toFixed(1)}</p>
            <div className="flex">{renderStars(Math.round(avgRating))}</div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <User className="w-5 h-5 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-900">Unique Users</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {new Set(feedback.map(item => item.userId)).size}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <Star className="w-5 h-5 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-900">5-Star Reviews</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {feedback.filter(item => item.rating === 5).length}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Rating Distribution</h3>
        <div className="space-y-2">
          {ratingDistribution.reverse().map(({ rating, count }) => (
            <div key={rating} className="flex items-center gap-4">
              <div className="flex items-center gap-1 w-16">
                <span className="text-sm font-medium">{rating}</span>
                <Star className="w-4 h-4 text-yellow-400 fill-current" />
              </div>
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-yellow-400 h-2 rounded-full"
                  style={{ width: `${feedback.length > 0 ? (count / feedback.length) * 100 : 0}%` }}
                />
              </div>
              <span className="text-sm text-gray-600 w-12">{count}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <div className="relative flex-1 min-w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search feedback..."
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
            value={selectedRating}
            onChange={(e) => setSelectedRating(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Ratings</option>
            <option value="5">5 Stars</option>
            <option value="4">4 Stars</option>
            <option value="3">3 Stars</option>
            <option value="2">2 Stars</option>
            <option value="1">1 Star</option>
          </select>
        </div>

        <div className="space-y-4">
          {filteredFeedback.map((item, index) => (
            <div key={item.id} className={`p-4 rounded-lg border ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-medium text-gray-900">{item.productName}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex">{renderStars(item.rating)}</div>
                    <span className="text-sm text-gray-600">({item.rating}/5)</span>
                    <span className="text-sm text-gray-500">•</span>
                    <span className="text-sm text-gray-500">{item.category}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">User: {item.userId}</p>
                  <p className="text-xs text-gray-500">{format(new Date(item.timestamp), 'MMM dd, yyyy')}</p>
                </div>
              </div>
              <p className="text-gray-700 text-sm leading-relaxed">{item.feedback}</p>
            </div>
          ))}
        </div>

        {filteredFeedback.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No feedback found matching your criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductFeedback;