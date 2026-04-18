/**
 * PortfolioReorderTab.tsx
 *
 * Drag-and-drop reordering panel for portfolio items.
 * Splits items into Photos and Videos tabs, then into per-category sections.
 * Saving writes sortOrder values back to Firestore in a single batch write.
 * Each card also has a delete button that removes the item from Firestore.
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
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
import {
    GripVertical, Save, Loader2, CheckCircle, ChevronDown, ChevronUp,
    Video, Image as ImageIcon, Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { portfolioService } from '@/lib/firebaseService';
import type { PortfolioItem } from '@/types';

// ─── Confirm Dialog ────────────────────────────────────────────────────────────
function ConfirmDialog({
    open,
    title,
    message,
    onConfirm,
    onCancel,
}: {
    open: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
}) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-card border border-border rounded-xl shadow-2xl p-6 max-w-sm w-full mx-4">
                <h3 className="text-base font-bold mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground mb-6">{message}</p>
                <div className="flex gap-3 justify-end">
                    <Button variant="outline" size="sm" onClick={onCancel}>
                        Cancel
                    </Button>
                    <Button
                        size="sm"
                        className="bg-red-600 hover:bg-red-700 text-white"
                        onClick={onConfirm}
                    >
                        Delete
                    </Button>
                </div>
            </div>
        </div>
    );
}

// ─── Video Thumbnail (Auto-Playing) ────────────────────────────────────────────
// Videos autoplay muted + looped so the admin can see dynamic previews.
// Bandwidth is controlled by compressing source files (see scripts/compress-videos.mjs),
// not by disabling playback.
function VideoThumb({ videoUrl, className }: { videoUrl: string; className?: string }) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [ready, setReady] = useState(false);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;
        const onData = () => setReady(true);
        video.addEventListener('loadeddata', onData);
        return () => video.removeEventListener('loadeddata', onData);
    }, [videoUrl]);

    return (
        <div
            className={`relative w-full h-full overflow-hidden ${className ?? ''}`}
            style={{ background: 'linear-gradient(135deg, #1a1208 0%, #2c1e0d 100%)' }}
        >
            <video
                ref={videoRef}
                src={videoUrl}
                preload="auto"
                autoPlay
                loop
                muted
                playsInline
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${ready ? 'opacity-100' : 'opacity-0'}`}
            />
            {!ready && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-8 h-8 rounded-full bg-[#cbb26a]/20 border border-[#cbb26a]/40 flex items-center justify-center">
                        <Video className="w-3.5 h-3.5 text-[#cbb26a]" />
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Sortable Card ─────────────────────────────────────────────────────────────
function SortableCard({
    item,
    onDelete,
}: {
    item: PortfolioItem;
    onDelete: (item: PortfolioItem) => void;
}) {
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

            {/* Delete button */}
            <button
                type="button"
                onClick={(e) => {
                    e.stopPropagation();
                    onDelete(item);
                }}
                className="absolute top-2 right-2 z-10 p-1 rounded bg-red-600/80 hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                title="Delete item"
            >
                <Trash2 className="w-3.5 h-3.5 text-white" />
            </button>

            {/* Thumbnail */}
            <div className="aspect-[4/3] overflow-hidden">
                {thumb ? (
                    <img
                        src={thumb}
                        alt={item.title || item.category}
                        className="w-full h-full object-cover"
                        loading="eager"
                    />
                ) : item.videoUrl ? (
                    <VideoThumb videoUrl={item.videoUrl} className="w-full h-full" />
                ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground text-xs">
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
                <Badge className="absolute bottom-8 right-2 text-[9px] py-0 px-1" variant="secondary">
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
    onDelete,
}: {
    label: string;
    items: PortfolioItem[];
    onReorder: (newItems: PortfolioItem[]) => void;
    onDelete: (item: PortfolioItem) => void;
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
                                <SortableCard key={item.id} item={item} onDelete={onDelete} />
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
    const [localItems, setLocalItems] = useState<PortfolioItem[]>([]);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [activeType, setActiveType] = useState<'photo' | 'video'>('photo');

    // Confirm-delete dialog state
    const [pendingDelete, setPendingDelete] = useState<PortfolioItem | null>(null);
    const [deleting, setDeleting] = useState(false);

    // Sync from props whenever items change
    useEffect(() => {
        setLocalItems([...items].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)));
    }, [items]);

    const formatLabel = (slug: string) =>
        slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

    const photoCategories = categories.filter(cat =>
        localItems.some(i => i.category === cat && !i.videoUrl),
    );
    const videoCategories = categories.filter(cat =>
        localItems.some(i => i.category === cat && !!i.videoUrl),
    );
    const activeCategories = activeType === 'photo' ? photoCategories : videoCategories;

    const handleReorder = useCallback(
        (category: string, newItems: PortfolioItem[]) => {
            setSaved(false);
            setLocalItems(prev => {
                const others = prev.filter(i => i.category !== category);
                return [...others, ...newItems];
            });
        },
        [],
    );

    // Called when user clicks the trash icon on a card
    const handleDeleteRequest = useCallback((item: PortfolioItem) => {
        setPendingDelete(item);
    }, []);

    // Confirmed — delete from Firestore and remove from local state
    const handleDeleteConfirm = async () => {
        if (!pendingDelete) return;
        setDeleting(true);
        try {
            await portfolioService.delete(pendingDelete.id);
            setLocalItems(prev => prev.filter(i => i.id !== pendingDelete.id));
            setPendingDelete(null);
        } catch (err) {
            console.error(err);
            alert('Failed to delete item. Please try again.');
        } finally {
            setDeleting(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setSaved(false);
        try {
            const updates: { id: string; sortOrder: number }[] = [];
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
        <>
            {/* Confirm Delete Dialog */}
            <ConfirmDialog
                open={!!pendingDelete}
                title="Delete Portfolio Item"
                message={
                    pendingDelete
                        ? `Are you sure you want to permanently delete "${pendingDelete.title || '(untitled)'}"? This cannot be undone.`
                        : ''
                }
                onConfirm={handleDeleteConfirm}
                onCancel={() => !deleting && setPendingDelete(null)}
            />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h2 className="text-xl font-bold">Reorder Portfolio</h2>
                        <p className="text-sm text-muted-foreground mt-1">
                            Drag and drop items to rearrange. Hover a card to reveal the{' '}
                            <strong>drag handle</strong> and <strong>delete button</strong>.
                            Click <strong>Save Order</strong> when done.
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
                                onDelete={handleDeleteRequest}
                            />
                        );
                    })
                )}
            </div>
        </>
    );
}
