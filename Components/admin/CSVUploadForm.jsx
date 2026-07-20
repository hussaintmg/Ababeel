// Components/admin/CSVUploadForm.jsx
"use client";

import { useState, useRef } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, Download, Eye, X, Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';
import Papa from 'papaparse';

const CSVUploadForm = () => {
  const [file, setFile] = useState(null);
  const [previewData, setPreviewData] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [validationErrors, setValidationErrors] = useState([]);
  const [totalRows, setTotalRows] = useState(0);
  const [headers, setHeaders] = useState([]);
  const fileInputRef = useRef(null);

  // Required columns for CSV
  const requiredColumns = ['name', 'price', 'description'];
  const optionalColumns = ['currency', 'currencySymbol', 'currencyCode', 'country', 'categories', 'duration', 'level'];

  const downloadSampleCSV = () => {
    const sampleData = [
      {
        name: 'Award in Boom Lift Safe Operator Training',
        price: '250',
        currency: 'GBP',
        currencySymbol: '£',
        currencyCode: 'GBP',
        country: 'United Kingdom',
        description: 'Comprehensive training for safe operation of boom lifts',
        categories: 'Safety,Operator Training,Construction',
        duration: '24',
        level: 'intermediate'
      },
      {
        name: 'Level 2 Award In Emergency First Aid at Work',
        price: '120',
        currency: 'GBP',
        currencySymbol: '£',
        currencyCode: 'GBP',
        country: 'United Kingdom',
        description: 'Essential first aid training for workplace emergencies',
        categories: 'First Aid,Emergency,Health & Safety',
        duration: '8',
        level: 'beginner'
      },
      {
        name: 'Advanced Construction Management',
        price: '450',
        currency: 'GBP',
        currencySymbol: '£',
        currencyCode: 'GBP',
        country: 'United Kingdom',
        description: 'Advanced techniques in construction project management',
        categories: 'Management,Construction,Leadership',
        duration: '40',
        level: 'advanced'
      }
    ];

    const csv = Papa.unparse(sampleData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', 'course_template_uk.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Sample CSV template downloaded!');
  };

  // Handle file upload
  const handleFileUpload = (event) => {
    const selectedFile = event.target.files[0];
    
    if (!selectedFile) return;

    // Check file type
    if (!selectedFile.name.toLowerCase().endsWith('.csv')) {
      toast.error('Please upload a CSV file (.csv)');
      return;
    }

    // Check file size (10MB limit)
    if (selectedFile.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }

    setParsing(true);
    setFile(selectedFile);
    setValidationErrors([]);
    setShowPreview(true);
    setPreviewData([]);
    setTotalRows(0);
    setHeaders([]);

    // Use FileReader to read the file
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const csvText = e.target.result;
        
        // First, parse without header to see raw data
        Papa.parse(csvText, {
          preview: 10,
          complete: (previewResults) => {
            // Now parse with header
            Papa.parse(csvText, {
              header: true,
              skipEmptyLines: 'greedy',
              transformHeader: (header) => {
                // Clean and normalize header
                if (!header) return '';
                return header
                  .trim()
                  .toLowerCase()
                  .replace(/[^a-zA-Z0-9]/g, '')
                  .replace(/\s+/g, '');
              },
              transform: (value, column) => {
                if (value === null || value === undefined) return '';
                return value.toString().trim();
              },
              complete: (results) => {
                // Check if we got headers
                if (!results.meta?.fields || results.meta.fields.length === 0) {
                  toast.error('No headers found in CSV file. Please check the format.');
                  setParsing(false);
                  return;
                }

                // Filter out completely empty rows
                const data = results.data.filter(row => {
                  return Object.values(row).some(value => value && value.toString().trim() !== '');
                });
                
                if (data.length === 0) {
                  toast.error('No valid data found in CSV file');
                  setParsing(false);
                  return;
                }

                setTotalRows(data.length);
                setHeaders(results.meta.fields);
                
                // Validate CSV structure
                validateCSV(data, results.meta.fields);
                
                // Set preview data
                const previewRows = Math.min(5, data.length);
                setPreviewData(data.slice(0, previewRows));
                
                toast.success(`Successfully parsed ${data.length} rows with ${results.meta.fields.length} columns`);
                setParsing(false);
              },
              error: (error) => {
                console.error('PapaParse error:', error);
                toast.error('Failed to parse CSV file');
                setParsing(false);
              }
            });
          },
          error: (error) => {
            console.error('Preview error:', error);
            toast.error('Failed to preview CSV file');
            setParsing(false);
          }
        });
      } catch (error) {
        console.error('FileReader error:', error);
        toast.error('Failed to read file: ' + error.message);
        setParsing(false);
      }
    };
    
    reader.onerror = (error) => {
      console.error('FileReader error:', error);
      toast.error('Failed to read file. Please try again.');
      setParsing(false);
    };
    
    // Read file as text with UTF-8 encoding
    reader.readAsText(selectedFile, 'UTF-8');
  };

  // Validate CSV data
  const validateCSV = (data, detectedHeaders) => {
    const errors = [];
    
    if (!data || data.length === 0) {
      errors.push('CSV file is empty or contains no valid data');
      setValidationErrors(errors);
      return;
    }

    // Normalize headers for comparison
    const normalizedHeaders = detectedHeaders.map(h => 
      h.toLowerCase().replace(/[^a-zA-Z0-9]/g, '').replace(/\s+/g, '')
    );

    // Check for missing required columns
    requiredColumns.forEach(requiredColumn => {
      const normalizedRequired = requiredColumn.toLowerCase().replace(/[^a-zA-Z0-9]/g, '').replace(/\s+/g, '');
      
      if (!normalizedHeaders.includes(normalizedRequired)) {
        // Check for similar headers
        const similarHeader = detectedHeaders.find(h => {
          const normalizedH = h.toLowerCase().replace(/[^a-zA-Z0-9]/g, '').replace(/\s+/g, '');
          return normalizedH.includes(normalizedRequired) || normalizedRequired.includes(normalizedH);
        });
        
        if (similarHeader) {
          errors.push(`Column "${requiredColumn}" not found. Did you mean "${similarHeader}"?`);
        } else {
          errors.push(`Missing required column: "${requiredColumn}"`);
        }
      }
    });

    // Validate each row
    let validRows = 0;
    data.forEach((row, index) => {
      const rowNumber = index + 2; // +2 because: 1 for header row, 1 for zero-based index
      let rowValid = true;
      
      // Map headers to row values
      requiredColumns.forEach(requiredColumn => {
        const normalizedRequired = requiredColumn.toLowerCase().replace(/[^a-zA-Z0-9]/g, '').replace(/\s+/g, '');
        
        // Find the actual header that matches this required column
        const matchingHeaderIndex = normalizedHeaders.findIndex(h => h === normalizedRequired);
        
        if (matchingHeaderIndex !== -1) {
          const actualHeader = detectedHeaders[matchingHeaderIndex];
          const value = row[actualHeader];
          
          if (!value || value.toString().trim() === '') {
            errors.push(`Row ${rowNumber}: "${requiredColumn}" is empty or missing`);
            rowValid = false;
          }
          
          // Special validation for price
          if (requiredColumn === 'price' && value) {
            const priceStr = value.toString().replace(/[^\d.-]/g, '');
            const price = parseFloat(priceStr);
            if (isNaN(price) || price < 0) {
              errors.push(`Row ${rowNumber}: Invalid price "${value}". Must be a positive number.`);
              rowValid = false;
            }
          }
        }
      });

      if (rowValid) validRows++;
    });

    setValidationErrors(errors);
    
    if (errors.length === 0) {
      toast.success(`✅ CSV validated: ${validRows} valid course(s) found`);
    } else if (validRows > 0) {
      toast.warning(`⚠️ Found ${errors.length} error(s) but ${validRows} valid row(s) can be uploaded`);
    } else {
      toast.error(`❌ ${errors.length} validation error(s) found. No valid rows to upload.`);
    }
  };

  // Prepare courses for upload with UK defaults
  const prepareCoursesForUpload = (data, detectedHeaders) => {
    const normalizedHeaders = detectedHeaders.map(h => 
      h.toLowerCase().replace(/[^a-zA-Z0-9]/g, '').replace(/\s+/g, '')
    );

    return data.map((row, index) => {
      // Create a normalized row object with cleaned keys
      const normalizedRow = {};
      
      detectedHeaders.forEach((header, idx) => {
        const normalizedKey = normalizedHeaders[idx];
        normalizedRow[normalizedKey] = row[header] || '';
      });

      // Helper function to get value with fallback
      const getValue = (key, defaultValue = '') => {
        const normalizedKey = key.toLowerCase().replace(/[^a-zA-Z0-9]/g, '').replace(/\s+/g, '');
        return normalizedRow[normalizedKey]?.toString().trim() || defaultValue;
      };

      // Parse categories
      let categories = [];
      const categoriesStr = getValue('categories') || getValue('category');
      if (categoriesStr) {
        categories = categoriesStr
          .split(/[,;|]/)
          .map(cat => cat.trim())
          .filter(cat => cat !== '');
      }

      // Parse price
      let price = 0;
      const priceStr = getValue('price');
      if (priceStr) {
        const cleanPrice = priceStr.toString().replace(/[^\d.-]/g, '');
        price = parseFloat(cleanPrice) || 0;
      }

      // Parse duration
      let duration = null;
      const durationStr = getValue('duration');
      if (durationStr) {
        const cleanDuration = durationStr.toString().replace(/[^\d.-]/g, '');
        duration = parseFloat(cleanDuration) || null;
      }

      // Get level with validation
      const levelRaw = getValue('level');
      let level = 'all';
      if (levelRaw) {
        const levelLower = levelRaw.toLowerCase();
        const validLevels = ['beginner', 'intermediate', 'advanced', 'all'];
        if (validLevels.includes(levelLower)) {
          level = levelLower;
        }
      }

      return {
        name: getValue('name'),
        price: price,
        description: getValue('description'),
        currency: getValue('currency') || 'GBP',
        currencySymbol: getValue('currencysymbol') || getValue('currency_symbol') || '£',
        currencyCode: getValue('currencycode') || getValue('currency_code') || 'GBP',
        country: getValue('country') || 'United Kingdom',
        categories: categories,
        duration: duration,
        level: level,
        isDefaultCourse: true,
        courseType: 'csv_import',
        rowNumber: index + 2
      };
    }).filter(course => {
      // Only include courses with all required fields
      return course.name && 
             course.name.trim() !== '' && 
             course.description && 
             course.description.trim() !== '' && 
             course.price > 0;
    });
  };

  // Upload courses to server
  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a CSV file first');
      return;
    }

    if (parsing) {
      toast.error('Please wait for file parsing to complete');
      return;
    }

    setUploading(true);

    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        const csvText = e.target.result;
        
        Papa.parse(csvText, {
          header: true,
          skipEmptyLines: 'greedy',
          transformHeader: (header) => {
            if (!header) return '';
            return header
              .trim()
              .toLowerCase()
              .replace(/[^a-zA-Z0-9]/g, '')
              .replace(/\s+/g, '');
          },
          transform: (value) => {
            if (value === null || value === undefined) return '';
            return value.toString().trim();
          },
          complete: async (results) => {
            if (!results.meta?.fields || results.meta.fields.length === 0) {
              toast.error('No valid headers found in CSV');
              setUploading(false);
              return;
            }

            // Filter out empty rows
            const filteredData = results.data.filter(row => 
              Object.values(row).some(value => value && value.toString().trim() !== '')
            );
            
            if (filteredData.length === 0) {
              toast.error('No valid data to upload');
              setUploading(false);
              return;
            }

            const courses = prepareCoursesForUpload(filteredData, results.meta.fields);
            
            if (courses.length === 0) {
              toast.error('No valid courses found to upload');
              setUploading(false);
              return;
            }

            console.log(`Prepared ${courses.length} courses for upload`);

            try {
              const response = await fetch('/api/courses/default/upload-csv', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                  courses,
                  fileName: file.name,
                  totalRows: filteredData.length,
                  validRows: courses.length,
                  headers: results.meta.fields,
                  region: 'UK'
                })
              });

              if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Server error: ${response.status}`);
              }

              const result = await response.json();
              
              if (result.success) {
                const uploadedCount = result.data?.count || courses.length;
                toast.success(`✅ Successfully uploaded ${uploadedCount} course(s)!`);
                resetForm();
              } else {
                toast.error(result.error || result.message || 'Failed to upload courses');
              }
            } catch (fetchError) {
              console.error('Fetch error:', fetchError);
              toast.error(`Upload failed: ${fetchError.message}`);
            }
            
            setUploading(false);
          },
          error: (error) => {
            console.error('Upload parsing error:', error);
            toast.error('Failed to parse CSV for upload');
            setUploading(false);
          }
        });
      } catch (error) {
        console.error('File processing error:', error);
        toast.error('Failed to process file: ' + error.message);
        setUploading(false);
      }
    };
    
    reader.onerror = () => {
      toast.error('Failed to read file for upload');
      setUploading(false);
    };
    
    reader.readAsText(file, 'UTF-8');
  };

  // Reset form
  const resetForm = () => {
    setFile(null);
    setPreviewData([]);
    setTotalRows(0);
    setHeaders([]);
    setValidationErrors([]);
    setShowPreview(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-4 md:p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Upload Courses via CSV</h2>
        <p className="text-gray-600">Bulk upload courses for United Kingdom region</p>
      </div>

      {/* File Upload Area */}
      <div className="mb-6">
        <div 
          className={`border-2 border-dashed rounded-xl p-6 md:p-8 text-center transition-colors cursor-pointer ${
            file ? 'border-green-300 bg-green-50' : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
          } ${parsing ? 'opacity-70 cursor-wait' : ''}`}
          onClick={() => !parsing && fileInputRef.current?.click()}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".csv"
            className="hidden"
            disabled={parsing}
          />
          
          {parsing ? (
            <div className="space-y-4">
              <div className="inline-flex items-center justify-center w-12 h-12 md:w-16 md:h-16 bg-blue-100 rounded-full">
                <Loader2 className="h-6 w-6 md:h-8 md:w-8 text-blue-600 animate-spin" />
              </div>
              <div>
                <p className="font-medium text-gray-900 text-sm md:text-base">Parsing CSV file...</p>
                <p className="text-xs md:text-sm text-gray-500 mt-1">
                  Processing {totalRows > 0 ? `${totalRows} rows` : 'file'}...
                </p>
              </div>
            </div>
          ) : file ? (
            <div className="space-y-4">
              <div className="inline-flex items-center justify-center w-12 h-12 md:w-16 md:h-16 bg-green-100 rounded-full">
                <CheckCircle className="h-6 w-6 md:h-8 md:w-8 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900 text-sm md:text-base truncate max-w-xs mx-auto">
                  {file.name}
                </p>
                <p className="text-xs md:text-sm text-gray-500 mt-1">
                  {(file.size / 1024).toFixed(1)} KB • {totalRows} row(s)
                </p>
                {headers.length > 0 && (
                  <p className="text-xs text-green-600 mt-1">
                    ✓ {headers.length} column(s) detected
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  resetForm();
                  toast.info('File removed');
                }}
                className="inline-flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm font-medium text-red-600 hover:text-red-700 bg-white rounded-lg border border-red-200 hover:bg-red-50"
              >
                <X className="h-3 w-3 md:h-4 md:w-4" />
                Remove File
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="inline-flex items-center justify-center w-12 h-12 md:w-16 md:h-16 bg-gray-100 rounded-full">
                <Upload className="h-6 w-6 md:h-8 md:h-8 text-gray-400" />
              </div>
              <div>
                <p className="font-medium text-gray-900 text-sm md:text-base">Click to upload CSV file</p>
                <p className="text-xs md:text-sm text-gray-500 mt-1">
                  Supports .csv files up to 10MB
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div className="mb-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-yellow-900">
                    Validation Issues ({validationErrors.length})
                  </h4>
                  {totalRows > 0 && (
                    <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded">
                      {totalRows - validationErrors.length}/{totalRows} valid rows
                    </span>
                  )}
                </div>
                <div className="max-h-48 overflow-y-auto pr-2">
                  <ul className="space-y-1.5">
                    {validationErrors.slice(0, 10).map((error, index) => (
                      <li key={index} className="text-sm text-yellow-700 flex items-start gap-1.5">
                        <span className="text-yellow-500 mt-0.5">•</span>
                        <span>{error}</span>
                      </li>
                    ))}
                    {validationErrors.length > 10 && (
                      <li className="text-sm text-yellow-700">
                        • ... and {validationErrors.length - 10} more issues
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preview Section */}
      {file && previewData.length > 0 && (
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Data Preview ({previewData.length} of {totalRows} rows)
            </h3>
            <div className="flex items-center gap-3">
              {headers.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {headers.slice(0, 3).map((header, idx) => (
                    <span key={idx} className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded truncate max-w-[100px]">
                      {header}
                    </span>
                  ))}
                  {headers.length > 3 && (
                    <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">
                      +{headers.length - 3} more
                    </span>
                  )}
                </div>
              )}
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium whitespace-nowrap"
              >
                {showPreview ? 'Hide Preview' : 'Show Preview'}
              </button>
            </div>
          </div>

          {showPreview && (
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {headers.map((header, index) => {
                        const normalizedHeader = header.toLowerCase().replace(/[^a-zA-Z0-9]/g, '').replace(/\s+/g, '');
                        const isRequired = requiredColumns.some(rc => 
                          rc.toLowerCase().replace(/[^a-zA-Z0-9]/g, '').replace(/\s+/g, '') === normalizedHeader
                        );
                        
                        return (
                          <th
                            key={index}
                            className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"
                          >
                            <div className="flex items-center gap-1">
                              {isRequired && (
                                <span className="text-red-500">*</span>
                              )}
                              <span className="truncate max-w-[150px]" title={header}>
                                {header}
                              </span>
                              {isRequired && (
                                <span className="text-[10px] text-red-500 ml-1">(req)</span>
                              )}
                            </div>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {previewData.map((row, rowIndex) => (
                      <tr 
                        key={rowIndex} 
                        className={`hover:bg-gray-50 ${rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
                      >
                        {headers.map((header, cellIndex) => {
                          const value = row[header] || '';
                          const displayValue = value.toString();
                          const normalizedHeader = header.toLowerCase().replace(/[^a-zA-Z0-9]/g, '').replace(/\s+/g, '');
                          const isRequired = requiredColumns.some(rc => 
                            rc.toLowerCase().replace(/[^a-zA-Z0-9]/g, '').replace(/\s+/g, '') === normalizedHeader
                          );
                          
                          return (
                            <td
                              key={cellIndex}
                              className="px-3 py-2.5 text-sm"
                            >
                              <div 
                                className={`truncate max-w-[200px] ${
                                  !displayValue ? 'text-gray-400 italic' : 
                                  isRequired && !displayValue.trim() ? 'text-red-400 italic' : 'text-gray-900'
                                }`}
                                title={displayValue || 'Empty'}
                              >
                                {displayValue || 'empty'}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <p className="text-xs text-gray-500">
                    Showing {Math.min(5, previewData.length)} of {totalRows} rows • {headers.length} columns
                  </p>
                  {totalRows > 5 && (
                    <p className="text-xs text-blue-600">
                      {totalRows - 5} more rows will be processed on upload
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4">
        <button
          type="button"
          onClick={downloadSampleCSV}
          disabled={parsing || uploading}
          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 md:px-6 md:py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm md:text-base disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download className="h-4 w-4 md:h-5 md:w-5" />
          Download Sample CSV
        </button>

        <button
          type="button"
          onClick={handleUpload}
          disabled={!file || validationErrors.length >= totalRows || uploading || parsing}
          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 md:px-6 md:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm md:text-base disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploading ? (
            <>
              <Loader2 className="h-4 w-4 md:h-5 md:w-5 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 md:h-5 md:w-5" />
              {totalRows > 0 ? `Upload ${totalRows} Course(s)` : 'Upload Courses'}
            </>
          )}
        </button>
      </div>

      {/* CSV Format Requirements for UK */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <h4 className="text-sm font-medium text-gray-900 mb-3">CSV Format Requirements:</h4>
        
        <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-start gap-2">
            <div className="bg-blue-100 p-1.5 rounded">
              <span className="text-sm font-bold text-blue-800">🇬🇧</span>
            </div>
            <div>
              <p className="text-sm font-medium text-blue-900 mb-1">Region Defaults:</p>
              <ul className="text-xs text-blue-800 space-y-1">
                <li>• <strong>Currency:</strong> GBP (£) - Default currency symbol: £</li>
                <li>• <strong>Country:</strong> United Kingdom</li>
                <li>• <strong>Currency Code:</strong> GBP</li>
                <li>• <strong>Price Format:</strong> Use numbers only (e.g., 250 for £250)</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-red-50 border border-red-100 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <h5 className="text-xs font-semibold text-red-800">Required Columns</h5>
            </div>
            <ul className="space-y-2">
              {requiredColumns.map((column) => (
                <li key={column} className="text-sm text-gray-700">
                  <div className="flex items-center gap-2">
                    <FileText className="h-3 w-3 text-red-500" />
                    <code className="bg-white px-2 py-0.5 rounded text-xs border border-red-200 font-mono">
                      {column}
                    </code>
                    <span className="text-xs text-gray-600">- {getColumnDescription(column)}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-green-50 border border-green-100 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <h5 className="text-xs font-semibold text-green-800">Optional Columns</h5>
            </div>
            <ul className="space-y-2">
              {optionalColumns.map((column) => (
                <li key={column} className="text-sm text-gray-700">
                  <div className="flex items-center gap-2">
                    <FileText className="h-3 w-3 text-green-500" />
                    <code className="bg-white px-2 py-0.5 rounded text-xs border border-green-200 font-mono">
                      {column}
                    </code>
                    <span className="text-xs text-gray-600">- {getColumnDescription(column)}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
        
        <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
          <div className="flex items-start gap-2">
            <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-medium text-green-800 mb-1">Tips for CSV upload:</p>
              <ul className="text-xs text-green-700 space-y-1">
                <li>• Use GBP (£) currency format for courses</li>
                <li>• Set country to &quot;United Kingdom&quot; or leave empty for default</li>
                <li>• Include only numbers in price column (no currency symbols)</li>
                <li>• Use specific categories (e.g., &quot;Construction&quot;, &quot;Health & Safety&quot;, &quot;First Aid&quot;)</li>
                <li>• Duration should be in hours (e.g., 24 for a 24-hour course)</li>
                <li>• Level should be: beginner, intermediate, advanced, or all</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper function to get column descriptions
const getColumnDescription = (column) => {
  const descriptions = {
    name: 'Course name (text, required)',
    price: 'Course price (number only, no £ symbol, required)',
    description: 'Course description (text, required)',
    currency: 'Currency name e.g., "GBP"',
    currencySymbol: 'Currency symbol e.g., "£"',
    currencyCode: 'Currency code e.g., "GBP"',
    country: 'Country name e.g., "United Kingdom"',
    categories: 'Comma-separated categories e.g., "Construction,Safety"',
    duration: 'Course duration in hours e.g., "24"',
    level: 'Course level: beginner, intermediate, advanced, or all'
  };
  
  return descriptions[column] || 'Additional information';
};

export default CSVUploadForm;