import React, { useState } from 'react';
import {
  FolderLock,
  FileText,
  Upload,
  Search,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Plus,
  ExternalLink,
  X,
} from 'lucide-react';
import { VaultDocument } from '../types';
import { glass, glass2, glassModal, glassInput, emeraldBtnSolid, emeraldBtn } from '../lib/styles';

interface VaultProps {
  documents: VaultDocument[];
  onUploadDocument: (doc: Partial<VaultDocument>) => Promise<void>;
}

export const Vault: React.FC<VaultProps> = ({ documents, onUploadDocument }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isUploadOpen, setIsUploadOpen] = useState<boolean>(false);
  const [uploadName, setUploadName] = useState<string>('');
  const [uploadCategory, setUploadCategory] = useState<VaultDocument['category']>('Receipts');

  const categories = [
    'All',
    'Receipts',
    'Invoices',
    'Warranty',
    'Travel',
    'Identity',
    'Memberships',
    'Other',
  ];

  const filteredDocs = documents.filter((doc) => {
    if (selectedCategory !== 'All' && doc.category !== selectedCategory) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        doc.name.toLowerCase().includes(q) ||
        doc.category.toLowerCase().includes(q) ||
        doc.source.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadName.trim()) return;
    await onUploadDocument({
      name: uploadName.trim(),
      category: uploadCategory,
      source: 'User Upload',
      size: '420 KB',
      verified: true,
    });
    setUploadName('');
    setIsUploadOpen(false);
  };

  return (
    <div className="flex-1 flex flex-col p-4 md:p-8 max-w-6xl mx-auto w-full gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <FolderLock className="w-7 h-7 text-emerald-400" />
            <span>Naviq Personal Vault</span>
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Encrypted storage for warranties, receipts, contracts, and evidence used to resolve your fixes.
          </p>
        </div>

        <button
          onClick={() => setIsUploadOpen(true)}
          className={`px-4 py-2.5 rounded-xl text-xs font-semibold ${emeraldBtnSolid} flex items-center gap-2 self-start sm:self-auto`}
        >
          <Upload className="w-4 h-4 stroke-[2.5]" />
          <span>Upload Document</span>
        </button>
      </div>

      {/* Security Banner */}
      <div className={`p-4 rounded-2xl ${glass2} border border-emerald-500/20 flex items-center justify-between gap-3 text-xs text-emerald-300`}>
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>
            Your documents stay private, encrypted at rest, and are only accessed when explicitly needed for your active tasks.
          </span>
        </div>
      </div>

      {/* Search & Category Filter */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto p-1 bg-black/40 rounded-xl border border-white/5">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search documents..."
              className={`w-full pl-9 pr-3 py-1.5 rounded-xl text-xs ${glassInput}`}
            />
          </div>
        </div>
      </div>

      {/* Document Grid */}
      {filteredDocs.length === 0 ? (
        <div className={`py-16 px-4 rounded-2xl ${glass} border border-white/5 text-center flex flex-col items-center justify-center gap-2`}>
          <FolderLock className="w-10 h-10 text-emerald-500/40" />
          <h3 className="text-sm font-semibold text-white">No documents found</h3>
          <p className="text-xs text-gray-400">Upload warranties, invoices or receipts to give Naviq proof materials.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocs.map((doc) => (
            <div
              key={doc.id}
              className={`p-4 rounded-2xl ${glass} border border-white/5 hover:border-emerald-500/30 transition-all flex flex-col justify-between gap-3 group`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="p-2 rounded-xl bg-emerald-950/40 border border-emerald-500/20 text-emerald-400">
                    <FileText className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] text-emerald-300/80 bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-500/20">
                    {doc.category}
                  </span>
                </div>

                <h3 className="text-xs font-semibold text-white group-hover:text-emerald-200 transition-colors line-clamp-1">
                  {doc.name}
                </h3>

                <div className="flex items-center gap-2 text-[11px] text-gray-400 mt-1">
                  <span>{doc.source}</span>
                  <span>•</span>
                  <span>{doc.size}</span>
                  <span>•</span>
                  <span>{doc.date}</span>
                </div>
              </div>

              {doc.usedByMission && (
                <div className="pt-2.5 border-t border-white/5 flex items-center justify-between text-[10px]">
                  <span className="text-gray-400">Used for:</span>
                  <span className="text-emerald-400 font-medium truncate max-w-[150px]">{doc.usedByMission}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {isUploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <form
            onSubmit={handleUploadSubmit}
            className={`w-full max-w-md rounded-2xl ${glassModal} p-6 border border-emerald-500/30 shadow-2xl flex flex-col gap-4`}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Upload to Vault</h3>
              <button
                type="button"
                onClick={() => setIsUploadOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">Document Name / File</label>
              <input
                type="text"
                required
                value={uploadName}
                onChange={(e) => setUploadName(e.target.value)}
                placeholder="e.g. Airline Ticket Invoice.pdf"
                className={`w-full px-3 py-2 rounded-xl text-xs ${glassInput}`}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">Category</label>
              <select
                value={uploadCategory}
                onChange={(e) => setUploadCategory(e.target.value as any)}
                className={`w-full px-3 py-2 rounded-xl text-xs bg-black/60 text-white border border-white/10 outline-none`}
              >
                {categories.filter((c) => c !== 'All').map((cat) => (
                  <option key={cat} value={cat} className="bg-[#03150d] text-white">
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="pt-3 border-t border-white/10 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsUploadOpen(false)}
                className="px-4 py-2 rounded-xl text-xs text-gray-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`px-5 py-2 rounded-xl text-xs font-semibold ${emeraldBtnSolid}`}
              >
                Add Document
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
