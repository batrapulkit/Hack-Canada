import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Zap, DollarSign, TrendingUp, Plus, RefreshCw, Trash2, Loader2, Save } from "lucide-react";
import api from "@/api/client";
import { addItineraryItem, updateItineraryItem, deleteItineraryItem } from "@/api/workflow";
import { toast } from "sonner";

export default function ItineraryPricingEditor({ itinerary }) {
    const [items, setItems] = useState(itinerary.itinerary_items || []);
    const [saving, setSaving] = useState(false);

    // Global Profit State
    const [globalMarkupType, setGlobalMarkupType] = useState('percentage');
    const [globalMarkupValue, setGlobalMarkupValue] = useState(10); // Default 10%

    const [newItem, setNewItem] = useState({
        title: '',
        cost_price: 0,
        markup_type: 'percentage',
        markup_value: 10
    });

    // Helper to calculate final price
    const calculateFinalPrice = (cost, type, value) => {
        const c = parseFloat(cost) || 0;
        const v = parseFloat(value) || 0;
        let markupAmount = 0;

        if (type === 'percentage') {
            markupAmount = c * (v / 100);
        } else {
            markupAmount = v;
        }

        return c + markupAmount;
    };

    // Handle Global Markup Changes
    // This updates ALL items immediately when the global toggle/input changes
    const applyGlobalMarkup = async (type, value) => {
        setGlobalMarkupType(type);
        setGlobalMarkupValue(value);
        setSaving(true);

        // 1. Calculate new state
        const updatedItems = items.map(item => {
            const finalPrice = calculateFinalPrice(item.cost_price, type, value);
            return {
                ...item,
                markup_type: type,
                markup_value: value,
                final_price: finalPrice
            };
        });

        // 2. Optimistic Update
        setItems(updatedItems);
        // Update new item defaults too
        setNewItem(prev => ({
            ...prev,
            markup_type: type,
            markup_value: value
        }));

        // 3. Sync to Backend
        try {
            await Promise.all(updatedItems.map(item =>
                updateItineraryItem(item.id, {
                    markup_type: type,
                    markup_value: value,
                    final_price: item.final_price
                })
            ));
            toast.success("Global markup applied successfully");
        } catch (error) {
            console.error("Failed to sync global markup", error);
            toast.error("Failed to save some changes");
        } finally {
            setSaving(false);
        }
    };

    const handleAddItem = async () => {
        if (!newItem.title) return;
        setSaving(true);
        try {
            // Calculate final price for the new item before adding
            const final = calculateFinalPrice(newItem.cost_price, newItem.markup_type, newItem.markup_value);

            const itemToAdd = {
                ...newItem,
                final_price: final,
                activity_type: 'other',
                currency: 'USD',
                day_number: 1
            };

            const res = await addItineraryItem(itinerary.id, itemToAdd);

            if (res.success || res.item) {
                const added = res.item || res.data; // adjust based on actual API return
                setItems([...items, added]);
                setNewItem({ title: '', cost_price: 0, markup_type: globalMarkupType, markup_value: globalMarkupValue });
                toast.success("Item added");
            }
        } catch (e) {
            console.error(e);
            toast.error('Failed to add item');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteItem = async (itemId) => {
        if (!window.confirm("Are you sure you want to delete this item?")) return;

        // Optimistic
        const originalItems = [...items];
        setItems(items.filter(i => i.id !== itemId));

        try {
            await deleteItineraryItem(itemId);
            toast.success("Item deleted");
        } catch (error) {
            console.error(error);
            toast.error("Failed to delete item");
            setItems(originalItems); // Revert
        }
    };

    // Auto-save individual item changes (Cost, Markup Value Check)
    const handleItemChange = (id, field, value) => {
        setItems(items.map(item => {
            if (item.id === id) {
                const updated = { ...item, [field]: value };
                // Recalculate price if cost/markup changed
                if (field === 'cost_price' || field === 'markup_value') {
                    updated.final_price = calculateFinalPrice(
                        field === 'cost_price' ? value : item.cost_price,
                        item.markup_type, // Assuming type doesn't change here easily inline, or we could add selector
                        field === 'markup_value' ? value : item.markup_value
                    );
                }
                return updated;
            }
            return item;
        }));
    };

    const saveItemChanges = async (item) => {
        setSaving(true);
        try {
            await updateItineraryItem(item.id, {
                title: item.title,
                cost_price: item.cost_price,
                markup_value: item.markup_value,
                final_price: item.final_price
            });
            // toast.success("Saved"); // Too noisy for auto-save
        } catch (error) {
            console.error(error);
            toast.error("Failed to save changes");
        } finally {
            setSaving(false);
        }
    };

    // Calculate Totals
    const totalCost = items.reduce((sum, item) => sum + (parseFloat(item.cost_price) || 0), 0);
    const totalPrice = items.reduce((sum, item) => sum + (parseFloat(item.final_price) || 0), 0);
    const profit = totalPrice - totalCost;
    const margin = totalPrice > 0 ? (profit / totalPrice) * 100 : 0;

    return (
        <div className="space-y-6">

            {/* Profit Toggle / Global Markup Engine */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-5 rounded-xl border border-indigo-100 shadow-sm relative overflow-hidden">
                {saving && (
                    <div className="absolute top-2 right-2 flex items-center gap-2 text-indigo-600 bg-white/50 px-2 py-1 rounded-full text-xs font-medium animate-pulse">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Saving...
                    </div>
                )}

                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-white rounded-lg shadow-sm">
                        <Zap className="w-5 h-5 text-indigo-600 fill-indigo-100" />
                    </div>
                    <div>
                        <h3 className="font-bold text-indigo-950">Profit Engine</h3>
                        <p className="text-xs text-indigo-600 font-medium">Global Markup Rules</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white p-3 rounded-lg border border-indigo-50 shadow-sm flex flex-col justify-center">
                        <label className="text-[10px] uppercase font-bold text-indigo-400 mb-1">Markup Strategy</label>
                        <Select
                            value={globalMarkupType}
                            onValueChange={(val) => applyGlobalMarkup(val, globalMarkupValue)}
                        >
                            <SelectTrigger className="border-0 bg-transparent p-0 h-auto font-semibold text-indigo-900 focus:ring-0">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="percentage">Percentage Commission (%)</SelectItem>
                                <SelectItem value="flat">Flat Service Fee ($)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="bg-white p-3 rounded-lg border border-indigo-50 shadow-sm flex items-center justify-between">
                        <div>
                            <label className="text-[10px] uppercase font-bold text-indigo-400 mb-1">
                                {globalMarkupType === 'percentage' ? 'Commission Rate' : 'Fee Amount'}
                            </label>
                            <div className="flex items-baseline gap-1">
                                <span className="text-lg font-bold text-indigo-900">
                                    {globalMarkupType === 'flat' && '$'}
                                </span>
                                <Input
                                    type="number"
                                    className="border-0 p-0 h-auto w-20 text-lg font-bold text-indigo-900 focus-visible:ring-0 bg-transparent placeholder:text-indigo-200"
                                    value={globalMarkupValue}
                                    onChange={(e) => applyGlobalMarkup(globalMarkupType, parseFloat(e.target.value) || 0)}
                                />
                                <span className="text-sm font-medium text-indigo-400">
                                    {globalMarkupType === 'percentage' && '%'}
                                </span>
                            </div>
                        </div>
                        <div className="h-8 w-8 rounded-full bg-indigo-50 flex items-center justify-center">
                            <RefreshCw className="w-4 h-4 text-indigo-500" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Financial Overview - The "Estimated Profit" Widget */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Total Net Cost</p>
                    <p className="text-2xl font-bold text-slate-700">${totalCost.toFixed(2)}</p>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Total Client Price</p>
                    <p className="text-2xl font-bold text-slate-900">${totalPrice.toFixed(2)}</p>
                </div>

                <div className="p-4 bg-green-50 rounded-xl border border-green-100 shadow-sm ring-1 ring-green-500/10">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-bold text-green-600 uppercase tracking-wider mb-1">Estimated Profit</p>
                            <div className="flex items-baseline gap-2">
                                <p className="text-3xl font-extrabold text-green-600">${profit.toFixed(2)}</p>
                                <span className="text-sm font-bold text-green-600/80 bg-green-100 px-2 py-0.5 rounded-full">
                                    {margin.toFixed(1)}%
                                </span>
                            </div>
                        </div>
                        <div className="p-2 bg-green-100 rounded-lg">
                            <TrendingUp className="w-5 h-5 text-green-700" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Add Item Form */}
            <div className="grid grid-cols-12 gap-3 items-end p-4 border rounded-xl bg-slate-50/50">
                <div className="col-span-12 md:col-span-4">
                    <label className="text-xs font-medium mb-1.5 block">Item Description</label>
                    <Input
                        value={newItem.title}
                        onChange={e => setNewItem({ ...newItem, title: e.target.value })}
                        placeholder="e.g. Flight to Paris"
                        className="bg-white"
                        onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
                    />
                </div>
                <div className="col-span-6 md:col-span-2">
                    <label className="text-xs font-medium mb-1.5 block">Net Cost ($)</label>
                    <Input
                        type="number"
                        value={newItem.cost_price}
                        onChange={e => setNewItem({ ...newItem, cost_price: parseFloat(e.target.value) || 0 })}
                        className="bg-white"
                        onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
                    />
                </div>
                {/* 
                   Hidden/Disabled manual markup by default if using Global, but allowed to override?
                   For now, let's keep them visible but they default to global.
                */}
                <div className="col-span-6 md:col-span-2">
                    <label className="text-xs font-medium mb-1.5 block">Markup Type</label>
                    <Select
                        value={newItem.markup_type}
                        onValueChange={val => setNewItem({ ...newItem, markup_type: val })}
                    >
                        <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="percentage">% Percentage</SelectItem>
                            <SelectItem value="flat">$ Flat</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="col-span-6 md:col-span-2">
                    <label className="text-xs font-medium mb-1.5 block">Markup Value</label>
                    <Input
                        type="number"
                        value={newItem.markup_value}
                        onChange={e => setNewItem({ ...newItem, markup_value: parseFloat(e.target.value) || 0 })}
                        className="bg-white"
                        onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
                    />
                </div>
                <div className="col-span-6 md:col-span-2">
                    <Button onClick={handleAddItem} disabled={saving} className="w-full bg-slate-900 text-white hover:bg-slate-800">
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4 mr-1" />}
                        Add
                    </Button>
                </div>
            </div>

            {/* Items List */}
            <div className="border rounded-xl overflow-hidden bg-white shadow-sm">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 font-medium border-b">
                        <tr>
                            <th className="p-4 w-1/3">Item</th>
                            <th className="p-4 w-32">Net Cost</th>
                            <th className="p-4 w-32">Markup Val</th>
                            <th className="p-4">Rule</th>
                            <th className="p-4 text-right">Client Price</th>
                            <th className="p-4 w-10"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {items.map((item, i) => (
                            <tr key={i} className="hover:bg-slate-50/50 transition-colors group">
                                <td className="p-4 font-medium text-slate-900">
                                    <Input
                                        value={item.title}
                                        onChange={(e) => handleItemChange(item.id, 'title', e.target.value)}
                                        onBlur={() => saveItemChanges(item)}
                                        className="border-transparent hover:border-slate-200 focus:border-indigo-500 px-2 h-8"
                                    />
                                </td>
                                <td className="p-4">
                                    <div className="relative">
                                        <span className="absolute left-2 top-1.5 text-slate-400">$</span>
                                        <Input
                                            type="number"
                                            value={item.cost_price}
                                            onChange={(e) => handleItemChange(item.id, 'cost_price', parseFloat(e.target.value) || 0)}
                                            onBlur={() => saveItemChanges(item)}
                                            className="border-transparent hover:border-slate-200 focus:border-indigo-500 pl-5 pr-2 h-8 w-24"
                                        />
                                    </div>
                                </td>
                                <td className="p-4">
                                    <Input
                                        type="number"
                                        value={item.markup_value}
                                        onChange={(e) => handleItemChange(item.id, 'markup_value', parseFloat(e.target.value) || 0)}
                                        onBlur={() => saveItemChanges(item)}
                                        className="border-transparent hover:border-slate-200 focus:border-indigo-500 px-2 h-8 w-20 text-center"
                                    />
                                </td>
                                <td className="p-4">
                                    <Badge variant="secondary" className="bg-slate-100 text-slate-600 font-normal whitespace-nowrap">
                                        {item.markup_type === 'percentage' ? '%' : '$ Fee'}
                                    </Badge>
                                </td>
                                <td className="p-4 text-right font-bold text-slate-900">
                                    ${parseFloat(item.final_price).toFixed(2)}
                                </td>
                                <td className="p-4 text-center">
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        onClick={() => handleDeleteItem(item.id)}
                                        className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </td>
                            </tr>
                        ))}
                        {items.length === 0 && (
                            <tr><td colSpan={6} className="p-8 text-center text-slate-400">No items added yet. Add items above or import from itinerary.</td></tr>
                        )}
                    </tbody>
                </table>
                {items.length > 0 && (
                    <div className="bg-slate-50 p-3 text-xs text-center text-slate-400 flex justify-center gap-2">
                        <span>All changes are saved automatically.</span>
                    </div>
                )}
            </div>
        </div>
    );
}
