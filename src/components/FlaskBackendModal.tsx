import React, { useState } from 'react';
import { X, Copy, Check, Terminal, Server, Database, ArrowRight } from 'lucide-react';

interface FlaskBackendModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FlaskBackendModal: React.FC<FlaskBackendModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const flaskCodeSnippet = `from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3

app = Flask(__name__)
CORS(app)

# Run with: python app.py
# Database: SQLite (mda_registry.db)`;

  const handleCopy = () => {
    navigator.clipboard.writeText(flaskCodeSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div 
        className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden my-6"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <Server className="w-5 h-5 text-slate-800" />
            <div>
              <h2 className="text-sm font-bold text-slate-900">Python Flask & React Architecture</h2>
              <p className="text-xs text-slate-500">Self-hosted SQLite database & file storage for Edo State Ministry of Communication & Digital Economy</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 text-xs text-slate-600">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <h3 className="font-semibold text-slate-900 text-sm mb-2 flex items-center gap-2">
              <Database className="w-4 h-4 text-slate-700" />
              <span>Full Python Flask Backend Included</span>
            </h3>
            <p className="leading-relaxed mb-3">
              We have generated the complete Python Flask backend in the <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-800 font-bold">backend_flask/</code> directory of this repository! It is pre-configured with SQLite, multi-file uploads, and REST endpoints for inward and outward letters.
            </p>

            <div className="bg-slate-950 text-slate-200 p-3 rounded-lg font-mono text-[11px] space-y-1">
              <p className="text-slate-400"># 1. Enter the backend folder</p>
              <p>cd backend_flask</p>
              <p className="text-slate-400 mt-2"># 2. Install Flask dependencies</p>
              <p>pip install -r requirements.txt</p>
              <p className="text-slate-400 mt-2"># 3. Start the Flask server</p>
              <p>python app.py</p>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-slate-900 mb-2">Flask Endpoints Handled:</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono">
              <div className="p-2 bg-slate-50 rounded border border-slate-200">
                <span className="text-emerald-700 font-bold">GET</span> /api/correspondence
                <p className="font-sans text-slate-500 mt-0.5">Filter by File No, Source, or Date</p>
              </div>
              <div className="p-2 bg-slate-50 rounded border border-slate-200">
                <span className="text-blue-700 font-bold">POST</span> /api/correspondence
                <p className="font-sans text-slate-500 mt-0.5">Save received/outgoing letter</p>
              </div>
              <div className="p-2 bg-slate-50 rounded border border-slate-200">
                <span className="text-blue-700 font-bold">POST</span> /api/upload
                <p className="font-sans text-slate-500 mt-0.5">Upload multiple PDF/DOC attachments</p>
              </div>
              <div className="p-2 bg-slate-50 rounded border border-slate-200">
                <span className="text-emerald-700 font-bold">GET</span> /uploads/&lt;filename&gt;
                <p className="font-sans text-slate-500 mt-0.5">Serve archived documents</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-200">
            <span className="text-slate-400 text-[11px]">
              Ready to run standalone or on your MDA's internal network.
            </span>
            <button
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
