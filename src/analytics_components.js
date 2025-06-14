// analytics_components.js - Medicine-wise and Pack-wise Analytics

import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Package, Users, Star } from 'lucide-react';
import { formatIndianCurrency, formatCurrencyByContext } from './data.js';

const COLORS = {
  primary: '#10b981',
  secondary: '#3b82f6', 
  accent: '#8b5cf6',
  warning: '#f59e0b',
  error: '#ef4444'
};

// Medicine-wise Analytics Component
const MedicineWiseAnalytics = ({ medicinePerformance, selectedMedicine, availablePackSizes }) => {
  const medicineData = Object.values(medicinePerformance);
  const currentMedicineData = medicinePerformance[selectedMedicine];

  return (
    <div className="space-y-6">
      {/* Medicine Performance Overview */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h4 className="font-semibold mb-4 flex items-center">
          <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
          Medicine-wise Performance Overview
        </h4>
        
        {currentMedicineData && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-green-600">Total Revenue</p>
              <p className="text-2xl font-bold text-green-700">
                ₹{currentMedicineData.totalRevenue.toLocaleString()}
              </p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-600">Total Quantity Sold</p>
              <p className="text-2xl font-bold text-blue-700">
                {currentMedicineData.totalQuantity}
              </p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <p className="text-sm text-purple-600">Total Orders</p>
              <p className="text-2xl font-bold text-purple-700">
                {currentMedicineData.orderCount}
              </p>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <p className="text-sm text-orange-600">Pack Variants</p>
              <p className="text-2xl font-bold text-orange-700">
                {currentMedicineData.packSizes.length}
              </p>
            </div>
          </div>
        )}

        {/* Top Medicines Chart */}
        <div className="mt-6">
          <h5 className="font-medium mb-3">Top Performing Medicines</h5>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={medicineData.slice(0, 10)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="medicineName" 
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis />
              <Tooltip formatter={(value) => [formatCurrencyByContext(value, 'tooltip'), 'Revenue']} />
              <Bar dataKey="totalRevenue" fill={COLORS.primary} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Pack Size Distribution for Selected Medicine */}
      {currentMedicineData && availablePackSizes.length > 1 && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h4 className="font-semibold mb-4 flex items-center">
            <Package className="h-5 w-5 mr-2 text-blue-600" />
            Pack Size Distribution for {selectedMedicine}
          </h4>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pack Size Revenue Chart */}
            <div>
              <h5 className="font-medium mb-3">Revenue by Pack Size</h5>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={availablePackSizes.map((pack, index) => ({
                      name: pack.packSize,
                      value: pack.mrp,
                      fill: Object.values(COLORS)[index % Object.values(COLORS).length]
                    }))}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  />
                  <Tooltip formatter={(value) => [`₹${value}`, 'MRP']} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Pack Size Details */}
            <div>
              <h5 className="font-medium mb-3">Pack Size Analysis</h5>
              <div className="space-y-3">
                {availablePackSizes.map((pack, index) => {
                  const unitCount = parseInt(pack.packSize.replace(/\D/g, '')) || 1;
                  const pricePerUnit = (pack.mrp / unitCount).toFixed(2);
                  
                  return (
                    <div key={index} className="border rounded-lg p-3">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <span className="font-medium">{pack.packSize}</span>
                          <div className="text-xs text-gray-500">SKU: {pack.sku}</div>
                        </div>
                        <span className="font-semibold text-green-600">₹{pack.mrp}</span>
                      </div>
                      <div className="text-sm text-gray-600">
                        <div>Units: {unitCount}</div>
                        <div>Price per unit: ₹{pricePerUnit}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Pack-wise Analytics Component
const PackWiseAnalytics = ({ packSizePerformance, selectedProduct }) => {
  const packData = Object.values(packSizePerformance);
  const currentPackData = selectedProduct ? 
    packSizePerformance[`${selectedProduct.medicineName} (${selectedProduct.packSize})`] : null;

  return (
    <div className="space-y-6">
      {/* Pack Performance Overview */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h4 className="font-semibold mb-4 flex items-center">
          <Package className="h-5 w-5 mr-2 text-blue-600" />
          Pack-wise Performance Overview
        </h4>
        
        {currentPackData && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-green-600">Pack Revenue</p>
              <p className="text-2xl font-bold text-green-700">
                ₹{currentPackData.totalRevenue.toLocaleString()}
              </p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-600">Quantity Sold</p>
              <p className="text-2xl font-bold text-blue-700">
                {currentPackData.totalQuantity}
              </p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <p className="text-sm text-purple-600">Orders</p>
              <p className="text-2xl font-bold text-purple-700">
                {currentPackData.orderCount}
              </p>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <p className="text-sm text-orange-600">Avg Order Qty</p>
              <p className="text-2xl font-bold text-orange-700">
                {(currentPackData.totalQuantity / currentPackData.orderCount).toFixed(1)}
              </p>
            </div>
          </div>
        )}

        {/* Top Packs Chart */}
        <div className="mt-6">
          <h5 className="font-medium mb-3">Top Performing Pack Sizes</h5>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={packData.slice(0, 10)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="packSize" 
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis />
              <Tooltip 
                formatter={(value) => [`₹${value.toLocaleString()}`, 'Revenue']}
                labelFormatter={(label) => `Pack: ${label}`}
              />
              <Bar dataKey="totalRevenue" fill={COLORS.secondary} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Pack Size Performance Table */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h4 className="font-semibold mb-4 flex items-center">
          <Star className="h-5 w-5 mr-2 text-yellow-600" />
          Detailed Pack Performance
        </h4>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Medicine</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Pack Size</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Revenue</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Orders</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Avg Qty/Order</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Performance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {packData
                .sort((a, b) => b.totalRevenue - a.totalRevenue)
                .slice(0, 20)
                .map((pack, index) => {
                  const avgQtyPerOrder = (pack.totalQuantity / pack.orderCount).toFixed(1);
                  const isTopPerformer = index < 3;
                  
                  return (
                    <tr key={index} className={`hover:bg-gray-50 ${isTopPerformer ? 'bg-green-50' : ''}`}>
                      <td className="px-4 py-2 text-sm font-medium">{pack.medicineName}</td>
                      <td className="px-4 py-2 text-sm">{pack.packSize}</td>
                      <td className="px-4 py-2 text-sm font-semibold">₹{pack.totalRevenue.toLocaleString()}</td>
                      <td className="px-4 py-2 text-sm">{pack.totalQuantity}</td>
                      <td className="px-4 py-2 text-sm">{pack.orderCount}</td>
                      <td className="px-4 py-2 text-sm">{avgQtyPerOrder}</td>
                      <td className="px-4 py-2">
                        {isTopPerformer && (
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                            Top {index + 1}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pack Size Insights */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h4 className="font-semibold mb-4 flex items-center">
          <Users className="h-5 w-5 mr-2 text-purple-600" />
          Pack Size Insights
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4">
            <h5 className="font-medium text-gray-800">Most Popular Pack</h5>
            <p className="text-lg font-bold text-green-600">
              {packData.length > 0 ? 
                packData.reduce((max, pack) => pack.orderCount > max.orderCount ? pack : max).packSize : 
                'N/A'
              }
            </p>
            <p className="text-sm text-gray-600">Based on order frequency</p>
          </div>
          
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
            <h5 className="font-medium text-gray-800">Highest Revenue Pack</h5>
            <p className="text-lg font-bold text-blue-600">
              {packData.length > 0 ? 
                packData.reduce((max, pack) => pack.totalRevenue > max.totalRevenue ? pack : max).packSize : 
                'N/A'
              }
            </p>
            <p className="text-sm text-gray-600">Based on total revenue</p>
          </div>
          
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4">
            <h5 className="font-medium text-gray-800">Best Volume Pack</h5>
            <p className="text-lg font-bold text-purple-600">
              {packData.length > 0 ? 
                packData.reduce((max, pack) => pack.totalQuantity > max.totalQuantity ? pack : max).packSize : 
                'N/A'
              }
            </p>
            <p className="text-sm text-gray-600">Based on quantity sold</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export { MedicineWiseAnalytics, PackWiseAnalytics };
