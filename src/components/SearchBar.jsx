import React from 'react';
import { Search, X } from 'lucide-react';
import InputWithIcon from './InputWithIcon';

export default function SearchBar({ value, onChange, placeholder = "Search..." }) {
  return (
    <InputWithIcon
      type="text"
      icon={Search}
      iconSize={18}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="text-sm"
      rightSlot={
        value ? (
          <button
            onClick={() => onChange('')}
            type="button"
            className="text-slate-400 hover:text-slate-200 transition-colors"
            aria-label="Clear search"
          >
            <X size={16} />
          </button>
        ) : null
      }
    />
  );
}
