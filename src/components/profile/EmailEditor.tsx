'use client';

import { useState } from 'react';
import { Mail, Check, X } from 'lucide-react';

interface EmailEditorProps {
  initialEmail: string | null;
}

export default function EmailEditor({ initialEmail }: EmailEditorProps) {
  const [email, setEmail] = useState(initialEmail || '');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedEmail, setSavedEmail] = useState(initialEmail);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email || null }),
      });

      if (response.ok) {
        setSavedEmail(email || null);
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Failed to update email:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEmail(savedEmail || '');
    setIsEditing(false);
  };

  if (!isEditing) {
    return (
      <button
        onClick={() => setIsEditing(true)}
        className="w-full bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-4 text-left"
      >
        <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center">
          <Mail size={20} className="text-emerald-600" />
        </div>
        <div className="flex-1">
          <h3 className="font-medium text-gray-900">Chronicle Email</h3>
          <p className="text-sm text-gray-500">
            {savedEmail || 'Add email for monthly chronicles'}
          </p>
        </div>
      </button>
    );
  }

  return (
    <div className="w-full bg-white rounded-2xl p-4 shadow-sm border border-emerald-200">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center">
          <Mail size={20} className="text-emerald-600" />
        </div>
        <h3 className="font-medium text-gray-900">Chronicle Email</h3>
      </div>
      <div className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-transparent"
          autoFocus
        />
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="w-10 h-10 bg-emerald-500 text-white rounded-xl flex items-center justify-center hover:bg-emerald-600 disabled:opacity-50"
        >
          <Check size={18} />
        </button>
        <button
          onClick={handleCancel}
          className="w-10 h-10 bg-gray-100 text-gray-600 rounded-xl flex items-center justify-center hover:bg-gray-200"
        >
          <X size={18} />
        </button>
      </div>
      <p className="text-xs text-gray-400 mt-2">
        Monthly Fox Chronicle delivered on the 1st
      </p>
    </div>
  );
}
