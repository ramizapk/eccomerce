'use client';

import { useState } from 'react';

export default function CategorySelector({ categories, selectedCategories, onChange }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedGroups, setExpandedGroups] = useState({});

    const toggleGroup = (id) => {
        setExpandedGroups(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    const renderCategory = (category, level = 0) => {
        const hasChildren = category.children && category.children.length > 0;
        const isExpanded = !!expandedGroups[category.id];
        const isSelected = selectedCategories.includes(category.id);

        // Simple search matching
        const matchesSearch = category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (category.children?.some(child => child.name.toLowerCase().includes(searchTerm.toLowerCase())));

        if (searchTerm && !matchesSearch) return null;

        return (
            <div key={category.id} className="select-none">
                <div
                    className={`flex items-center gap-2 py-2 px-3 rounded-xl transition-all hover:bg-gray-50 group ${isSelected ? 'bg-primary-50/50' : ''}`}
                    style={{ marginRight: `${level * 20}px` }}
                >
                    {hasChildren ? (
                        <button
                            type="button"
                            onClick={() => toggleGroup(category.id)}
                            className={`w-6 h-6 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors ${isExpanded ? 'rotate-90' : ''}`}
                        >
                            <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    ) : (
                        <div className="w-6" />
                    )}

                    <label className="flex-1 flex items-center gap-3 cursor-pointer">
                        <div className="relative flex items-center justify-center">
                            <input
                                type="checkbox"
                                className="peer hidden"
                                checked={isSelected}
                                onChange={() => onChange(category.id)}
                            />
                            <div className={`w-5 h-5 rounded-md border-2 transition-all flex items-center justify-center
                                ${isSelected
                                    ? 'bg-primary-600 border-primary-600'
                                    : 'border-gray-300 group-hover:border-primary-400 bg-white'}`}
                            >
                                {isSelected && (
                                    <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                )}
                            </div>
                        </div>
                        <span className={`text-sm transition-colors ${isSelected ? 'font-bold text-primary-900' : 'text-gray-600 group-hover:text-gray-900'}`}>
                            {category.name}
                        </span>
                        {hasChildren && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-400 font-bold">
                                {category.children.length}
                            </span>
                        )}
                    </label>
                </div>

                {hasChildren && isExpanded && (
                    <div className="mt-1">
                        {category.children.map(child => renderCategory(child, level + 1))}
                    </div>
                )}
            </div>
        );
    };

    const toggleAll = (expand) => {
        if (expand) {
            const allWithChildren = {};
            const traverse = (cats) => {
                cats.forEach(c => {
                    if (c.children?.length > 0) {
                        allWithChildren[c.id] = true;
                        traverse(c.children);
                    }
                });
            };
            traverse(categories);
            setExpandedGroups(allWithChildren);
        } else {
            setExpandedGroups({});
        }
    };

    return (
        <div className="space-y-4">
            {/* Search Bar & Actions */}
            <div className="flex flex-col gap-3">
                <div className="relative group">
                    <input
                        type="text"
                        placeholder="بحث في الفئات..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-4 pr-10 py-2.5 bg-gray-50 border-transparent rounded-xl text-sm focus:bg-white focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all outline-none"
                    />
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-500 transition-colors">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => toggleAll(true)}
                        className="text-[10px] font-bold text-gray-500 hover:text-primary-600 hover:bg-primary-50 px-2 py-1 rounded-md transition-all"
                    >
                        توسيع الكل
                    </button>
                    <button
                        type="button"
                        onClick={() => toggleAll(false)}
                        className="text-[10px] font-bold text-gray-500 hover:text-primary-600 hover:bg-primary-50 px-2 py-1 rounded-md transition-all"
                    >
                        طي الكل
                    </button>
                </div>
            </div>

            {/* Tree View */}
            <div className="max-h-[350px] overflow-y-auto custom-scrollbar space-y-1">
                {categories.length > 0 ? (
                    categories.map(cat => renderCategory(cat))
                ) : (
                    <div className="py-8 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                        <p className="text-sm text-gray-400">لا يوجد فئات متاحة</p>
                    </div>
                )}
            </div>

            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #e5e7eb;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #d1d5db;
                }
            `}</style>
        </div>
    );
}
