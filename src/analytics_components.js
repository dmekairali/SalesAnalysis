// Updated analytics_components.js - Medicine-wise and Pack-wise Analytics

import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Package, Users, Star, MapPin, Building } from 'lucide-react';
import { formatIndianCurrency, formatCurrencyByContext } from './data.js';

const COLORS = {
  primary: '#10b981',
  secondary: '#3b82f6', 
  accent: '#8b5cf6',
  warning: '#f59e0b',
  error: '#ef4444'
};

// Updated Medicine-wise Analytics Component
const MedicineWiseAnalytics = ({ 
  medicinePerformance, 
  selectedMedicine, 
  fulfillmentCenter 
}) => {
  const medicineData = Object.values(medicinePerformance);
  const currentMedicineData = medicinePerformance[selectedMedicine];

  return (
    <div className="space-y-6">
      {/* Fulfillment Center Context */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center">
          <Building className="h-5 w-5 text-blue-600 mr-2" />
          <h4 className="font-semibold text-blue-800">Medicine Analysis Context</h4>
        </div>
        <p className="text-sm text-blue-700 mt-1">
          Analyzing medicine performance for <strong>{selectedMedicine || 'All Medicines'}</strong> 
          {fulfillmentCenter && fulfillmentCenter !== 'All Fulfillment Centers' && (
            <> from <strong>{fulfillmentCenter}</strong> fulfillment center</>
          )}
        </p>
      </div>

      {/* Medicine Performance Overview */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h4 className="font-semibold mb-4 flex items-center">
          <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
          Medicine Performance Overview
        </h4>
        
        {currentMedicineData && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-green-600">Total Revenue</p>
              <p className="text-2xl font-bold text-green-700">
                {formatCurrencyByContext(currentMedicineData.totalRevenue, 'card')}
              </p>
              <p className="text-xs text-green-600">
                {fulfillmentCenter && fulfillmentCenter !== 'All Fulfillment Centers' 
                  ? `${fulfillmentCenter} only` 
                  : 'All centers'
                }
              </p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-600">Total Quantity Sold</p>
              <p className="text-2xl font-bold text-blue-700">
                {currentMedicineData.totalQuantity}
              </p>
              <p className="text-xs text-blue-600">Units dispensed</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <p className="text-sm text-purple-600">Total Orders</p>
              <p className="text-2xl font-bold text-purple-700">
                {currentMedicineData.orderCount}
              </p>
              <p className="text-xs text-purple-600">Unique orders</p>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <p className="text-sm text-orange-600">Avg Order Value</p>
              <p className="text-2xl font-bold text-orange-700">
                {formatCurrencyByContext(
                  currentMedicineData.orderCount > 0 
                    ? currentMedicineData.totalRevenue / currentMedicineData.orderCount 
                    : 0, 
                  'card'
                )}
              </p>
              <p className="text-xs text-orange-600">Per order</p>
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
              <YAxis 
                tickFormatter={(value) => formatCurrencyByContext(value, 'chart')}
              />
              <Tooltip 
                formatter={(value) => [formatCurrencyByContext(value, 'tooltip'), 'Revenue']} 
              />
              <Bar dataKey="totalRevenue" fill={COLORS.primary} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Medicine Performance Insights */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h6 className="font-medium text-gray-900 mb-2">Performance Insights</h6>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Medicines Analyzed:</span>
                <span className="font-semibold">{medicineData.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Top Performer:</span>
                <span className="font-semibold">
                  {medicineData.length > 0 ? medicineData[0].medicineName : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Revenue Concentration:</span>
                <span className="font-semibold">
                  {medicineData.length > 0 && medicineData.slice(0, 3).length > 0
                    ? `${((medicineData.slice(0, 3).reduce((sum, med) => sum + med.totalRevenue, 0) / 
                          medicineData.reduce((sum, med) => sum + med.totalRevenue, 0)) * 100).toFixed(1)}%`
                    : '0%'
                  } (Top 3)
                </span>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <h6 className="font-medium text-gray-900 mb-2">Fulfillment Analysis</h6>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Fulfillment Center:</span>
                <span className="font-semibold">
                  {fulfillmentCenter || 'All Centers'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Analysis Scope:</span>
                <span className="font-semibold">Medicine-wise</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Selected Medicine:</span>
                <span className="font-semibold">
                  {selectedMedicine || 'All Medicines'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Medicine Category Distribution */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h4 className="font-semibold mb-4 flex items-center">
          <Package className="h-5 w-5 mr-2 text-blue-600" />
          Medicine Category Distribution
        </h4>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Category Revenue Chart */}
          <div>
            <h5 className="font-medium mb-3">Revenue by Category</h5>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={(() => {
                    const categoryData = {};
                    medicineData.forEach(med => {
                      const category = med.category || 'Uncategorized';
                      if (!categoryData[category]) {
                        categoryData[category] = { name: category, value: 0 };
                      }
                      categoryData[category].value += med.totalRevenue;
                    });
                    return Object.values(categoryData);
                  })()}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {(() => {
                    const categoryData = {};
                    medicineData.forEach(med => {
                      const category = med.category || 'Uncategorized';
                      if (!categoryData[category]) {
                        categoryData[category] = { name: category, value: 0 };
                      }
                      categoryData[category].value += med.totalRevenue;
                    });
                    return Object.values(categoryData);
                  })().map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={Object.values(COLORS)[index % Object.values(COLORS).length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value) => [formatCurrencyByContext(value, 'tooltip'), 'Revenue']} 
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Category Details */}
          <div>
            <h5 className="font-medium mb-3">Category Performance</h5>
            <div className="space-y-3">
              {(() => {
                const categoryData = {};
                medicineData.forEach(med => {
                  const category = med.category || 'Uncategorized';
                  if (!categoryData[category]) {
                    categoryData[category] = { 
                      name: category, 
                      revenue: 0, 
                      count: 0,
                      quantity: 0
                    };
                  }
                  categoryData[category].revenue += med.totalRevenue;
                  categoryData[category].count += 1;
                  categoryData[category].quantity += med.totalQuantity;
                });
                return Object.values(categoryData)
                  .sort((a, b) => b.revenue - a.revenue)
                  .slice(0, 5);
              })().map((category, index) => (
                <div key={index} className="border rounded-lg p-3">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="font-medium">{category.name}</span>
                      <div className="text-xs text-gray-500">{category.count} medicines</div>
                    </div>
                    <span className="font-semibold text-green-600">
                      {formatCurrencyByContext(category.revenue, 'table')}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    <div>Quantity: {category.quantity}</div>
                    <div>Avg Revenue: {formatCurrencyByContext(category.revenue / category.count, 'table')}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Updated Pack-wise Analytics Component
const PackWiseAnalytics = ({ 
  packSizePerformance, 
  selectedVariant, 
  fulfillmentCenter 
}) => {
  const packData = Object.values(packSizePerformance);

  return (
    <div className="space-y-6">
      {/* Fulfillment Center Context */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <div className="flex items-center">
          <Package className="h-5 w-5 text-purple-600 mr-2" />
          <h4 className="font-semibold text-purple-800">Pack Variant Analysis Context</h4>
        </div>
        <p className="text-sm text-purple-700 mt-1">
          Analyzing pack performance for <strong>{selectedVariant?.variantCode || 'All Variants'}</strong>
          {fulfillmentCenter && fulfillmentCenter !== 'All Fulfillment Centers' && (
            <> from <strong>{fulfillmentCenter}</strong> fulfillment center</>
          )}
        </p>
      </div>

      {/* Selected Variant Details */}
      {selectedVariant && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h4 className="font-semibold mb-4 flex items-center">
            <Star className="h-5 w-5 mr-2 text-yellow-600" />
            Selected Variant Details
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h5 className="font-medium mb-3">Variant Information</h5>
              <div className="space-y-3">
                <div className="border rounded-lg p-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Medicine:</span>
                      <div className="font-medium">{selectedVariant.medicineName}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Pack Size:</span>
                      <div className="font-medium">{selectedVariant.packSize}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Variant Code:</span>
                      <div className="font-medium">{selectedVariant.variantCode}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Current MRP:</span>
                      <div className="font-medium text-green-600">₹{selectedVariant.mrp}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h5 className="font-medium mb-3">SKU Variants ({selectedVariant.skus.length})</h5>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {selectedVariant.skus.map((sku, index) => (
                  <div key={index} className="border rounded p-2 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="font-mono text-xs">{sku.sku}</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-green-600 font-medium">₹{sku.mrp}</span>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          sku.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {sku.status || 'active'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pack Performance Overview */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h4 className="font-semibold mb-4 flex items-center">
          <Package className="h-5 w-5 mr-2 text-blue-600" />
          Pack-wise Performance Overview
        </h4>
        
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
              <YAxis 
                tickFormatter={(value) => formatCurrencyByContext(value, 'chart')}
              />
              <Tooltip 
                formatter={(value) => [formatCurrencyByContext(value, 'tooltip'), 'Revenue']}
                labelFormatter={(label) => `Pack: ${label}`}
              />
              <Bar dataKey="totalRevenue" fill={COLORS.secondary} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pack Performance Insights */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h6 className="font-medium text-blue-900 mb-2">Most Popular Pack</h6>
            <p className="text-lg font-bold text-blue-600">
              {packData.length > 0 ? 
                packData.reduce((max, pack) => pack.orderCount > max.orderCount ? pack : max).packSize : 
                'N/A'
              }
            </p>
            <p className="text-sm text-blue-600">Based on order frequency</p>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <h6 className="font-medium text-green-900 mb-2">Highest Revenue Pack</h6>
            <p className="text-lg font-bold text-green-600">
              {packData.length > 0 ? 
                packData.reduce((max, pack) => pack.totalRevenue > max.totalRevenue ? pack : max).packSize : 
                'N/A'
              }
            </p>
            <p className="text-sm text-green-600">Based on total revenue</p>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg">
            <h6 className="font-medium text-purple-900 mb-2">Best Volume Pack</h6>
            <p className="text-lg font-bold text-purple-600">
              {packData.length > 0 ? 
                packData.reduce((max, pack) => pack.totalQuantity > max.totalQuantity ? pack : max).packSize : 
                'N/A'
              }
            </p>
            <p className="text-sm text-purple-600">Based on quantity sold</p>
          </div>
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
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Avg Revenue/Order</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Performance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {packData
                .sort((a, b) => b.totalRevenue - a.totalRevenue)
                .slice(0, 20)
                .map((pack, index) => {
                  const avgQtyPerOrder = (pack.totalQuantity / pack.orderCount).toFixed(1);
                  const avgRevenuePerOrder = (pack.totalRevenue / pack.orderCount).toFixed(0);
                  const isTopPerformer = index < 3;
                  const isSelectedVariant = selectedVariant && 
                    pack.medicineName === selectedVariant.medicineName && 
                    pack.packSize === selectedVariant.packSize;
                  
                  return (
                    <tr key={index} className={`hover:bg-gray-50 ${
                      isSelectedVariant ? 'bg-purple-50 border-l-4 border-purple-500' : 
                      isTopPerformer ? 'bg-green-50' : ''
                    }`}>
                      <td className="px-4 py-2 text-sm font-medium">{pack.medicineName}</td>
                      <td className="px-4 py-2 text-sm">{pack.packSize}</td>
                      <td className="px-4 py-2 text-sm font-semibold">
                        {formatCurrencyByContext(pack.totalRevenue, 'table')}
                      </td>
                      <td className="px-4 py-2 text-sm">{pack.totalQuantity}</td>
                      <td className="px-4 py-2 text-sm">{pack.orderCount}</td>
                      <td className="px-4 py-2 text-sm">{avgQtyPerOrder}</td>
                      <td className="px-4 py-2 text-sm">{formatCurrencyByContext(avgRevenuePerOrder, 'table')}</td>
                      <td className="px-4 py-2">
                        <div className="flex flex-wrap gap-1">
                          {isSelectedVariant && (
                            <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                              Selected
                            </span>
                          )}
                          {isTopPerformer && (
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                              Top {index + 1}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Fulfillment Center Impact Analysis */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h4 className="font-medium mb-4 flex items-center">
          <MapPin className="h-5 w-5 mr-2" />
          Fulfillment Center Impact Analysis
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h6 className="font-medium text-gray-900 mb-2">Pack Performance Metrics</h6>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Pack Variants:</span>
                <span className="font-semibold">{packData.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Revenue Concentration:</span>
                <span className="font-semibold">
                  {packData.length > 0 && packData.slice(0, 5).length > 0
                    ? `${((packData.slice(0, 5).reduce((sum, pack) => sum + pack.totalRevenue, 0) / 
                          packData.reduce((sum, pack) => sum + pack.totalRevenue, 0)) * 100).toFixed(1)}%`
                    : '0%'
                  } (Top 5)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Selected Variant:</span>
                <span className="font-semibold">
                  {selectedVariant ? selectedVariant.variantCode : 'None'}
                </span>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <h6 className="font-medium text-gray-900 mb-2">Fulfillment Analysis</h6>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Fulfillment Center:</span>
                <span className="font-semibold">
                  {fulfillmentCenter || 'All Centers'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Analysis Scope:</span>
                <span className="font-semibold">Pack-wise (Variant-based)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Filter Method:</span>
                <span className="font-semibold">Variant Code</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export { MedicineWiseAnalytics, PackWiseAnalytics };
