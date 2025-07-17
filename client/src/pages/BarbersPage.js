import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import { usersAPI } from '../services/api';
import { formatCurrency } from '../utils';
import { 
  Search, 
  Star, 
  MapPin, 
  Clock, 
  Filter,
  Grid,
  List,
  Users,
  Calendar
} from 'lucide-react';

const BarbersPage = () => {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('rating');
  const [viewMode, setViewMode] = useState('grid');
  const [currentPage, setCurrentPage] = useState(1);

  const { data: barbersData, isLoading } = useQuery(
    ['barbers', { search, sortBy, page: currentPage }],
    () => usersAPI.getBarbers({ search, sortBy, page: currentPage }),
    {
      keepPreviousData: true,
    }
  );

  const barbers = barbersData?.data.barbers || [];
  const totalPages = barbersData?.data.totalPages || 1;

  const handleSearch = (e) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };

  const handleSortChange = (value) => {
    setSortBy(value);
    setCurrentPage(1);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-64 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Find Your Barber</h1>
        <p className="text-gray-600">
          Discover skilled barbers in your area and book appointments instantly
        </p>
      </div>

      {/* Search & Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by name, shop, or location..."
              className="input pl-10 w-full"
              value={search}
              onChange={handleSearch}
            />
          </div>

          {/* Sort */}
          <div className="flex items-center space-x-4">
            <select
              value={sortBy}
              onChange={(e) => handleSortChange(e.target.value)}
              className="input"
            >
              <option value="rating">Sort by Rating</option>
              <option value="name">Sort by Name</option>
              <option value="newest">Sort by Newest</option>
            </select>

            {/* View Mode */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'grid' 
                    ? 'bg-primary-100 text-primary-600' 
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <Grid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'list' 
                    ? 'bg-primary-100 text-primary-600' 
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      {barbers.length > 0 ? (
        <>
          {/* Barbers Grid/List */}
          <div className={`grid gap-6 mb-8 ${
            viewMode === 'grid' 
              ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
              : 'grid-cols-1'
          }`}>
            {barbers.map((barber) => (
              <div key={barber._id} className="card hover:shadow-lg transition-shadow">
                <div className="card-body">
                  <div className="flex items-start space-x-4">
                    <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold text-lg">
                        {barber.name.charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-800 mb-1">
                        {barber.name}
                      </h3>
                      <p className="text-primary-600 font-medium mb-2">
                        {barber.shopName}
                      </p>
                      
                      {/* Rating */}
                      <div className="flex items-center space-x-1 mb-2">
                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                        <span className="text-sm font-medium">
                          {barber.rating.toFixed(1)}
                        </span>
                        <span className="text-sm text-gray-500">
                          ({barber.totalRatings} reviews)
                        </span>
                      </div>

                      {/* Location */}
                      <div className="flex items-center space-x-1 mb-3">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          {barber.shopAddress}
                        </span>
                      </div>

                      {/* Working Hours */}
                      <div className="flex items-center space-x-1 mb-4">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          {barber.workingHours?.start} - {barber.workingHours?.end}
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="flex space-x-2">
                        <Link
                          to={`/barber/${barber._id}`}
                          className="btn btn-primary flex-1 text-center"
                        >
                          View Details
                        </Link>
                        <Link
                          to={`/book/${barber._id}`}
                          className="btn btn-outline flex-1 text-center"
                        >
                          Book Now
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center space-x-2">
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    currentPage === i + 1
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12">
          <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            No barbers found
          </h3>
          <p className="text-gray-600 mb-4">
            Try adjusting your search criteria or check back later
          </p>
          <button
            onClick={() => {
              setSearch('');
              setSortBy('rating');
              setCurrentPage(1);
            }}
            className="btn btn-primary"
          >
            Clear Filters
          </button>
        </div>
      )}
    </div>
  );
};

export default BarbersPage;
