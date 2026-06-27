'use client';

import { useState, useRef } from 'react';
import { FileText, Upload, Trash2, Download, Calendar, AlertCircle, X, FolderOpen, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Document {
  id: string;
  name: string;
  type: string;
  uploadedDate: string;
  url: string;
  expiryDate?: string | null;
}

interface DocumentsSectionProps {
  documents: Document[];
  onUploadDocument: (file: File, category: string) => Promise<void>;
  onDeleteDocument: (documentId: string) => Promise<void>;
}

const categories = [
  'All', 'Identity Proof', 'Address Proof', 'Educational Certificate', 
  'Professional Certificate', 'Medical Report', 'Tax Document', 
  'Bank Document', 'Employment Contract', 'Employment', 'Personal',
  'Policy Document', 'Other'
];

export function DocumentsSection({ documents, onUploadDocument, onDeleteDocument }: DocumentsSectionProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [category, setCategory] = useState('Identity Proof');
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async () => {
    if (!selectedFile) return;
    setIsUploading(true);
    await onUploadDocument(selectedFile, category);
    setSelectedFile(null);
    setIsUploading(false);
  };

  const handleDownload = async (url: string, name: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(url, '_blank');
    }
  };

  const isExpired = (expiryDate?: string | null) => expiryDate && new Date(expiryDate) < new Date();
  const isExpiringSoon = (expiryDate?: string | null) => {
    if (!expiryDate) return false;
    const days = Math.ceil((new Date(expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return days <= 30 && days > 0;
  };

  const filteredDocs = documents.filter(doc => {
    const matchesFilter = filter === 'All' || doc.type === filter;
    const matchesSearch = doc.name.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const docsByCategory = categories.reduce((acc, cat) => {
    if (cat === 'All') {
      acc[cat] = filteredDocs;
    } else {
      acc[cat] = filteredDocs.filter(d => d.type === cat);
    }
    return acc;
  }, {} as Record<string, Document[]>);

  console.log('Documents received:', documents);
  console.log('Filtered docs:', filteredDocs);
  console.log('Docs by category:', docsByCategory);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">My Documents</h2>
          <p className="text-xs text-gray-500">Organized by category</p>
        </div>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <Upload className="h-4 w-4" />
          Upload
        </button>
      </div>

      {/* Search & Filter */}
      {documents.length > 0 && (
        <div className="flex gap-2 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search documents..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm"
            />
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat === 'All' ? 'All Categories' : cat}</option>
            ))}
          </select>
        </div>
      )}

      {/* Upload Form */}
      <AnimatePresence>
        {(isUploading || selectedFile) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4 p-3 bg-blue-50 dark:bg-gray-800 rounded-lg border border-blue-200 dark:border-gray-700 overflow-hidden"
          >
            <div className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{selectedFile?.name}</p>
                <p className="text-xs text-gray-500">{selectedFile ? (selectedFile.size / 1024).toFixed(1) : '0'} KB</p>
              </div>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="px-2 py-1.5 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm"
              >
                {categories.filter(c => c !== 'All').map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <button
                onClick={handleUpload}
                disabled={isUploading}
                className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {isUploading ? 'Uploading...' : 'Upload'}
              </button>
              <button
                onClick={() => { setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty State */}
      {documents.length === 0 && !isUploading ? (
        <div className="text-center py-8 px-4 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
          <FolderOpen className="h-8 w-8 mx-auto text-gray-400 mb-2" />
          <p className="text-sm text-gray-500">No documents uploaded yet</p>
        </div>
      ) : filteredDocs.length === 0 ? (
        <div className="text-center py-8 px-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p className="text-sm text-gray-500">No documents match your search/filter</p>
          <button 
            onClick={() => { setSearch(''); setFilter('All'); }}
            className="mt-2 text-sm text-blue-600 hover:underline"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {categories.filter(c => c !== 'All').map(cat => {
            const catDocs = docsByCategory[cat];
            if (catDocs.length === 0) return null;

            return (
              <div key={cat}>
                {/* Category Header */}
                <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-200 dark:border-gray-700">
                  <FolderOpen className="h-4 w-4 text-blue-600" />
                  <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{cat}</h3>
                  <span className="text-xs text-gray-500">({catDocs.length})</span>
                </div>

                {/* Documents Table */}
                <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th className="text-left text-xs font-medium text-gray-500 uppercase px-3 py-2">Document Name</th>
                        <th className="text-left text-xs font-medium text-gray-500 uppercase px-3 py-2 hidden md:table-cell">Uploaded</th>
                        <th className="text-left text-xs font-medium text-gray-500 uppercase px-3 py-2 hidden lg:table-cell">Expires</th>
                        <th className="text-right text-xs font-medium text-gray-500 uppercase px-3 py-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900">
                      {catDocs.map((doc) => (
                        <tr key={doc.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                          <td className="px-3 py-2.5">
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-blue-600 flex-shrink-0" />
                              <span className="text-sm text-gray-900 dark:text-white truncate max-w-xs">{doc.name}</span>
                              {isExpired(doc.expiryDate) && (
                                <span className="px-1.5 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs rounded">
                                  Expired
                                </span>
                              )}
                              {isExpiringSoon(doc.expiryDate) && !isExpired(doc.expiryDate) && (
                                <span className="px-1.5 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 text-xs rounded">
                                  Soon
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-2.5 text-sm text-gray-500 hidden md:table-cell">
                            {new Date(doc.uploadedDate).toLocaleDateString()}
                          </td>
                          <td className="px-3 py-2.5 text-sm text-gray-500 hidden lg:table-cell">
                            {doc.expiryDate ? new Date(doc.expiryDate).toLocaleDateString() : '—'}
                          </td>
                          <td className="px-3 py-2.5 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => handleDownload(doc.url, doc.name)}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                                title="Download"
                              >
                                <Download className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => onDeleteDocument(doc.id)}
                                className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
          
          {/* Show uncategorized documents */}
          {filteredDocs.some(d => !categories.slice(1).includes(d.type)) && (
            <div>
              <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-200 dark:border-gray-700">
                <FolderOpen className="h-4 w-4 text-gray-500" />
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Other Documents</h3>
                <span className="text-xs text-gray-500">
                  ({filteredDocs.filter(d => !categories.slice(1).includes(d.type)).length})
                </span>
              </div>
              <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="text-left text-xs font-medium text-gray-500 uppercase px-3 py-2">Document Name</th>
                      <th className="text-left text-xs font-medium text-gray-500 uppercase px-3 py-2 hidden md:table-cell">Uploaded</th>
                      <th className="text-left text-xs font-medium text-gray-500 uppercase px-3 py-2 hidden lg:table-cell">Expires</th>
                      <th className="text-right text-xs font-medium text-gray-500 uppercase px-3 py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900">
                    {filteredDocs.filter(d => !categories.slice(1).includes(d.type)).map((doc) => (
                      <tr key={doc.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-blue-600 flex-shrink-0" />
                            <span className="text-sm text-gray-900 dark:text-white truncate max-w-xs">{doc.name}</span>
                            {isExpired(doc.expiryDate) && (
                              <span className="px-1.5 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs rounded">
                                Expired
                              </span>
                            )}
                            {isExpiringSoon(doc.expiryDate) && !isExpired(doc.expiryDate) && (
                              <span className="px-1.5 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 text-xs rounded">
                                Soon
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-2.5 text-sm text-gray-500 hidden md:table-cell">
                          {new Date(doc.uploadedDate).toLocaleDateString()}
                        </td>
                        <td className="px-3 py-2.5 text-sm text-gray-500 hidden lg:table-cell">
                          {doc.expiryDate ? new Date(doc.expiryDate).toLocaleDateString() : '—'}
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleDownload(doc.url, doc.name)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                              title="Download"
                            >
                              <Download className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => onDeleteDocument(doc.id)}
                              className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
        className="hidden"
      />
    </div>
  );
}
