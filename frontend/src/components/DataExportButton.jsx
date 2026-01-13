/**
 * GDPR Data Export Button Component
 * Allows users to download all their data
 */
import React, { useState } from 'react';
import { Button } from './ui/button';
import { Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import api from '../lib/api';

const DataExportButton = ({ variant = 'outline', size = 'default', className = '' }) => {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      console.log('📦 Exporting user data...');
      const response = await api.get('/users/export');
      
      // Create downloadable JSON file
      const dataStr = JSON.stringify(response.data, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      // Create download link
      const link = document.createElement('a');
      link.href = url;
      link.download = `odinring-data-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Cleanup
      URL.revokeObjectURL(url);
      
      toast.success('Your data has been exported successfully!');
      console.log('✅ Data export complete');
    } catch (error) {
      console.error('❌ Data export failed:', error);
      toast.error(error.response?.data?.detail || 'Failed to export data');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleExport}
      disabled={isExporting}
      className={className}
    >
      {isExporting ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Exporting...
        </>
      ) : (
        <>
          <Download className="mr-2 h-4 w-4" />
          Export My Data
        </>
      )}
    </Button>
  );
};

export default DataExportButton;








