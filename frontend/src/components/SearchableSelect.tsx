import React, { useState, useRef, useEffect, useMemo } from 'react';

interface Option {
  value: string;
  label: string;
}

interface Group {
  label: string;
  options: Option[];
}

interface SearchableSelectProps {
  groups: Group[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({ groups, value, onChange, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedLabel = useMemo(() => {
    if (!value) return '';
    for (const g of groups) {
      const found = g.options.find(o => o.value === value);
      if (found) return found.label;
    }
    return '';
  }, [value, groups]);

  const filteredGroups = useMemo(() => {
    if (!search) return groups;
    const q = search.toLowerCase();
    return groups
      .map(g => ({ ...g, options: g.options.filter(o => o.label.toLowerCase().includes(q)) }))
      .filter(g => g.options.length > 0);
  }, [search, groups]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSelect = (opt: Option) => {
    onChange(opt.value);
    setSearch('');
    setIsOpen(false);
    inputRef.current?.blur();
  };

  const handleFocus = () => {
    setIsOpen(true);
    setSearch('');
  };

  const handleClear = () => {
    onChange('');
    setSearch('');
    inputRef.current?.focus();
  };

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <div className="input-group">
        <input
          ref={inputRef}
          type="text"
          className="form-control"
          value={isOpen ? search : selectedLabel}
          onChange={e => { setSearch(e.target.value); if (!isOpen) setIsOpen(true); }}
          onFocus={handleFocus}
          placeholder={placeholder || 'Buscar destinatario...'}
          autoComplete="off"
        />
        {value && (
          <button className="btn btn-outline-secondary" type="button" onClick={handleClear} tabIndex={-1}>
            <i className="bi bi-x"></i>
          </button>
        )}
      </div>
      {isOpen && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 1050,
          maxHeight: 280, overflowY: 'auto',
          background: '#fff', border: '1px solid #dee2e6',
          borderRadius: '0 0 8px 8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}>
          {filteredGroups.length === 0 ? (
            <div className="p-3 text-center text-muted small">Sin resultados</div>
          ) : filteredGroups.map((g, gi) => (
            <div key={gi}>
              <div style={{
                padding: '6px 12px', fontWeight: 600, fontSize: '0.78rem',
                color: '#6c757d', background: '#f8f9fa', borderBottom: '1px solid #eee',
                textTransform: 'uppercase', letterSpacing: '0.03em'
              }}>
                {g.label}
              </div>
              {g.options.map(o => (
                <div
                  key={o.value}
                  onClick={() => handleSelect(o)}
                  style={{
                    padding: '8px 12px', cursor: 'pointer', fontSize: '0.88rem',
                    borderBottom: '1px solid #f0f0f0',
                    background: o.value === value ? '#e8f4fd' : ''
                  }}
                  onMouseEnter={e => { if (o.value !== value) e.currentTarget.style.background = '#f0f7ff'; }}
                  onMouseLeave={e => { if (o.value !== value) e.currentTarget.style.background = ''; }}
                >
                  {o.label}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchableSelect;
