import React, { useMemo, useEffect, useState } from 'react';
import { X, Plus, Trash2, Save, Search, StickyNote, Tag, Star } from 'lucide-react';
import { NoteEntry } from '../../../types';

interface NotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  notes: NoteEntry[];
  onUpdateNotes: (notes: NoteEntry[]) => void;
}

const createNoteId = () => `Note_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
const nowLabel = () => new Date().toLocaleString('zh-CN', { hour12: false });

export const NotesModal: React.FC<NotesModalProps> = ({ isOpen, onClose, notes, onUpdateNotes }) => {
  const [filter, setFilter] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState('');
  const [draftContent, setDraftContent] = useState('');
  const [draftTags, setDraftTags] = useState('');
  const [draftImportant, setDraftImportant] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    if (!selectedId && notes.length > 0) {
      setSelectedId(notes[0].id);
    }
  }, [isOpen, notes, selectedId]);

  const filteredNotes = useMemo(() => {
    const query = filter.trim().toLowerCase();
    if (!query) return notes;
    return notes.filter(n => {
      const titleMatch = (n.标题 || '').toLowerCase().includes(query);
      const contentMatch = (n.内容 || '').toLowerCase().includes(query);
      const tagMatch = (n.标签 || []).join(' ').toLowerCase().includes(query);
      return titleMatch || contentMatch || tagMatch;
    });
  }, [filter, notes]);

  const selectedNote = selectedId ? notes.find(n => n.id === selectedId) || null : null;

  useEffect(() => {
    if (!selectedNote) {
      setDraftTitle('');
      setDraftContent('');
      setDraftTags('');
      setDraftImportant(false);
      return;
    }
    setDraftTitle(selectedNote.标题 || '');
    setDraftContent(selectedNote.内容 || '');
    setDraftTags((selectedNote.标签 || []).join('、'));
    setDraftImportant(!!selectedNote.重要);
  }, [selectedNote?.id]);

  if (!isOpen) return null;

  const handleCreate = () => {
    const id = createNoteId();
    const nextNote: NoteEntry = {
      id,
      标题: '未命名笔记',
      内容: '',
      标签: [],
      时间戳: nowLabel(),
      重要: false
    };
    onUpdateNotes([...notes, nextNote]);
    setSelectedId(id);
    setFilter('');
  };

  const handleSave = () => {
    if (!selectedNote) return;
    const cleanedTags = draftTags
      .split(/[，,]/)
      .map(t => t.trim())
      .filter(Boolean);
    const updated: NoteEntry = {
      ...selectedNote,
      标题: draftTitle.trim() || '未命名笔记',
      内容: draftContent.trim(),
      标签: cleanedTags.length > 0 ? cleanedTags : undefined,
      重要: draftImportant,
      更新时间: nowLabel()
    };
    const nextNotes = notes.map(n => n.id === selectedNote.id ? updated : n);
    onUpdateNotes(nextNotes);
  };

  const handleDelete = () => {
    if (!selectedNote) return;
    if (!confirm('确定删除这条笔记吗？')) return;
    const nextNotes = notes.filter(n => n.id !== selectedNote.id);
    onUpdateNotes(nextNotes);
    setSelectedId(nextNotes[0]?.id || null);
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-5xl bg-zinc-950 border-t-8 border-cyan-500 relative shadow-[0_0_40px_rgba(34,211,238,0.25)] max-h-[85vh] flex flex-col">
        <div className="bg-cyan-500 text-black p-4 flex items-center justify-between">
          <div className="flex items-center gap-3 font-display">
            <StickyNote className="w-7 h-7" />
            <h2 className="text-2xl uppercase tracking-widest">情报笔记</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCreate}
              className="flex items-center gap-2 bg-black/10 border border-black px-3 py-1 text-xs uppercase tracking-widest hover:bg-black hover:text-cyan-400"
            >
              <Plus size={14} /> 新建
            </button>
            <button onClick={onClose} className="hover:bg-black hover:text-cyan-400 transition-colors p-1 border-2 border-black">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden bg-[url('https://www.transparenttextures.com/patterns/graphy.png')]">
          <div className="w-full md:w-1/3 border-r-4 border-zinc-900 bg-zinc-900/70 backdrop-blur-sm flex flex-col">
            <div className="p-3 border-b border-zinc-800 flex items-center gap-2 text-xs text-zinc-400">
              <Search size={14} />
              <input
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="搜索标题/标签"
                className="bg-transparent flex-1 outline-none text-zinc-200 placeholder:text-zinc-600"
              />
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
              {filteredNotes.length === 0 && (
                <div className="text-center text-zinc-500 text-xs py-6">暂无匹配记录</div>
              )}
              {filteredNotes.map(note => (
                <button
                  key={note.id}
                  onClick={() => setSelectedId(note.id)}
                  className={`w-full text-left p-3 border-l-4 transition-all hover:translate-x-1 ${
                    selectedId === note.id ? 'bg-cyan-900/40 border-cyan-400' : 'bg-zinc-900 border-zinc-700 hover:border-zinc-500'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-display uppercase text-sm text-white truncate">{note.标题 || '未命名'}</div>
                    {note.重要 && <Star size={14} className="text-amber-400" />}
                  </div>
                  {note.标签 && note.标签.length > 0 && (
                    <div className="mt-1 text-[10px] text-cyan-200 flex items-center gap-1">
                      <Tag size={10} /> {note.标签.join('、')}
                    </div>
                  )}
                  <div className="text-[10px] text-zinc-500 mt-1">{note.更新时间 || note.时间戳}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
            {selectedNote ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <input
                    value={draftTitle}
                    onChange={(e) => setDraftTitle(e.target.value)}
                    className="flex-1 bg-black border border-zinc-700 text-white px-3 py-2 text-lg font-display uppercase tracking-wider"
                    placeholder="笔记标题"
                  />
                  <button
                    onClick={() => setDraftImportant(!draftImportant)}
                    className={`flex items-center gap-2 px-3 py-2 border text-xs uppercase tracking-widest ${
                      draftImportant ? 'border-amber-400 text-amber-300 bg-amber-900/30' : 'border-zinc-700 text-zinc-400'
                    }`}
                  >
                    <Star size={14} /> 重要
                  </button>
                </div>

                <div className="bg-zinc-900 border border-zinc-700 p-3">
                  <div className="text-xs uppercase tracking-widest text-zinc-400 mb-2">标签（用逗号分隔）</div>
                  <input
                    value={draftTags}
                    onChange={(e) => setDraftTags(e.target.value)}
                    className="w-full bg-black border border-zinc-700 text-zinc-200 px-3 py-2"
                    placeholder="如：线索、人物、地点"
                  />
                </div>

                <div className="bg-zinc-900 border border-zinc-700 p-3">
                  <div className="text-xs uppercase tracking-widest text-zinc-400 mb-2">笔记内容</div>
                  <textarea
                    value={draftContent}
                    onChange={(e) => setDraftContent(e.target.value)}
                    className="w-full min-h-[260px] bg-black border border-zinc-700 text-zinc-200 px-3 py-2 resize-none"
                    placeholder="记录线索、计划、对话要点..."
                  />
                </div>

                <div className="flex items-center justify-between text-xs text-zinc-500">
                  <div>创建：{selectedNote.时间戳}</div>
                  {selectedNote.更新时间 && <div>更新：{selectedNote.更新时间}</div>}
                </div>

                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={handleDelete}
                    className="flex items-center gap-2 px-3 py-2 text-xs uppercase tracking-widest border border-red-500 text-red-400 hover:bg-red-600 hover:text-white"
                  >
                    <Trash2 size={14} /> 删除
                  </button>
                  <button
                    onClick={handleSave}
                    className="flex items-center gap-2 px-3 py-2 text-xs uppercase tracking-widest border border-cyan-400 text-cyan-200 hover:bg-cyan-500 hover:text-black"
                  >
                    <Save size={14} /> 保存
                  </button>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-zinc-600">
                <StickyNote size={64} className="mb-3" />
                <div className="text-sm uppercase tracking-widest">还没有笔记</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
