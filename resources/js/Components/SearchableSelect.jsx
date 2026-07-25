import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Search, ChevronDown, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SearchableSelect({
    options = [],
    value = '',
    onChange,
    placeholder = 'Pilih...',
    searchPlaceholder = 'Cari...',
    className = '',
    disabled = false,
    error = false,
    clearable = false
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [coords, setCoords] = useState({ top: 0, left: 0, width: 0, openUpward: false });
    
    const triggerRef = useRef(null);
    const searchInputRef = useRef(null);
    const dropdownRef = useRef(null);

    // Normalize options format to array of objects { value, label, sublabel }
    const normalizedOptions = options.map(opt => {
        if (typeof opt === 'object' && opt !== null) {
            return {
                value: opt.value !== undefined ? opt.value : opt.id,
                label: opt.label !== undefined ? opt.label : (opt.nama_barang || opt.nama_perusahaan || opt.nama || opt.nomor_po || String(opt.value)),
                sublabel: opt.sublabel || opt.kode_barang || opt.kategori_biaya || ''
            };
        }
        return { value: opt, label: String(opt), sublabel: '' };
    });

    const selectedOption = normalizedOptions.find(
        opt => String(opt.value) === String(value)
    );

    const filteredOptions = normalizedOptions.filter(opt => {
        const term = searchTerm.toLowerCase();
        return (
            opt.label.toLowerCase().includes(term) ||
            (opt.sublabel && opt.sublabel.toLowerCase().includes(term))
        );
    });

    // Calculate smart positioning (viewport relative)
    const updatePosition = useCallback(() => {
        if (!triggerRef.current) return;
        const rect = triggerRef.current.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const estimatedDropdownHeight = 280; // Estimated max height of dropdown

        const spaceBelow = viewportHeight - rect.bottom;
        const spaceAbove = rect.top;

        const openUpward = spaceBelow < estimatedDropdownHeight && spaceAbove > spaceBelow;

        setCoords({
            top: openUpward ? rect.top - 6 : rect.bottom + 6,
            left: rect.left,
            width: Math.max(rect.width, 240), // Minimum width 240px for readable text
            openUpward
        });
    }, []);

    const toggleOpen = () => {
        if (disabled) return;
        if (!isOpen) {
            updatePosition();
        }
        setIsOpen(!isOpen);
    };

    // Close on outside click
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                triggerRef.current && !triggerRef.current.contains(event.target) &&
                dropdownRef.current && !dropdownRef.current.contains(event.target)
            ) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    // Recalculate on scroll or window resize
    useEffect(() => {
        if (!isOpen) return;

        const handleScrollOrResize = () => {
            updatePosition();
        };

        window.addEventListener('scroll', handleScrollOrResize, true);
        window.addEventListener('resize', handleScrollOrResize);

        return () => {
            window.removeEventListener('scroll', handleScrollOrResize, true);
            window.removeEventListener('resize', handleScrollOrResize);
        };
    }, [isOpen, updatePosition]);

    // Focus search input when dropdown opens
    useEffect(() => {
        if (isOpen && searchInputRef.current) {
            setTimeout(() => searchInputRef.current?.focus(), 50);
        } else if (!isOpen) {
            setSearchTerm('');
        }
    }, [isOpen]);

    const handleSelect = (optValue) => {
        if (onChange) {
            onChange(optValue);
        }
        setIsOpen(false);
    };

    const handleClear = (e) => {
        e.stopPropagation();
        if (onChange) {
            onChange('');
        }
    };

    return (
        <div className={`relative w-full ${className}`} ref={triggerRef}>
            {/* Trigger Button */}
            <div
                onClick={toggleOpen}
                className={`w-full bg-slate-50 border ${
                    error
                        ? 'border-rose-400 focus:ring-rose-400/20'
                        : isOpen
                        ? 'border-blue-500 ring-4 ring-blue-500/10 bg-white'
                        : 'border-slate-200 hover:border-slate-300'
                } rounded-xl px-3.5 py-3 flex items-center justify-between cursor-pointer transition-all duration-200 text-sm ${
                    disabled ? 'opacity-50 cursor-not-allowed bg-slate-100' : ''
                }`}
            >
                <div className="flex-1 truncate pr-2">
                    {selectedOption ? (
                        <span className="font-bold text-slate-800">
                            {selectedOption.label}
                            {selectedOption.sublabel && (
                                <span className="ml-1.5 text-xs text-slate-400 font-medium">
                                    ({selectedOption.sublabel})
                                </span>
                            )}
                        </span>
                    ) : (
                        <span className="font-bold text-slate-400">{placeholder}</span>
                    )}
                </div>

                <div className="flex items-center gap-1 shrink-0 text-slate-400">
                    {clearable && selectedOption && !disabled && (
                        <button
                            type="button"
                            onClick={handleClear}
                            className="p-1 hover:text-slate-600 rounded-full transition-colors"
                        >
                            <X size={14} />
                        </button>
                    )}
                    <ChevronDown
                        size={16}
                        className={`transition-transform duration-200 ${isOpen ? 'rotate-180 text-blue-600' : ''}`}
                    />
                </div>
            </div>

            {/* Dropdown Menu Portaled to document.body */}
            {isOpen && typeof document !== 'undefined' && createPortal(
                <AnimatePresence>
                    <motion.div
                        ref={dropdownRef}
                        initial={{ opacity: 0, y: coords.openUpward ? 6 : -6, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: coords.openUpward ? 6 : -6, scale: 0.98 }}
                        transition={{ duration: 0.15 }}
                        style={{
                            position: 'fixed',
                            top: coords.openUpward ? 'auto' : `${coords.top}px`,
                            bottom: coords.openUpward ? `${window.innerHeight - coords.top}px` : 'auto',
                            left: `${coords.left}px`,
                            width: `${coords.width}px`,
                            zIndex: 99999
                        }}
                        className="bg-white border border-slate-200/90 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-72 border-t border-slate-100 ring-1 ring-black/5"
                    >
                        {/* Search Bar Input */}
                        <div className="p-2 border-b border-slate-100 bg-slate-50/80 backdrop-blur-sm sticky top-0 z-10">
                            <div className="relative flex items-center">
                                <Search size={16} className="absolute left-3 text-blue-500 pointer-events-none" />
                                <input
                                    ref={searchInputRef}
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder={searchPlaceholder}
                                    className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:font-semibold placeholder:text-slate-400"
                                />
                            </div>
                        </div>

                        {/* Options List */}
                        <div className="overflow-y-auto p-1.5 space-y-0.5 max-h-56">
                            {filteredOptions.length === 0 ? (
                                <div className="py-6 text-center text-slate-400 text-xs font-bold">
                                    Tidak ada data yang cocok
                                </div>
                            ) : (
                                filteredOptions.map((opt) => {
                                    const isSelected = String(opt.value) === String(value);
                                    return (
                                        <div
                                            key={opt.value}
                                            onClick={() => handleSelect(opt.value)}
                                            className={`px-3.5 py-2.5 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center justify-between ${
                                                isSelected
                                                    ? 'bg-blue-50 text-blue-700 font-extrabold'
                                                    : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                                            }`}
                                        >
                                            <div className="flex flex-col truncate pr-2">
                                                <span className="truncate">{opt.label}</span>
                                                {opt.sublabel && (
                                                    <span className="text-[10px] text-slate-400 font-semibold truncate">
                                                        {opt.sublabel}
                                                    </span>
                                                )}
                                            </div>
                                            {isSelected && (
                                                <Check size={14} className="text-blue-600 shrink-0" />
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </motion.div>
                </AnimatePresence>,
                document.body
            )}
        </div>
    );
}
