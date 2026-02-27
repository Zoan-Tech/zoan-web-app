"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { bookmarkService } from "@/services/bookmark";
import { Modal } from "@/components/ui/modal";
import { toast } from "sonner";
import {
  BookmarkSimpleIcon,
  FolderIcon,
  PlusIcon,
  LockSimpleIcon,
  SpinnerGapIcon,
} from "@phosphor-icons/react";

interface BookmarkModalProps {
  /** Called with the chosen collectionId (or undefined for quick save) */
  onSave: (collectionId?: string) => Promise<void>;
  onClose: () => void;
  onSuccess: () => void;
}

export function BookmarkModal({ onSave, onClose, onSuccess }: BookmarkModalProps) {
  const [saving, setSaving] = useState<string | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPrivate, setNewPrivate] = useState(false);
  const [creating, setCreating] = useState(false);
  const queryClient = useQueryClient();

  const { data: collections, isLoading } = useQuery({
    queryKey: ["bookmark-collections"],
    queryFn: bookmarkService.getCollections,
  });

  const save = async (collectionId?: string) => {
    const key = collectionId ?? "none";
    if (saving) return;
    setSaving(key);
    try {
      await onSave(collectionId);
      toast.success("Saved!");
      onSuccess();
      onClose();
    } catch {
      toast.error("Failed to save");
      setSaving(null);
    }
  };

  const handleCreate = async () => {
    if (!newName.trim() || creating) return;
    setCreating(true);
    try {
      const created = await bookmarkService.createCollection({
        name: newName.trim(),
        is_private: newPrivate,
      });
      queryClient.invalidateQueries({ queryKey: ["bookmark-collections"] });
      await save(created.id);
    } catch {
      toast.error("Failed to create collection");
      setCreating(false);
    }
  };

  return (
    <Modal open onClose={onClose} title="Save to collection" maxWidth="sm:max-w-sm">
      <div className="-mx-6 -mt-6">
        {isLoading ? (
          <div className="flex justify-center py-10">
            <SpinnerGapIcon className="h-5 w-5 animate-spin text-gray-400" />
          </div>
        ) : (
          <>
            {/* Quick save (no collection) */}
            <button
              onClick={() => save()}
              disabled={!!saving}
              className="flex w-full items-center gap-3 border-b border-gray-100 px-6 py-3 text-left transition-colors hover:bg-gray-50 disabled:opacity-60"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100">
                <BookmarkSimpleIcon className="h-4 w-4 text-gray-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">Quick save</p>
                <p className="text-xs text-gray-400">Save without a collection</p>
              </div>
              {saving === "none" && (
                <SpinnerGapIcon className="h-4 w-4 animate-spin text-gray-400" />
              )}
            </button>

            {/* Collections list */}
            {collections && collections.length > 0 && (
              <div className="max-h-56 overflow-y-auto">
                {collections.map((col) => (
                  <button
                    key={col.id}
                    onClick={() => save(col.id)}
                    disabled={!!saving}
                    className="flex w-full items-center gap-3 border-b border-gray-100 px-6 py-3 text-left transition-colors hover:bg-gray-50 last:border-0 disabled:opacity-60"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#E8FAFA]">
                      <FolderIcon className="h-4 w-4 text-[#27CEC5]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="truncate text-sm font-medium text-gray-900">{col.name}</p>
                        {col.is_private && (
                          <LockSimpleIcon className="h-3 w-3 shrink-0 text-gray-400" />
                        )}
                      </div>
                      <p className="text-xs text-gray-400">{col.bookmark_count} saved</p>
                    </div>
                    {saving === col.id && (
                      <SpinnerGapIcon className="h-4 w-4 animate-spin text-gray-400" />
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* New collection */}
            <div className="px-6 py-4">
              {showNewForm ? (
                <div className="space-y-3">
                  <input
                    autoFocus
                    type="text"
                    placeholder="Collection name"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleCreate();
                      if (e.key === "Escape") {
                        setShowNewForm(false);
                        setNewName("");
                      }
                    }}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#27CEC5] focus:outline-none"
                  />
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      checked={newPrivate}
                      onChange={(e) => setNewPrivate(e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-600">Private collection</span>
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setShowNewForm(false);
                        setNewName("");
                        setNewPrivate(false);
                      }}
                      className="flex-1 rounded-lg border border-gray-200 py-2 text-sm text-gray-600 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCreate}
                      disabled={!newName.trim() || creating}
                      className="flex-1 rounded-lg bg-[#27CEC5] py-2 text-sm font-medium text-white transition-colors hover:bg-[#20b5ad] disabled:opacity-50"
                    >
                      {creating ? (
                        <SpinnerGapIcon className="mx-auto h-4 w-4 animate-spin" />
                      ) : (
                        "Create & save"
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowNewForm(true)}
                  className="flex items-center gap-2 text-sm font-medium text-[#27CEC5] hover:text-[#20b5ad]"
                >
                  <PlusIcon className="h-4 w-4" />
                  New collection
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
