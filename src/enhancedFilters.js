// enhancedFilters.js - Enhanced Filter Components for Overview Page

import React, { useState, useEffect, useRef } from 'react';
import { Calendar, Search, X, Filter, ChevronDown } from 'lucide-react';

// Searchable Dropdown Component
const SearchableDropdown = ({ 
  options, 
  value, 
  onChange, 
  placeholder, 
  label,
  disabled = false 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);

  const filteredOptions = options.filter(option =>
    option.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedOption = value ? options.find(opt => opt === value) : null;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (option) => {
    onChange(option);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange(null);
    setSearchTerm('');
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <div
        className={`relative border border-gray-300 rounded-lg px-3 py-2 bg-white cursor-pointer hover:border-gray-400 transition-colors ${
          disabled ? 'bg-gray-50 cursor-not-allowed' : ''
        }`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <div className="flex items-center justify-between">
          <span className={`${selectedOption ? 'text-gray-900' : 'text-gray-500'}`}>
            {selectedOption || placeholder}
          </span>
          <div className="flex items-center space-x-1">
            {selectedOption && !disabled && (
              <X 
                className="h-4 w-4 text-gray-400 hover:text-gray-600" 
                onClick={handleClear}
              />
            )}
            <ChevronDown 
              className={`h-4 w-4 text-gray-400 transition-transform ${
                isOpen ? 'rotate-180' : ''
              }`} 
            />
          </div>
        </div>
      </div>

      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-hidden">
          {/* Search Input */}
          <div className="p-2 border-b border-gray-200">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder={`Search ${label.toLowerCase()}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>

          {/* Options List */}
          <div className="max-h-48 overflow-y-auto">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option, index) => (
                <div
                  key={index}
                  className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                  onClick={() => handleSelect(option)}
                >
                  {option}
                </div>
              ))
            ) : (
              <div className="px-3 py-2 text-sm text-gray-500">
                No results found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Date Range Picker Component
const DateRangePicker = ({ value, onChange, label }) => {
  const [startDate, endDate] = value;

  const handleStartDateChange = (date) => {
    onChange([date, endDate]);
  };

  const handleEndDateChange = (date) => {
    onChange([startDate, date]);
  };

  const clearDates = () => {
    onChange(['', '']);
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <div className="grid grid-cols-2 gap-2">
        <div className="relative">
          <Calendar className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="date"
            value={startDate}
            onChange={(e) => handleStartDateChange(e.target.value)}
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="Start Date"
          />
        </div>
        <div className="relative">
          <Calendar className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="date"
            value={endDate}
            onChange={(e) => handleEndDateChange(e.target.value)}
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="End Date"
          />
        </div>
      </div>
      {(startDate || endDate) && (
        <button
          onClick={clearDates}
          className="mt-1 text-xs text-red-600 hover:text-red-800"
        >
          Clear dates
        </button>
      )}
    </div>
  );
};

// Main Enhanced Filters Component
const EnhancedOverviewFilters = ({ 
  filters, 
  setFilters, 
  sampleOrderData,
  isFiltersVisible,
  setIsFiltersVisible 
}) => {
  // Get unique values for dropdowns
  const uniqueMRs = [...new Set(sampleOrderData.map(order => order.medicalRepresentative || order.salesRepresentative || 'N/A'))].filter(Boolean).sort();
  const uniqueFulfillmentCenters = [...new Set(sampleOrderData.map(order => order.deliveredFrom))].filter(Boolean).sort();
  const uniqueStates = [...new Set(sampleOrderData.map(order => order.state))].filter(Boolean).sort();

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Clear all filters
  const clearAllFilters = () => {
    setFilters(prev => ({
      ...prev,
      dateRange: ['', ''],
      selectedMR: null,
      selectedFulfillmentCenter: null,
      selectedState: null
    }));
  };

  // Count active filters
  const activeFiltersCount = [
    filters.dateRange?.[0] || filters.dateRange?.[1],
    filters.selectedMR,
    filters.selectedFulfillmentCenter,
    filters.selectedState,
    filters.searchTerm,
    filters.selectedFulfillment,
    filters.selectedCategory,
    filters.selectedTopProduct
  ].filter(Boolean).length;

  return (
    <div className="bg-white rounded-lg shadow-md mb-6">
      {/* Filter Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Filter className="h-5 w-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Advanced Filters
            </h3>
            {activeFiltersCount > 0 && (
              <span className="bg-green-100 text-green-800 text-sm px-2 py-1 rounded-full">
                {activeFiltersCount} active
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {activeFiltersCount > 0 && (
              <button
                onClick={clearAllFilters}
                className="text-sm text-red-600 hover:text-red-800 px-3 py-1 rounded-md hover:bg-red-50"
              >
                Clear All
              </button>
            )}
            <button
              onClick={() => setIsFiltersVisible(!isFiltersVisible)}
              className="flex items-center space-x-1 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 rounded-md hover:bg-gray-50"
            >
              <span>{isFiltersVisible ? 'Hide' : 'Show'} Filters</span>
              <ChevronDown 
                className={`h-4 w-4 transition-transform ${
                  isFiltersVisible ? 'rotate-180' : ''
                }`} 
              />
            </button>
          </div>
        </div>
      </div>

      {/* Filter Content */}
      {isFiltersVisible && (
        <div className="px-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Date Range Filter */}
            <DateRangePicker
              value={filters.dateRange || ['', '']}
              onChange={(value) => handleFilterChange('dateRange', value)}
              label="Date Range"
            />

            {/* Medical Representative Filter */}
            <SearchableDropdown
              options={uniqueMRs}
              value={filters.selectedMR}
              onChange={(value) => handleFilterChange('selectedMR', value)}
              placeholder="Select Medical Rep..."
              label="Medical Representative"
            />

            {/* Order Fulfillment Filter */}
            <SearchableDropdown
              options={uniqueFulfillmentCenters}
              value={filters.selectedFulfillmentCenter}
              onChange={(value) => handleFilterChange('selectedFulfillmentCenter', value)}
              placeholder="Select Fulfillment..."
              label="Order Fulfillment"
            />

            {/* State Filter */}
            <SearchableDropdown
              options={uniqueStates}
              value={filters.selectedState}
              onChange={(value) => handleFilterChange('selectedState', value)}
              placeholder="Select State..."
              label="State"
            />
          </div>

          {/* Search Term (existing) */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search Orders
            </label>
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={filters.searchTerm || ''}
                onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Search by Order ID, Customer, Product, Category, or City..."
              />
              {filters.searchTerm && (
                <X 
                  className="h-4 w-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer" 
                  onClick={() => handleFilterChange('searchTerm', '')}
                />
              )}
            </div>
          </div>

          {/* Filter Summary */}
          {activeFiltersCount > 0 && (
            <div className="mt-4 p-3 bg-green-50 rounded-lg">
              <div className="flex items-start space-x-2">
                <Filter className="h-4 w-4 text-green-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-green-800">Active Filters:</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {filters.dateRange?.[0] && (
                      <span className="text-xs bg-white px-2 py-1 rounded-full text-green-700">
                        From: {new Date(filters.dateRange[0]).toLocaleDateString()}
                      </span>
                    )}
                    {filters.dateRange?.[1] && (
                      <span className="text-xs bg-white px-2 py-1 rounded-full text-green-700">
                        To: {new Date(filters.dateRange[1]).toLocaleDateString()}
                      </span>
                    )}
                    {filters.selectedMR && (
                      <span className="text-xs bg-white px-2 py-1 rounded-full text-green-700">
                        MR: {filters.selectedMR}
                      </span>
                    )}
                    {filters.selectedFulfillmentCenter && (
                      <span className="text-xs bg-white px-2 py-1 rounded-full text-green-700">
                        Fulfillment: {filters.selectedFulfillmentCenter}
                      </span>
                    )}
                    {filters.selectedState && (
                      <span className="text-xs bg-white px-2 py-1 rounded-full text-green-700">
                        State: {filters.selectedState}
                      </span>
                    )}
                    {filters.searchTerm && (
                      <span className="text-xs bg-white px-2 py-1 rounded-full text-green-700">
                        Search: "{filters.searchTerm}"
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export { EnhancedOverviewFilters, SearchableDropdown, DateRangePicker };
