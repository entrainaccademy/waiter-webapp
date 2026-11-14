import React, { useState } from 'react';
import { X, MessageSquare, Check } from 'lucide-react';

const SUGGESTED_NOTES = [
  'Extra Spicy',
  'Mild / Less Spicy',
  'No Onion / Garlic',
  'Extra Crispy',
  'Serve Hot',
  'Less Salt',
  'No Sugar',
  'Gluten Free',
];

export const ItemNotesModal = ({ isOpen, onClose, itemName, initialNotes, onSave }) => {
  const [notes, setNotes] = useState(initialNotes || '');

  if (!isOpen) return null;

  const handleChipClick = (chip) => {
    if (notes.includes(chip)) {
      setNotes(notes.replace(chip, '').replace(/,\s*,/g, ',').replace(/^,\s*|,\s*$/g, '').trim());
    } else {
      setNotes((prev) => (prev ? `${prev}, ${chip}` : chip));
    }
  };

  const handleSave = () => {
    onSave(notes.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-float p-5 pb-8 sm:pb-5 space-y-4 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Cooking Instructions</h3>
              <p className="text-xs text-slate-400 truncate max-w-[220px]">{itemName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Suggestion Chips */}
        <div>
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
            Quick Suggestions
          </label>
          <div className="flex flex-wrap gap-1.5">
            {SUGGESTED_NOTES.map((chip) => {
              const isSelected = notes.includes(chip);
              return (
                <button
                  key={chip}
                  type="button"
                  onClick={() => handleChipClick(chip)}
                  className={`text-xs px-2.5 py-1.5 rounded-xl border transition-all ${
                    isSelected
                      ? 'bg-orange-500 text-white border-orange-500 font-semibold shadow-sm'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  {chip}
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom text area */}
        <div>
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
            Special Instructions / Kitchen Notes
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Please make it extra spicy, gravy on the side..."
            rows={3}
            maxLength={200}
            className="w-full text-sm p-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 bg-slate-50/50 resize-none"
          />
          <div className="text-right text-[10px] text-slate-400">
            {notes.length}/200 characters
          </div>
        </div>

        <div className="flex items-center space-x-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 py-2.5 px-4 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-sm flex items-center justify-center space-x-1.5"
          >
            <Check className="w-4 h-4" />
            <span>Save Instructions</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ItemNotesModal;
