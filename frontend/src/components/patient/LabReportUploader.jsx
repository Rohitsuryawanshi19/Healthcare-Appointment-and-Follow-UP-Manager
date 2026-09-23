import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, FileText, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import api from '../../services/api';

export function LabReportUploader() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type !== 'application/pdf') {
        setError('Please upload a valid PDF file.');
        return;
      }
      setFile(selectedFile);
      setError(null);
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);

    try {
      // Convert file to Base64
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const base64String = reader.result.split(',')[1];
        
        try {
          const res = await api.post('/ai/parse-lab-report', { pdfBase64: base64String });
          if (res.data.success) {
            setResult(res.data.data);
          } else {
            setError('Failed to parse lab report.');
          }
        } catch (err) {
          setError(err.response?.data?.message || 'Error processing report.');
        } finally {
          setLoading(false);
        }
      };
      reader.onerror = () => {
        setError('Error reading file.');
        setLoading(false);
      };
    } catch (err) {
      setError('Unexpected error occurred.');
      setLoading(false);
    }
  };

  return (
    <Card className="p-6 h-full flex flex-col">
      <div className="flex items-center gap-3 mb-4">
        <div className="h-10 w-10 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center">
          <FileText className="h-5 w-5" />
        </div>
        <div>
          <h3 className="font-bold text-slate-900">AI Lab Report Parser</h3>
          <p className="text-xs text-slate-500">Upload your PDF lab report for a quick AI summary.</p>
        </div>
      </div>

      {!result && (
        <div className="space-y-4 flex-1 flex flex-col justify-center">
          <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:bg-slate-50 transition-colors">
            <input
              type="file"
              accept="application/pdf"
              onChange={handleFileChange}
              className="hidden"
              id="lab-report-upload"
            />
            <label htmlFor="lab-report-upload" className="cursor-pointer flex flex-col items-center">
              <Upload className="h-8 w-8 text-slate-400 mb-2" />
              <span className="text-sm font-medium text-slate-700">
                {file ? file.name : 'Click to select PDF report'}
              </span>
            </label>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg text-sm">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          <Button 
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white" 
            onClick={handleUpload}
            disabled={!file || loading}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Parsing...
              </>
            ) : (
              'Parse Report'
            )}
          </Button>
        </div>
      )}

      {result && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4 mt-auto bg-slate-50 p-4 rounded-xl border border-slate-200"
        >
          {result.abnormalities ? (
             <div className="flex items-center gap-2 text-rose-600 bg-rose-50 p-2 rounded text-sm font-bold">
               <AlertCircle className="h-4 w-4" /> Abnormalities Detected
             </div>
          ) : (
            <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 p-2 rounded text-sm font-bold">
              <CheckCircle2 className="h-4 w-4" /> All Normal
            </div>
          )}

          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Summary</h4>
            <p className="text-sm text-slate-700">{result.summary}</p>
          </div>

          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Key Findings</h4>
            <ul className="list-disc list-inside text-sm text-slate-700 space-y-1">
              {result.keyFindings.map((finding, idx) => (
                <li key={idx}>{finding}</li>
              ))}
            </ul>
          </div>

          <Button 
            variant="outline" 
            className="w-full mt-2" 
            onClick={() => {
              setResult(null);
              setFile(null);
            }}
          >
            Upload Another
          </Button>
        </motion.div>
      )}
    </Card>
  );
}
