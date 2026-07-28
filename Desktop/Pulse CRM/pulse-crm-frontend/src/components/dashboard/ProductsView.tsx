'use client';

import React, { useState } from 'react';
import { Plus, Search, Trash2, X, Package, Tag, Filter } from 'lucide-react';

interface Product {
  id: number;
  name: string;
  sku: string;
  category: string;
  categoryBg: string;
  price: number;
  status: 'Active' | 'Archived';
  dealsCount: number;
  description: string;
}

export default function ProductsView() {
  const [products, setProducts] = useState<Product[]>([
    { id: 1, name: "Enterprise Database Cloud License", sku: "DB-CLD-ENT", category: "Software Licensing", categoryBg: "bg-blue-50 text-blue-700 border-blue-200/60", price: 15000, status: "Active", dealsCount: 14, description: "Full relational database cloud hosting license with auto-scale capacity." },
    { id: 2, name: "HIPAA Security Compliance SLA Add-on", sku: "SEC-HIPAA-SLA", category: "Compliance & Security", categoryBg: "bg-purple-50 text-purple-700 border-purple-200/60", price: 4500, status: "Active", dealsCount: 8, description: "End-to-end encryption audit pipeline log sync for health enterprise." },
    { id: 3, name: "Real-time AI Co-pilot Seat (Annual)", sku: "AI-COP-SEAT", category: "SaaS Subscription", categoryBg: "bg-cyan-50 text-cyan-700 border-cyan-200/60", price: 1200, status: "Active", dealsCount: 22, description: "Access key to real-time sync suggestions and leads scorer pipeline." },
    { id: 4, name: "Professional Services Migration (Day Rate)", sku: "MIG-PROF-SRV", category: "Professional Services", categoryBg: "bg-amber-50 text-amber-700 border-amber-200/60", price: 2500, status: "Active", dealsCount: 5, description: "Dedicated database architecture integration specialist consultancy." },
    { id: 5, name: "SSO Identity Integration Gateway", sku: "GW-SSO-OAUTH", category: "Infrastructure", categoryBg: "bg-slate-100 text-slate-700 border-slate-200/60", price: 6000, status: "Archived", dealsCount: 0, description: "Legacy SAML integration engine gateway module." }
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [form, setForm] = useState({ name: '', sku: '', category: 'Software Licensing', price: 0, status: 'Active' as Product['status'], description: '' });

  const categories = ['Software Licensing', 'Compliance & Security', 'SaaS Subscription', 'Professional Services', 'Infrastructure'];

  const getCategoryBg = (cat: string) => {
    switch (cat) {
      case 'Software Licensing': return 'bg-blue-50 text-blue-700 border-blue-200/60';
      case 'Compliance & Security': return 'bg-purple-50 text-purple-700 border-purple-200/60';
      case 'SaaS Subscription': return 'bg-cyan-50 text-cyan-700 border-cyan-200/60';
      case 'Professional Services': return 'bg-amber-50 text-amber-700 border-amber-200/60';
      default: return 'bg-slate-100 text-slate-700 border-slate-200/60';
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || p.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const newProduct: Product = {
      id: Date.now(),
      name: form.name,
      sku: form.sku,
      category: form.category,
      categoryBg: getCategoryBg(form.category),
      price: Number(form.price),
      status: form.status,
      dealsCount: 0,
      description: form.description
    };
    setProducts([newProduct, ...products]);
    setIsAddModalOpen(false);
    setForm({ name: '', sku: '', category: 'Software Licensing', price: 0, status: 'Active', description: '' });
  };

  const handleDelete = (id: number) => {
    setProducts(products.filter(p => p.id !== id));
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Container */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-sans text-brand-heading tracking-tight font-extrabold">
              Products Catalog
            </h1>
            <p className="text-xs md:text-sm text-slate-500 mt-1 font-medium tracking-wide">
              Configure CRM software keys, professional service templates, and pipeline license pricing.
            </p>
          </div>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center space-x-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md self-start sm:self-center"
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} />
            <span>Add Product</span>
          </button>
        </div>

        {/* Search & Category Filter Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative sm:col-span-2">
            <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400">
              <Search className="h-4 w-4" />
            </span>
            <input 
              type="text" 
              placeholder="Search product name, SKU..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs text-slate-900 bg-slate-50/50 focus:bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>

          <div>
            <select 
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 bg-white text-slate-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer transition-all font-medium"
            >
              <option value="All">All Categories</option>
              {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto select-none">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] uppercase font-black text-slate-400 tracking-wider">
                <th className="py-3 px-4">PRODUCT INFO</th>
                <th className="py-3 px-4">SKU CODE</th>
                <th className="py-3 px-4">CATEGORY</th>
                <th className="py-3 px-4">UNIT PRICE</th>
                <th className="py-3 px-4 text-center">ACTIVE DEALS</th>
                <th className="py-3 px-4">STATUS</th>
                <th className="py-3 px-4 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
              {filteredProducts.length > 0 ? (
                filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-slate-50/80 transition-colors group">
                    
                    {/* Product Name & Description */}
                    <td className="py-4 px-4 max-w-xs">
                      <div className="flex items-center space-x-2.5">
                        <div className="h-8 w-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                          <Package className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <span className="font-bold text-slate-900 text-xs block truncate">{product.name}</span>
                          <span className="text-[11px] text-slate-500 font-medium block truncate mt-0.5" title={product.description}>
                            {product.description}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* SKU Code */}
                    <td className="py-4 px-4">
                      <div className="inline-flex items-center space-x-1.5 font-mono text-[11px] font-bold text-slate-700 bg-slate-100/90 border border-slate-200 px-2.5 py-1 rounded-lg shadow-2xs tracking-wide">
                        <Tag className="h-3 w-3 text-slate-400 shrink-0" />
                        <span>{product.sku}</span>
                      </div>
                    </td>

                    {/* Category Pill */}
                    <td className="py-4 px-4">
                      <span className={`inline-block px-2.5 py-1 rounded-md text-[10px] font-extrabold border ${product.categoryBg}`}>
                        {product.category}
                      </span>
                    </td>

                    {/* Unit Price (Rupee) */}
                    <td className="py-4 px-4">
                      <span className="font-bold text-slate-900 text-xs tabular-nums block">
                        ₹{product.price.toLocaleString()}
                      </span>
                    </td>

                    {/* Active Deals */}
                    <td className="py-4 px-4 text-center">
                      <span className="font-extrabold text-slate-900 text-xs tabular-nums inline-block px-2.5 py-1 rounded-full bg-slate-100">
                        {product.dealsCount}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-4 px-4">
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-extrabold border inline-block ${
                        product.status === 'Active' 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60' 
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}>
                        {product.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-4 text-right">
                      <button 
                        onClick={() => handleDelete(product.id)}
                        className="h-8 w-8 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors inline-flex items-center justify-center cursor-pointer border-0"
                        title="Delete Product"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>

                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400 font-medium">
                    No products found matching your search or filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Product Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-extrabold text-slate-900 text-sm">Add New Catalog Product</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer border-0 bg-transparent">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleAddProduct} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Product Name</label>
                <input type="text" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">SKU Code</label>
                  <input type="text" required value={form.sku} onChange={e => setForm({...form, sku: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Unit Price (₹)</label>
                  <input type="number" required value={form.price} onChange={e => setForm({...form, price: Number(e.target.value)})} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 tabular-nums" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Category</label>
                  <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="w-full px-3 py-2 border border-slate-200 bg-white text-slate-900 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer">
                    {categories.map(cat => <option key={cat}>{cat}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Status</label>
                  <select value={form.status} onChange={e => setForm({...form, status: e.target.value as any})} className="w-full px-3 py-2 border border-slate-200 bg-white text-slate-900 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer">
                    <option>Active</option>
                    <option>Archived</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Description</label>
                <textarea rows={3} value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none" />
              </div>
              <div className="pt-4 border-t border-slate-100 flex justify-end space-x-3">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer">Add Product</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
