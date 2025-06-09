import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertTriangle, RefreshCw } from 'lucide-react';

// Add this component temporarily to test your implementation
const VisitPlannerVerification = () => {
  const [tests, setTests] = useState([
    { id: 'db_connection', name: 'Database Connection', status: 'pending', message: '' },
    { id: 'tables_exist', name: 'Tables Created', status: 'pending', message: '' },
    { id: 'functions_exist', name: 'SQL Functions', status: 'pending', message: '' },
    { id: 'sample_data', name: 'Sample Data', status: 'pending', message: '' },
    { id: 'api_calls', name: 'API Calls', status: 'pending', message: '' }
  ]);

  const [isRunning, setIsRunning] = useState(false);

  const updateTest = (testId, status, message) => {
    setTests(prev => prev.map(test => 
      test.id === testId ? { ...test, status, message } : test
    ));
  };

  const runVerification = async () => {
    setIsRunning(true);
    
    // Test 1: Database Connection
    try {
      // Import your supabase client from data.js
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.REACT_APP_SUPABASE_URL,
        process.env.REACT_APP_SUPABASE_ANON_KEY
      );
      
      const { data, error } = await supabase.from('visit_plans').select('count').limit(1);
      if (error) throw error;
      
      updateTest('db_connection', 'success', 'Connected successfully');
    } catch (error) {
      updateTest('db_connection', 'error', `Connection failed: ${error.message}`);
    }

    // Test 2: Check if tables exist
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.REACT_APP_SUPABASE_URL,
        process.env.REACT_APP_SUPABASE_ANON_KEY
      );

      const { data, error } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .like('table_name', '%visit%');

      if (error) throw error;
      
      const tableNames = data.map(row => row.table_name);
      const requiredTables = ['visit_plans', 'daily_visit_plans', 'planned_visits', 'customer_visit_patterns'];
      const missingTables = requiredTables.filter(table => !tableNames.includes(table));
      
      if (missingTables.length === 0) {
        updateTest('tables_exist', 'success', `All tables exist: ${tableNames.join(', ')}`);
      } else {
        updateTest('tables_exist', 'warning', `Missing tables: ${missingTables.join(', ')}`);
      }
    } catch (error) {
      updateTest('tables_exist', 'error', `Table check failed: ${error.message}`);
    }

    // Test 3: Check if functions exist
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.REACT_APP_SUPABASE_URL,
        process.env.REACT_APP_SUPABASE_ANON_KEY
      );

      const { data, error } = await supabase.rpc('get_visit_plan_api', {
        p_mr_name: 'TEST',
        p_month: 1,
        p_year: 2025
      });

      if (error && error.code === '42883') {
        updateTest('functions_exist', 'error', 'SQL functions not found - run the schema');
      } else {
        updateTest('functions_exist', 'success', 'SQL functions exist and callable');
      }
    } catch (error) {
      updateTest('functions_exist', 'error', `Function test failed: ${error.message}`);
    }

    // Test 4: Check sample data
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.REACT_APP_SUPABASE_URL,
        process.env.REACT_APP_SUPABASE_ANON_KEY
      );

      const { data, error } = await supabase
        .from('mr_visits')
        .select('count')
        .limit(1);

      if (error) throw error;
      
      const count = data?.[0]?.count || 0;
      if (count > 0) {
        updateTest('sample_data', 'success', `Found ${count} MR visit records`);
      } else {
        updateTest('sample_data', 'warning', 'No MR visit data - add sample data for testing');
      }
    } catch (error) {
      updateTest('sample_data', 'error', `Sample data check failed: ${error.message}`);
    }

    // Test 5: Test API functionality
    try {
      // Try to import your data functions
      const { getVisitPlanAPI } = await import('../data.js');
      
      const result = await getVisitPlanAPI('RAJESH KUMAR', 1, 2025);
      
      if (result && result.success) {
        updateTest('api_calls', 'success', 'API calls working correctly');
      } else {
        updateTest('api_calls', 'warning', 'API returned but may need sample data');
      }
    } catch (error) {
      updateTest('api_calls', 'error', `API test failed: ${error.message}`);
    }

    setIsRunning(false);
  };

  useEffect(() => {
    runVerification();
  }, []);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      default:
        return <RefreshCw className={`h-5 w-5 text-gray-400 ${isRunning ? 'animate-spin' : ''}`} />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success':
        return 'border-green-200 bg-green-50';
      case 'error':
        return 'border-red-200 bg-red-50';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const allPassed = tests.every(test => test.status === 'success');
  const hasErrors = tests.some(test => test.status === 'error');

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Visit Planner Verification</h2>
            <p className="text-gray-600">Testing your implementation step by step</p>
          </div>
          <button
            onClick={runVerification}
            disabled={isRunning}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRunning ? 'animate-spin' : ''}`} />
            {isRunning ? 'Testing...' : 'Run Tests'}
          </button>
        </div>

        {/* Overall Status */}
        <div className={`p-4 rounded-lg mb-6 ${
          allPassed ? 'bg-green-50 border border-green-200' :
          hasErrors ? 'bg-red-50 border border-red-200' :
          'bg-yellow-50 border border-yellow-200'
        }`}>
          <div className="flex items-center">
            {allPassed ? (
              <CheckCircle className="h-6 w-6 text-green-500 mr-3" />
            ) : hasErrors ? (
              <XCircle className="h-6 w-6 text-red-500 mr-3" />
            ) : (
              <AlertTriangle className="h-6 w-6 text-yellow-500 mr-3" />
            )}
            <div>
              <h3 className="font-semibold">
                {allPassed ? '✅ All tests passed! Visit Planner is ready.' :
                 hasErrors ? '❌ Some tests failed. Check the issues below.' :
                 '⚠️ Tests completed with warnings. Some features may not work optimally.'}
              </h3>
              {allPassed && (
                <p className="text-sm text-gray-600 mt-1">
                  You can now use the Visit Planner tab in your dashboard!
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Individual Test Results */}
        <div className="space-y-4">
          {tests.map((test) => (
            <div
              key={test.id}
              className={`p-4 rounded-lg border ${getStatusColor(test.status)}`}
            >
              <div className="flex items-start">
                <div className="mr-3 mt-0.5">
                  {getStatusIcon(test.status)}
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{test.name}</h4>
                  {test.message && (
                    <p className="text-sm text-gray-600 mt-1">{test.message}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Next Steps */}
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">Next Steps:</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            {hasErrors && (
              <>
                <li>• Fix any errors shown above before proceeding</li>
                <li>• Make sure you've run the complete SQL schema in Supabase</li>
                <li>• Check your environment variables (REACT_APP_SUPABASE_URL, REACT_APP_SUPABASE_ANON_KEY)</li>
              </>
            )}
            {!hasErrors && (
              <>
                <li>• Add sample MR visit data for realistic testing</li>
                <li>• Test the Visit Planner tab in your main dashboard</li>
                <li>• Try generating a visit plan for different MRs and months</li>
                <li>• Remove this verification component when everything works</li>
              </>
            )}
          </ul>
        </div>

        {/* Sample Data Helper */}
        {!hasErrors && (
          <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">Add Sample Data (Optional):</h3>
            <p className="text-sm text-gray-600 mb-3">
              Run this SQL in your Supabase SQL editor to add test data:
            </p>
            <pre className="bg-gray-800 text-green-400 p-3 rounded text-xs overflow-x-auto">
{`INSERT INTO mr_visits ("visitId", "empName", "dcrDate", "clientName", "clientMobileNo", "visitType", "areaName", "cityName", "amountOfSale", mr_name, customer_phone, customer_name, customer_type)
VALUES 
(1, 'RAJESH KUMAR', '2024-12-01', 'Dr. Sharma', '+919876543210', 'Doctor', 'Bandra West', 'Mumbai', 2500.00, 'RAJESH KUMAR', '+919876543210', 'Dr. Sharma', 'Doctor'),
(2, 'RAJESH KUMAR', '2024-11-28', 'City Medical Store', '+919876543211', 'Retailer', 'Andheri East', 'Mumbai', 3200.00, 'RAJESH KUMAR', '+919876543211', 'City Medical Store', 'Retailer');

SELECT * FROM calculate_customer_patterns('RAJESH KUMAR');`}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default VisitPlannerVerification;
