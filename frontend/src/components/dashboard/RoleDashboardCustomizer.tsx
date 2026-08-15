'use client';

import React, { useEffect, useState } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { GripVertical, Maximize2, Minimize2, RotateCcw, Settings2, X } from 'lucide-react';

export type SectionSize = 'full' | 'half';

interface DashboardCustomizerState {
  isEditMode: boolean;
  setIsEditMode: React.Dispatch<React.SetStateAction<boolean>>;
  layout: string[];
  hidden: string[];
  sizes: Record<string, SectionSize>;
  sensors: ReturnType<typeof useSensors>;
  handleDragEnd: (event: DragEndEvent) => void;
  handleHide: (id: string) => void;
  handleShow: (id: string) => void;
  handleToggleSize: (id: string) => void;
  handleReset: () => void;
}

/**
 * Shared "Customize Layout" engine used by the manager and admin dashboards.
 * Mirrors the sales-rep home editor: drag to reorder, hide sections, restore
 * hidden sections, and reset to the factory layout. Persists to localStorage.
 */
export function useDashboardCustomizer(
  storageKey: string,
  defaultLayout: string[],
  defaultSizes: Record<string, SectionSize>,
): DashboardCustomizerState {
  const [isEditMode, setIsEditMode] = useState(false);
  const [layout, setLayout] = useState<string[]>(defaultLayout);
  const [hidden, setHidden] = useState<string[]>([]);
  const [sizes, setSizes] = useState<Record<string, SectionSize>>(defaultSizes);

  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.layout)) setLayout(parsed.layout);
        if (Array.isArray(parsed.hidden)) setHidden(parsed.hidden);
        if (parsed.sizes && typeof parsed.sizes === 'object') setSizes(parsed.sizes);
      } catch (e) {
        console.error('Failed to parse dashboard layout preferences', e);
      }
    }
  }, [storageKey]);

  const saveLayoutSettings = (
    newLayout: string[],
    newHidden: string[],
    newSizes: Record<string, SectionSize>,
  ) => {
    try {
      localStorage.setItem(storageKey, JSON.stringify({ layout: newLayout, hidden: newHidden, sizes: newSizes }));
    } catch (e) {
      console.error('Failed to save dashboard layout preferences', e);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setLayout((items) => {
        const oldIndex = items.indexOf(active.id as string);
        const newIndex = items.indexOf(over.id as string);
        const newItems = arrayMove(items, oldIndex, newIndex);
        saveLayoutSettings(newItems, hidden, sizes);
        return newItems;
      });
    }
  };

  const handleHide = (id: string) => {
    const newHidden = [...hidden, id];
    setHidden(newHidden);
    saveLayoutSettings(layout, newHidden, sizes);
  };

  const handleShow = (id: string) => {
    const newHidden = hidden.filter((item) => item !== id);
    setHidden(newHidden);
    saveLayoutSettings(layout, newHidden, sizes);
  };

  const handleToggleSize = (id: string) => {
    const newSizes: Record<string, SectionSize> = {
      ...sizes,
      [id]: sizes[id] === 'full' ? 'half' : 'full',
    };
    setSizes(newSizes);
    saveLayoutSettings(layout, hidden, newSizes);
  };

  const handleReset = () => {
    setLayout(defaultLayout);
    setHidden([]);
    setSizes(defaultSizes);
    saveLayoutSettings(defaultLayout, [], defaultSizes);
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  );

  return {
    isEditMode,
    setIsEditMode,
    layout,
    hidden,
    sizes,
    sensors,
    handleDragEnd,
    handleHide,
    handleShow,
    handleToggleSize,
    handleReset,
  };
}

/* -------------------------------------------------------------------------- */
/* Sortable section wrapper                                                    */
/* -------------------------------------------------------------------------- */

interface SortableSectionWrapperProps {
  id: string;
  isEditMode: boolean;
  /** Grid/flex `order` so the DOM placement follows the saved layout order (this is a grid container child). */
  order?: number;
  resizable?: boolean;
  size?: SectionSize;
  onToggleSize?: () => void;
  onHide: () => void;
  children: React.ReactNode;
}

export function SortableSectionWrapper({
  id,
  isEditMode,
  order,
  resizable = false,
  size = 'full',
  onToggleSize,
  onHide,
  children,
}: SortableSectionWrapperProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style: React.CSSProperties = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    transition,
    zIndex: isDragging ? 50 : undefined,
    position: 'relative',
    order,
  };

  const colSpanClass = !resizable || size === 'full'
    ? 'col-span-12'
    : 'col-span-12 lg:col-span-6';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${colSpanClass} transition-shadow duration-200 ${
        isDragging ? 'shadow-lg ring-2 ring-accent-color/20' : ''
      }`}
    >
      {isEditMode && (
        <div className="absolute top-2 right-2 z-30 flex items-center gap-1.5 bg-surface-0/90 dark:bg-slate-900/90 backdrop-blur-xs px-2 py-1 rounded-lg border border-border shadow-md animate-in fade-in duration-150 select-none">
          {/* Drag Handle */}
          <div
            {...attributes}
            {...listeners}
            className="p-1 hover:bg-surface-2 dark:hover:bg-slate-800 rounded text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing"
            title="Drag to reorder"
          >
            <GripVertical size={13} />
          </div>

          {/* Size Toggle */}
          {resizable && (
            <button
              onClick={onToggleSize}
              className="p-1 hover:bg-surface-2 dark:hover:bg-slate-800 rounded text-muted-foreground hover:text-foreground cursor-pointer"
              title={size === 'full' ? 'Make half width' : 'Make full width'}
            >
              {size === 'full' ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
            </button>
          )}

          {/* Hide Button */}
          <button
            onClick={onHide}
            className="p-1 hover:bg-destructive/10 rounded text-muted-foreground hover:text-destructive cursor-pointer"
            title="Hide section"
          >
            <X size={13} />
          </button>
        </div>
      )}

      <div className={`h-full ${isEditMode ? 'border border-dashed border-accent-color/45 rounded-2xl' : ''}`}>
        {children}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Toggle button (header)                                                      */
/* -------------------------------------------------------------------------- */

export function CustomizeToggleButton({
  isEditMode,
  onToggle,
}: {
  isEditMode: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all border cursor-pointer select-none ${
        isEditMode
          ? 'bg-brand text-primary-foreground border-transparent shadow-sm'
          : 'bg-surface-2/35 hover:bg-surface-2 border-border text-muted-foreground hover:text-foreground'
      }`}
    >
      <Settings2 size={13} className={isEditMode ? 'animate-spin' : ''} />
      <span>{isEditMode ? 'Save Layout' : 'Customize Layout'}</span>
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/* Editor toolbar (edit mode)                                                  */
/* -------------------------------------------------------------------------- */

export function CustomizeToolbar({
  hidden,
  labels,
  onShow,
  onReset,
}: {
  hidden: string[];
  labels: Record<string, string>;
  onShow: (id: string) => void;
  onReset: () => void;
}) {
  return (
    <div className="bg-surface-2/40 border border-accent-color/20 rounded-2xl p-[var(--space-4)] flex flex-col md:flex-row md:items-center md:justify-between gap-[var(--space-4)] animate-in fade-in duration-300">
      <div>
        <h4 className="text-xs font-extrabold text-foreground uppercase tracking-wider">Dashboard Customizer Active</h4>
        <p className="text-[11px] text-muted-foreground mt-1">
          Drag sections using the handle to reorder or hide them. Select hidden sections below to add them back.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-[var(--space-2)]">
        {hidden.length > 0 && (
          <div className="flex items-center gap-1.5 mr-2">
            <span className="text-[10px] text-muted-foreground font-bold uppercase">Add back:</span>
            {hidden.map((id) => (
              <button
                key={id}
                onClick={() => onShow(id)}
                className="px-2.5 py-1 bg-accent-color/10 text-accent-color hover:bg-accent-color hover:text-primary-foreground border border-accent-color/20 hover:border-transparent rounded-lg text-[10px] font-bold transition-all cursor-pointer"
              >
                + {labels[id] || id}
              </button>
            ))}
          </div>
        )}
        <button
          onClick={onReset}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-border bg-surface-1 hover:bg-surface-2 text-foreground rounded-lg text-xs font-bold transition-all cursor-pointer shadow-sm"
        >
          <RotateCcw size={12} />
          <span>Reset Layout</span>
        </button>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Drag & drop context (grid)                                                  */
/* -------------------------------------------------------------------------- */

export function CustomizeLayoutDnd({
  sensors,
  onDragEnd,
  layout,
  gridClassName = 'grid grid-cols-12 gap-[var(--space-4)]',
  children,
}: {
  sensors: ReturnType<typeof useSensors>;
  onDragEnd: (event: DragEndEvent) => void;
  layout: string[];
  gridClassName?: string;
  children: React.ReactNode;
}) {
  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={layout} strategy={verticalListSortingStrategy}>
        <div className={gridClassName}>{children}</div>
      </SortableContext>
    </DndContext>
  );
}