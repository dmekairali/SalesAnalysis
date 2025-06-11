import React, { useState, useEffect } from 'react';
import { MapPin, Brain, RefreshCw, CheckCircle, AlertTriangle, Loader } from 'lucide-react';

const GeminiCoordinateIntegration = () => {
  const [areas, setAreas] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [logs, setLogs] = useState([]);
  const [geminiApiKey, setGeminiApiKey] = useState(process.env.REACT_APP_GEMINI_API_KEY || '');

  // Gemini AI API integration for coordinates
  const getAreaCoordinatesFromGemini = async (areaName, city, state = 'Uttar Pradesh') => {
    const prompt = `
    Get the exact latitude and longitude coordinates for "${areaName}" in ${city}, ${state}, India.
    Also suggest 3 nearby areas within 15km radius.
    
    Return ONLY a valid JSON object in this exact format:
    {
      "area_name": "${areaName}",
      "city": "${city}",
      "state": "${state}",
      "latitude": [decimal number],
      "longitude": [decimal number],
      "confidence": [0.0 to 1.0],
      "nearby_areas": [
        {"name": "Area Name 1", "distance": "X.X km"},
        {"name": "Area Name 2", "distance": "X.X km"},
        {"name": "Area Name 3", "distance": "X.X km"}
      ],
      "business_density": "High|Medium|Low"
    }
    
    No additional text, just the JSON.`;

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }]
        })
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data = await response.json();
      const textResponse = data.candidates[0].content.parts[0].text;
      
      // Extract JSON from response
      const jsonMatch = textResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in Gemini response');
      }

      const coordinateData = JSON.parse(jsonMatch[0]);
      
      // Validate required fields
      if (!coordinateData.latitude || !coordinateData.longitude) {
        throw new Error('Missing latitude or longitude in response');
      }

      return coordinateData;

    } catch (error) {
      console.error('Gemini API Error:', error);
      throw new Error(`Gemini API failed: ${error.message}`);
    }
  };

  // SQL function to populate coordinates using Gemini
  const populateAreaCoordinatesWithGemini = async (mrName) => {
    addLog('🚀 Starting Gemini AI coordinate population...');
    
    try {
      // Get areas without coordinates from your existing data
      const areasToProcess = [
        { name: 'GOVIND PURI', city: 'GHAZIABAD' },
        { name: 'CROSSING REPUBLIK', city: 'GHAZIABAD' }
      ];

      const enrichedAreas = [];
      
      for (const area of areasToProcess) {
        addLog(`🤖 Processing: ${area.name}, ${area.city}`);
        
        try {
          const coordinates = await getAreaCoordinatesFromGemini(area.name, area.city);
          console.log('✅ Gemini returned coordinates:', coordinates); // ADD THIS
    
          enrichedAreas.push({
            ...area,
            ...coordinates,
            mr_name: mrName,
            gemini_processed: true,
            processed_at: new Date().toISOString()
          });
          
          addLog(`✅ Success: ${area.name} - Lat: ${coordinates.latitude}, Lng: ${coordinates.longitude}`);
          
          // Small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 2000));
          
        } catch (error) {
          addLog(`❌ Failed: ${area.name} - ${error.message}`);
          
          // Add area with error status
          enrichedAreas.push({
            ...area,
            latitude: null,
            longitude: null,
            error: error.message,
            gemini_processed: false,
            mr_name: mrName
          });
        }
      }
      
      addLog(`✅ Completed processing ${enrichedAreas.length} areas`);
      setAreas(enrichedAreas);
      
      return enrichedAreas;
      
    } catch (error) {
      addLog(`❌ Critical error: ${error.message}`);
      throw error;
    }
  };

  // SQL function to save coordinates to Supabase
  const saveCoordinatesToSupabase = async (enrichedAreas) => {
    addLog('💾 Saving coordinates to Supabase...');
    console.log('✅ Successfully saved to database'); // ADD THIS
    
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.REACT_APP_SUPABASE_URL,
      process.env.REACT_APP_SUPABASE_ANON_KEY
    );

    try {
      for (const area of enrichedAreas) {
        if (area.latitude && area.longitude) {
          const { error } = await supabase
            .from('area_coordinates')
            .upsert({
              area_name: area.area_name,
              city: area.city,
              state: area.state,
              latitude: area.latitude,
              longitude: area.longitude,
              mr_name: area.mr_name,
              gemini_processed: true,
              gemini_confidence: area.confidence,
              business_density: area.business_density,
              updated_at: new Date().toISOString()
            }, { 
              onConflict: 'area_name,city,mr_name' 
            });

          if (error) {
            addLog(`❌ Database error for ${area.area_name}: ${error.message}`);
             console.error('❌ Error in processing loop:', error); // ENHANCE THIS
          } else {
            addLog(`✅ Saved: ${area.area_name} to database`);
          }
        }
      }
      
      addLog('💾 All coordinates saved to Supabase successfully!');
      
    } catch (error) {
      addLog(`❌ Supabase save error: ${error.message}`);
      throw error;
    }
  };

  // Complete integration workflow
  const runGeminiIntegration = async () => {
    if (!geminiApiKey) {
      addLog('❌ Please enter your Gemini API key first');
      return;
    }

    setProcessing(true);
    
    try {
      // Step 1: Get coordinates from Gemini
      const enrichedAreas = await populateAreaCoordinatesWithGemini('Sameer Anand');
      
      // Step 2: Save to Supabase
      await saveCoordinatesToSupabase(enrichedAreas);
      
      // Step 3: Create geographic clusters
      addLog('🗺️ Creating geographic clusters...');
      const { createClient } = require('@supabase/supabase-js');
      const supabase = createClient(
        process.env.REACT_APP_SUPABASE_URL,
        process.env.REACT_APP_SUPABASE_ANON_KEY
      );
      
      const { data: clusters, error } = await supabase.rpc('create_geographic_clusters_simple', {
        p_mr_name: 'Sameer Anand'
      });
      
      if (error) {
        addLog(`❌ Clustering error: ${error.message}`);
      } else {
        addLog(`✅ Created ${clusters.length} geographic clusters`);
      }
      
      addLog('🎉 Gemini AI integration completed successfully!');
      
    } catch (error) {
      addLog(`❌ Integration failed: ${error.message}`);
    } finally {
      setProcessing(false);
    }
  };

  // Add log entry
  const addLog = (message) => {
    setLogs(prev => [...prev, {
      id: Date.now(),
      timestamp: new Date().toLocaleTimeString(),
      message
    }]);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <Brain className="h-6 w-6 mr-2 text-purple-600" />
              Gemini AI Coordinate Integration
            </h2>
            <p className="text-gray-600">Automatically fetch coordinates for all areas using Google's Gemini AI</p>
          </div>
        </div>

        {/* API Key Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Gemini API Key
          </label>
          <div className="flex space-x-3">
            <input
              type="password"
              value={geminiApiKey}
              onChange={(e) => setGeminiApiKey(e.target.value)}
              placeholder={process.env.REACT_APP_GEMINI_API_KEY ? "API key loaded from environment" : "Enter your Gemini API key..."}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              disabled={!!process.env.REACT_APP_GEMINI_API_KEY}
            />
            <button
              onClick={runGeminiIntegration}
              disabled={processing || !geminiApiKey}
              className="flex items-center px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
            >
              {processing ? (
                <Loader className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Brain className="h-4 w-4 mr-2" />
              )}
              {processing ? 'Processing...' : 'Start Integration'}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {process.env.REACT_APP_GEMINI_API_KEY ? 
              "✅ API key configured in environment variables" : 
              "Get your API key from: Google AI Studio"
            }
          </p>
        </div>

        {/* Progress Logs */}
        <div className="bg-gray-50 rounded-lg p-4 h-96 overflow-y-auto">
          <h3 className="font-semibold mb-3 flex items-center">
            <RefreshCw className={`h-4 w-4 mr-2 ${processing ? 'animate-spin text-purple-600' : 'text-gray-600'}`} />
            Integration Progress
          </h3>
          
          {logs.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Click "Start Integration" to begin processing areas...</p>
          ) : (
            <div className="space-y-2">
              {logs.map(log => (
                <div key={log.id} className="flex items-start space-x-2 text-sm">
                  <span className="text-gray-400 font-mono">{log.timestamp}</span>
                  <span className={`flex-1 ${
                    log.message.includes('❌') ? 'text-red-600' :
                    log.message.includes('✅') ? 'text-green-600' :
                    log.message.includes('🤖') ? 'text-purple-600' :
                    'text-gray-700'
                  }`}>
                    {log.message}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Results Summary */}
        {areas.length > 0 && (
          <div className="mt-6">
            <h3 className="font-semibold mb-3">Processing Results</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                  <span className="font-medium">Successful</span>
                </div>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  {areas.filter(a => a.latitude && a.longitude).length}
                </p>
              </div>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center">
                  <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
                  <span className="font-medium">Failed</span>
                </div>
                <p className="text-2xl font-bold text-red-600 mt-1">
                  {areas.filter(a => !a.latitude || !a.longitude).length}
                </p>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center">
                  <MapPin className="h-5 w-5 text-blue-600 mr-2" />
                  <span className="font-medium">Total Areas</span>
                </div>
                <p className="text-2xl font-bold text-blue-600 mt-1">
                  {areas.length}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Setup Instructions */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">Setup Instructions:</h3>
          <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
            <li>Get your Gemini API key from Google AI Studio</li>
            <li>Enter the API key above</li>
            <li>Click "Start Integration" to process all areas</li>
            <li>Wait for coordinates to be fetched and saved</li>
            <li>Geographic clusters will be created automatically</li>
            <li>Your visit planner will now use real coordinates!</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default GeminiCoordinateIntegration;
