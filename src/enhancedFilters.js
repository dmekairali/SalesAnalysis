// enhancedFilters.js - Enhanced Filter Components with Complete Access Control

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Calendar, Search, X, Filter, ChevronDown, Shield, Lock, AlertTriangle } from 'lucide-react';
import ReactDatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

// Searchable Dropdown Component with Access Control
const SearchableDropdown = ({ 
  options, 
  value, 
  onChange, 
  placeholder, 
  label,
  disabled = false,
  accessRestricted = false,
  restrictionMessage = "Limited options based on your access level",
  totalOptionsCount = null
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
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            {label}
            {accessRestricted && (
              <Shield className="inline h-3 w-3 ml-1 text-orange-500" title={restrictionMessage} />
            )}
          </div>
          {accessRestricted && totalOptionsCount && (
            <span className="text-xs text-orange-600 font-medium">
              {options.length}/{totalOptionsCount} available
            </span>
          )}
        </div>
      </label>
      <div
        className={`relative border rounded-lg px-3 py-2 bg-white cursor-pointer hover:border-gray-400 transition-colors ${
          disabled ? 'bg-gray-50 cursor-not-allowed border-gray-200' : 
          accessRestricted ? 'border-orange-200 bg-orange-50' : 'border-gray-300'
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

          {/* Access Restriction Warning */}
          {accessRestricted && (
            <div className="px-3 py-2 bg-orange-50 border-b border-orange-200">
              <div className="flex items-center text-xs text-orange-700">
                <Lock className="h-3 w-3 mr-1" />
                <span className="flex-1">{restrictionMessage}</span>
                {totalOptionsCount && (
                  <span className="font-medium">{options.length}/{totalOptionsCount}</span>
                )}
              </div>
            </div>
          )}

          {/* Options List */}
          <div className="max-h-48 overflow-y-auto">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option, index) => (
                <div
                  key={index}
                  className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm flex items-center justify-between"
                  onClick={() => handleSelect(option)}
                >
                  <span>{option}</span>
                  {accessRestricted && (
                    <Shield className="h-3 w-3 text-orange-400" />
                  )}
                </div>
              ))
            ) : (
              <div className="px-3 py-2 text-sm text-gray-500">
                {searchTerm ? 'No results found' : 'No options available'}
              </div>
            )}
          </div>

          {/* Footer with access info */}
          {accessRestricted && (
            <div className="px-3 py-2 bg-gray-50 border-t border-gray-200">
              <p className="text-xs text-gray-600">
                <Shield className="inline h-3 w-3 mr-1" />
                Options filtered by your access permissions
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Enhanced Date Range Picker (unchanged but with better styling)
const DateRangePicker = React.memo(({ value, onChange, label }) => {
  const [startDate, endDate] = value;

  const handleStartDateChange = (date) => {
    const dateString = date ? date.toISOString().split('T')[0] : '';
    onChange([dateString, endDate]);
  };

  const handleEndDateChange = (date) => {
    const dateString = date ? date.toISOString().split('T')[0] : '';
    onChange([startDate, dateString]);
  };

  const parseDate = (dateString) => {
    return dateString ? new Date(dateString) : null;
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <div className="grid grid-cols-2 gap-2">
        <div className="relative">
          <Calendar className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none z-10" />
          <ReactDatePicker
            selected={parseDate(startDate)}
            onChange={handleStartDateChange}
            selectsStart
            startDate={parseDate(startDate)}
            endDate={parseDate(endDate)}
            placeholderText="Start Date"
            dateFormat="yyyy-MM-dd"
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            wrapperClassName="w-full"
            popperClassName="react-datepicker-popper"
            calendarClassName="react-datepicker-calendar"
            showMonthDropdown
            showYearDropdown
            dropdownMode="select"
            isClearable={true}
            autoComplete="off"
          />
        </div>
        <div className="relative">
          <Calendar className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none z-10" />
          <ReactDatePicker
            selected={parseDate(endDate)}
            onChange={handleEndDateChange}
            selectsEnd
            startDate={parseDate(startDate)}
            endDate={parseDate(endDate)}
            minDate={parseDate(startDate)}
            placeholderText="End Date"
            dateFormat="yyyy-MM-dd"
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            wrapperClassName="w-full"
            popperClassName="react-datepicker-popper"
            calendarClassName="react-datepicker-calendar"
            showMonthDropdown
            showYearDropdown
            dropdownMode="select"
            isClearable={true}
            autoComplete="off"
          />
        </div>
      </div>
      <div className="text-xs text-gray-500 mt-1">
        Click calendar icon or type date. Navigate months/years with dropdowns.
      </div>
    </div>
  );
});

// Main Enhanced Filters Component with Complete Access Control
const EnhancedOverviewFilters = ({ 
  filters, 
  setFilters, 
  sampleOrderData,
  isFiltersVisible,
  setIsFiltersVisible,
  pendingFilters,
  setPendingFilters,
  availableOptions = {
    mrs: [],
    states: [],
    territories: [],
    fulfillmentCenters: []
  }
}) => {
  // Calculate all available options from data for comparison
  const allOptionsInData = React.useMemo(() => {
    return {
      mrs: [...new Set(sampleOrderData.map(order => 
        order.medicalRepresentative || order.salesRepresentative || 'N/A'
      ))].filter(Boolean).sort(),
      
      fulfillmentCenters: [...new Set(sampleOrderData.map(order => 
        order.deliveredFrom
      ))].filter(Boolean).sort(),
      
      states: [...new Set(sampleOrderData.map(order => 
        order.state
      ))].filter(Boolean).sort(),
      
      territories: [...new Set(sampleOrderData.map(order => 
        order.territory
      ))].filter(Boolean).sort()
    };
  }, [sampleOrderData]);

  // Use provided options or fallback to calculated ones
  const uniqueMRs = availableOptions.mrs.length > 0 ? availableOptions.mrs : allOptionsInData.mrs;
  const uniqueFulfillmentCenters = availableOptions.fulfillmentCenters.length > 0 ? availableOptions.fulfillmentCenters : allOptionsInData.fulfillmentCenters;
  const uniqueStates = availableOptions.states.length > 0 ? availableOptions.states : allOptionsInData.states;
  const uniqueTerritories = availableOptions.territories.length > 0 ? availableOptions.territories : allOptionsInData.territories;

  // Determine if options are access-restricted
  const mrAccessRestricted = uniqueMRs.length < allOptionsInData.mrs.length;
  const stateAccessRestricted = uniqueStates.length < allOptionsInData.states.length;
  const territoryAccessRestricted = uniqueTerritories.length < allOptionsInData.territories.length;
  const fulfillmentAccessRestricted = uniqueFulfillmentCenters.length < allOptionsInData.fulfillmentCenters.length;

  // Calculate restriction stats
  const restrictionStats = {
    total: allOptionsInData.mrs.length + allOptionsInData.states.length + allOptionsInData.territories.length + allOptionsInData.fulfillmentCenters.length,
    accessible: uniqueMRs.length + uniqueStates.length + uniqueTerritories.length + uniqueFulfillmentCenters.length,
    get percentage() {
      return this.total > 0 ? ((this.accessible / this.total) * 100).toFixed(1) : '100.0';
    }
  };

  // Handle pending filter changes (for Apply button)
  const handlePendingFilterChange = (key, value) => {
    setPendingFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Apply filters
  const applyFilters = () => {
    setFilters(prev => ({
      ...prev,
      ...pendingFilters
    }));
  };

  // Clear all pending filters (not applied filters)
  const clearAllPendingFilters = () => {
    setPendingFilters(prev => ({
      ...prev,
      dateRange: ['', ''],
      selectedMR: null,
      selectedFulfillmentCenter: null,
      selectedState: null
    }));
  };

  // Reset pending filters to match current applied filters
  const resetPendingToApplied = () => {
    setPendingFilters(prev => ({
      ...prev,
      dateRange: filters.dateRange,
      selectedMR: filters.selectedMR,
      selectedFulfillmentCenter: filters.selectedFulfillmentCenter,
      selectedState: filters.selectedState
    }));
  };

  // Check if there are pending changes
  const hasPendingChanges = JSON.stringify({
    dateRange: filters.dateRange,
    selectedMR: filters.selectedMR,
    selectedFulfillmentCenter: filters.selectedFulfillmentCenter,
    selectedState: filters.selectedState
  }) !== JSON.stringify({
    dateRange: pendingFilters.dateRange,
    selectedMR: pendingFilters.selectedMR,
    selectedFulfillmentCenter: pendingFilters.selectedFulfillmentCenter,
    selectedState: pendingFilters.selectedState
  });

  // Count active filters (excluding table search and general search)
  const activeFiltersCount = [
    filters.dateRange?.[0] || filters.dateRange?.[1],
    filters.selectedMR,
    filters.selectedFulfillmentCenter,
    filters.selectedState,
    filters.selectedFulfillment,
    filters.selectedCategory,
    filters.selectedTopProduct
  ].filter(Boolean).length;

  // Check if any access restrictions are in place
  const hasAccessRestrictions = mrAccessRestricted || stateAccessRestricted || territoryAccessRestricted || fulfillmentAccessRestricted;

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
            {hasAccessRestrictions && (
              <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full flex items-center">
                <Shield className="h-3 w-3 mr-1" />
                Access Filtered ({restrictionStats.percentage}% available)
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={clearAllPendingFilters}
              className="text-sm text-red-600 hover:text-red-800 px-3 py-1 rounded-md hover:bg-red-50 transition-colors"
            >
              Clear Filters
            </button>
            <button
              onClick={() => setIsFiltersVisible(!isFiltersVisible)}
              className="flex items-center space-x-1 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 rounded-md hover:bg-gray-50 transition-colors"
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
          {/* Access Control Notice */}
          {hasAccessRestrictions && (
            <div className="mb-4 p-4 bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200 rounded-lg">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-orange-800 mb-2">
                    Access-Controlled Filters Applied
                  </h4>
                  <div className="text-sm text-orange-700 space-y-1">
                    <p>Filter options are limited based on your access permissions:</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                      {mrAccessRestricted && (
                        <div className="text-xs bg-white bg-opacity-60 px-2 py-1 rounded">
                          MRs: {uniqueMRs.length}/{allOptionsInData.mrs.length}
                        </div>
                      )}
                      {stateAccessRestricted && (
                        <div className="text-xs bg-white bg-opacity-60 px-2 py-1 rounded">
                          States: {uniqueStates.length}/{allOptionsInData.states.length}
                        </div>
                      )}
                      {territoryAccessRestricted && (
                        <div className="text-xs bg-white bg-opacity-60 px-2 py-1 rounded">
                          Territories: {uniqueTerritories.length}/{allOptionsInData.territories.length}
                        </div>
                      )}
                      {fulfillmentAccessRestricted && (
                        <div className="text-xs bg-white bg-opacity-60 px-2 py-1 rounded">
                          Centers: {uniqueFulfillmentCenters.length}/{allOptionsInData.fulfillmentCenters.length}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Date Range Filter */}
            <DateRangePicker
              value={pendingFilters.dateRange || ['', '']}
              onChange={(value) => handlePendingFilterChange('dateRange', value)}
              label="Date Range"
            />

            {/* Medical Representative Filter */}
            <SearchableDropdown
              options={uniqueMRs}
              value={pendingFilters.selectedMR}
              onChange={(value) => handlePendingFilterChange('selectedMR', value)}
              placeholder="Select Medical Rep..."
              label="Medical Representative"
              accessRestricted={mrAccessRestricted}
              restrictionMessage={`Limited to accessible MRs based on your permissions`}
              totalOptionsCount={allOptionsInData.mrs.length}
            />

            {/* Order Fulfillment Filter */}
            <SearchableDropdown
              options={uniqueFulfillmentCenters}
              value={pendingFilters.selectedFulfillmentCenter}
              onChange={(value) => handlePendingFilterChange('selectedFulfillmentCenter', value)}
              placeholder="Select Fulfillment..."
              label="Order Fulfillment"
              accessRestricted={fulfillmentAccessRestricted}
              restrictionMessage={`Limited to accessible fulfillment centers`}
              totalOptionsCount={allOptionsInData.fulfillmentCenters.length}
            />

            {/* State Filter */}
            <SearchableDropdown
              options={uniqueStates}
              value={pendingFilters.selectedState}
              onChange={(value) => handlePendingFilterChange('selectedState', value)}
              placeholder="Select State..."
              label="State"
              accessRestricted={stateAccessRestricted}
              restrictionMessage={`Limited to assigned/accessible states`}
              totalOptionsCount={allOptionsInData.states.length}
            />
          </div>

          {/* Apply and Clear Buttons */}
          <div className="mt-6 flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-3 sm:space-y-0">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={applyFilters}
                disabled={!hasPendingChanges}
                className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors ${
                  hasPendingChanges
                    ? 'bg-green-600 text-white hover:bg-green-700 focus:ring-2 focus:ring-green-500'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Apply Filters
              </button>
              {hasPendingChanges && (
                <button
                  onClick={resetPendingToApplied}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 focus:ring-2 focus:ring-gray-400 text-sm transition-colors"
                >
                  Reset Changes
                </button>
              )}
            </div>
            
            <div className="flex items-center space-x-4">
              {hasPendingChanges && (
                <span className="text-sm text-orange-600 font-medium flex items-center">
                  <AlertTriangle className="h-4 w-4 mr-1" />
                  Unsaved filter changes
                </span>
              )}
              {hasAccessRestrictions && (
                <span className="text-xs text-blue-600 flex items-center">
                  <Shield className="h-3 w-3 mr-1" />
                  {restrictionStats.percentage}% of all options available
                </span>
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
                      <span className="text-xs bg-white px-2 py-1 rounded-full text-green-700 flex items-center">
                        {mrAccessRestricted && <Shield className="h-3 w-3 mr-1" />}
                        MR: {filters.selectedMR}
                      </span>
                    )}
                    {filters.selectedFulfillmentCenter && (
                      <span className="text-xs bg-white px-2 py-1 rounded-full text-green-700 flex items-center">
                        {fulfillmentAccessRestricted && <Shield className="h-3 w-3 mr-1" />}
                        Fulfillment: {filters.selectedFulfillmentCenter}
                      </span>
                    )}
                    {filters.selectedState && (
                      <span className="text-xs bg-white px-2 py-1 rounded-full text-green-700 flex items-center">
                        {stateAccessRestricted && <Shield className="h-3 w-3 mr-1" />}
                        State: {filters.selectedState}
                      </span>
                    )}
                    {filters.selectedFulfillment && (
                      <span className="text-xs bg-white px-2 py-1 rounded-full text-green-700">
                        Chart Filter - Fulfillment: {filters.selectedFulfillment}
                      </span>
                    )}
                    {filters.selectedCategory && (
                      <span className="text-xs bg-white px-2 py-1 rounded-full text-green-700">
                        Chart Filter - Category: {filters.selectedCategory}
                      </span>
                    )}
                    {filters.selectedTopProduct && (
                      <span className="text-xs bg-white px-2 py-1 rounded-full text-green-700">
                        Chart Filter - Product: {filters.selectedTopProduct}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Detailed Access Control Summary */}
          {hasAccessRestrictions && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start space-x-2">
                <Lock className="h-4 w-4 text-blue-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-800 mb-2">Access Control Details:</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-blue-700">
                    <div className="space-y-1">
                      {mrAccessRestricted && (
                        <div className="flex justify-between">
                          <span>Medical Representatives:</span>
                          <span className="font-medium">{uniqueMRs.length} of {allOptionsInData.mrs.length}</span>
                        </div>
                      )}
                      {stateAccessRestricted && (
                        <div className="flex justify-between">
                          <span>States:</span>
                          <span className="font-medium">{uniqueStates.length} of {allOptionsInData.states.length}</span>
                        </div>
                      )}
                    </div>
                    <div className="space-y-1">
                      {territoryAccessRestricted && (
                        <div className="flex justify-between">
                          <span>Territories:</span>
                          <span className="font-medium">{uniqueTerritories.length} of {allOptionsInData.territories.length}</span>
                        </div>
                      )}
                      {fulfillmentAccessRestricted && (
                        <div className="flex justify-between">
                          <span>Fulfillment Centers:</span>
                          <span className="font-medium">{uniqueFulfillmentCenters.length} of {allOptionsInData.fulfillmentCenters.length}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="mt-2 pt-2 border-t border-blue-200">
                    <p className="text-xs text-blue-600">
                      <Shield className="inline h-3 w-3 mr-1" />
                      Filters reflect your role-based access permissions. Contact your administrator for additional access.
                    </p>
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
