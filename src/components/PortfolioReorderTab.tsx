/**
 * PortfolioReorderTab.tsx
 *
 * Drag-and-drop reordering panel for portfolio items.
 * Splits items into Photos and Videos tabs, then into per-category sections.
 * Saving writes sortOrder values back to Firestore in a single batch write.
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Save, Loader2, CheckCircle, ChevronDown, ChevronUp, Video, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { portfolioService } from '@/lib/firebaseService';
import type { PortfolioItem } from '@/types';

// ─── Sortable Card ─────────────────────────────────────────────────────────────
function SortableCard({ item }: { item: PortfolioItem }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });

    const style: React.CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 50 : undefined,
    };

    const thumb = item.thumbnail || item.image;

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="relative group rounded-lg overflow-hidden border border-border bg-card shadow-sm select-none"
        >
            {/* Drag handle */}
            <div
                {...attributes}
                {...listeners}
                className="absolute top-2 left-2 z-10 p-1 rounded bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
            >
                <GripVertical className="w-4 h-4 text-white" />
            </div>

            {/* Thumbnail */}
            <div className="aspect-[4/3] bg-muted overflow-hidden">
                {thumb ? (
                    <img
                        src={thumb}
                        alt={item.title || item.category}
                        className="w-full h-full object-cover"
                        loading="lazy"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                        No image
                    </div>
                )}
            </div>

            {/* Info */}
            <div className="p-2">
                <p className="text-xs font-medium truncate">{item.title || '(untitled)'}</p>
                {item.client && <p className="text-[10px] text-muted-foreground truncate">{item.client}</p>}
            </div>

            {/* Video badge */}
            {item.videoUrl && (
                <Badge className="absolute top-2 right-2 text-[9px] py-0 px-1" variant="secondary">
                    <Video className="w-2.5 h-2.5 mr-0.5" />Video
                </Badge>
            )}
        </div>
    );
}

// ─── Category Section ──────────────────────────────────────────────────────────
function CategorySection({
    label,
    items,
    onReorder,
}: {
    label: string;
    items: PortfolioItem[];
    onReorder: (newItems: PortfolioItem[]) => void;
}) {
    const [collapsed, setCollapsed] = useState(false);
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
    );

    const handleDragEnd = useCallback(
        (event: DragEndEvent) => {
            const { active, over } = event;
            if (over && active.id !== over.id) {
                const oldIndex = items.findIndex(i => i.id === active.id);
                const newIndex = items.findIndex(i => i.id === over.id);
                onReorder(arrayMove(items, oldIndex, newIndex));
            }
        },
        [items, onReorder],
    );

    return (
        <div className="mb-8">
            {/* Section header */}
            <button
                onClick={() => setCollapsed(c => !c)}
                className="flex items-center gap-2 w-full text-left mb-3 group"
            >
                <span className="text-sm font-semibold text-[#8f5e25] uppercase tracking-wide">
                    {label}
                </span>
                <Badge variant="outline" className="text-xs">{items.length}</Badge>
                <span className="ml-auto text-muted-foreground group-hover:text-foreground transition-colors">
                    {collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                </span>
            </button>

            {!collapsed && (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={items.map(i => i.id)} strategy={rectSortingStrategy}>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                            {items.map(item => (
                                <SortableCard key={item.id} item={item} />
                            ))}
                        </div>
                    </SortableContext>
                </DndContext>
            )}

            {items.length === 0 && !collapsed && (
                <p className="text-sm text-muted-foreground italic py-4">No items in this category.</p>
            )}
        </div>
    );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export function PortfolioReorderTab({
    items,
    categories,
}: {
    items: PortfolioItem[];
    categories: string[];
}) {
    // Local copy of items that we mutate on drag
    const [localItems, setLocalItems] = useState<PortfolioItem[]>([]);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [activeType, setActiveType] = useState<'photo' | 'video'>('photo');

    // Sync from props whenever items change (e.g. after a save)
    useEffect(() => {
        setLocalItems([...items].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)));
    }, [items]);

    // Format category label: 'real-estate' → 'Real Estate'
    const formatLabel = (slug: string) =>
        slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

    // Photo categories: categories that have at least one photo item
    const photoCategories = categories.filter(cat =>
        localItems.some(i => i.category === cat && !i.videoUrl),
    );

    // Video categories: categories that have at least one video item
    const videoCategories = categories.filter(cat =>
        localItems.some(i => i.category === cat && !!i.videoUrl),
    );

    const activeCategories = activeType === 'photo' ? photoCategories : videoCategories;

    const handleReorder = useCallback(
        (category: string, newItems: PortfolioItem[]) => {
            setSaved(false);
            setLocalItems(prev => {
                // Replace items of this category with the newly ordered list
                const others = prev.filter(i => i.category !== category);
                return [...others, ...newItems];
            });
        },
        [],
    );

    const handleSave = async () => {
        setSaving(true);
        setSaved(false);
        try {
            // Build sortOrder updates: within each category, assign 0-based sortOrder
            const updates: { id: string; sortOrder: number }[] = [];

            // Group by category and assign sortOrder based on current position
            const byCategory: Record<string, PortfolioItem[]> = {};
            for (const item of localItems) {
                if (!byCategory[item.category]) byCategory[item.category] = [];
                byCategory[item.category].push(item);
            }

            for (const [, catItems] of Object.entries(byCategory)) {
                catItems.forEach((item, idx) => {
                    updates.push({ id: item.id, sortOrder: idx });
                });
            }

            await portfolioService.batchUpdateSortOrder(updates);
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (err) {
            console.error(err);
            alert('Failed to save order. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold">Reorder Portfolio</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        Drag and drop items within each category section to rearrange them. Click <strong>Save Order</strong> when done.
                    </p>
                </div>
                <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="btn-gold text-white shrink-0"
                >
                    {saving ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving…</>
                    ) : saved ? (
                        <><CheckCircle className="w-4 h-4 mr-2 text-green-400" />Saved!</>
                    ) : (
                        <><Save className="w-4 h-4 mr-2" />Save Order</>
                    )}
                </Button>
            </div>

            {/* Photo / Video type switcher */}
            <div className="flex gap-2">
                <button
                    onClick={() => setActiveType('photo')}
                    className={`flex items-center gap-2 px-5 py-2 rounded-xl font-semibold text-sm transition-all ${
                        activeType === 'photo'
                            ? 'bg-gradient-to-r from-[#8f5e25] to-[#cbb26a] text-white shadow-md'
                            : 'bg-[#cbb26a]/10 text-[#8f5e25] hover:bg-[#cbb26a]/20'
                    }`}
                >
                    <ImageIcon className="w-4 h-4" />Photos
                </button>
                <button
                    onClick={() => setActiveType('video')}
                    className={`flex items-center gap-2 px-5 py-2 rounded-xl font-semibold text-sm transition-all ${
                        activeType === 'video'
                            ? 'bg-gradient-to-r from-[#8f5e25] to-[#cbb26a] text-white shadow-md'
                            : 'bg-[#cbb26a]/10 text-[#8f5e25] hover:bg-[#cbb26a]/20'
                    }`}
                >
                    <Video className="w-4 h-4" />Videos
                </button>
            </div>

            {/* Category sections */}
            {activeCategories.length === 0 ? (
                <p className="text-muted-foreground text-sm py-8 text-center">
                    No {activeType} items found.
                </p>
            ) : (
                activeCategories.map(cat => {
                    const catItems = localItems.filter(
                        i => i.category === cat && (activeType === 'video' ? !!i.videoUrl : !i.videoUrl),
                    );
                    return (
                        <CategorySection
                            key={cat}
                            label={formatLabel(cat)}
                            items={catItems}
                            onReorder={newItems => handleReorder(cat, newItems)}
                        />
                    );
                })
            )}
        </div>
    );
}
