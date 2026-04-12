import { useState, useEffect, useCallback } from 'react'; 
import ReactQuill from 'react-quill-new'; 
import 'react-quill-new/dist/quill.snow.css';
import { Trash2, Save, StickyNote, Loader2, X, Edit3, AlertTriangle } from 'lucide-react';

interface Note {
  id: string;
  content: string;
  createdAt: string;
}

export function BookNotes({ bookId }: { bookId: number }) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null);

  const modules = {
    toolbar: [
      ['bold', 'italic', 'underline'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['clean'],
    ],
  };

  const fetchNotes = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`http://localhost:3000/notes/book/${bookId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const data = await res.json();
      setNotes(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [bookId]); 

  useEffect(() => { 
    fetchNotes(); 
  }, [fetchNotes]);

  const handleSave = async () => {
    if (!newNoteContent.trim() || newNoteContent === '<p><br></p>') return;

    await fetch(`http://localhost:3000/notes/${bookId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify({ content: newNoteContent }),
    });

    setNewNoteContent('');
    setIsAdding(false);
    fetchNotes();
  };

  const handleUpdate = async (id: string) => {
    if (!editContent.trim() || editContent === '<p><br></p>') return;

    await fetch(`http://localhost:3000/notes/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify({ content: editContent }),
    });

    setEditingNoteId(null);
    fetchNotes();
  };

  const handleDelete = async () => {
    if (!noteToDelete) return;
    await fetch(`http://localhost:3000/notes/${noteToDelete}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    });
    setIsDeleteModalOpen(false);
    setNoteToDelete(null);
    fetchNotes();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <StickyNote className="text-teal-600" size={20} /> Notas
        </h3>
        <button
          onClick={() => {
            setIsAdding(!isAdding);
            setEditingNoteId(null);
          }}
          className="text-xs font-bold uppercase tracking-widest text-teal-600 hover:text-teal-800 transition-colors"
        >
          {isAdding ? 'Cancelar' : ' + Nueva Nota '}
        </button>
      </div>

      {isAdding && (
        <div className="bg-white rounded-2xl border border-teal-100 overflow-hidden shadow-md animate-in zoom-in-95 duration-200">
          <ReactQuill 
            theme="snow" 
            value={newNoteContent} 
            onChange={setNewNoteContent}
            modules={modules}
            className="h-40 mb-12"
            placeholder="Escribe una cita o reflexión..."
          />
          <div className="p-3 bg-teal-50/50 border-t border-teal-100 flex justify-end">
            <button
              onClick={handleSave}
              className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-teal-600 transition-all"
            >
              <Save size={14} /> Guardar Nota
            </button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="animate-spin text-slate-300" /></div>
        ) : notes.map((note) => (
          <div key={note.id} className="relative group">
            {editingNoteId === note.id ? (
              <div className="bg-white rounded-2xl border-2 border-teal-500 overflow-hidden shadow-xl animate-in fade-in duration-200">
                <ReactQuill 
                  theme="snow" 
                  value={editContent} 
                  onChange={setEditContent}
                  modules={modules}
                  className="h-32 mb-12"
                />
                <div className="p-2 bg-slate-50 border-t flex justify-end gap-2">
                  <button onClick={() => setEditingNoteId(null)} className="p-2 text-slate-400 hover:text-slate-600"><X size={18} /></button>
                  <button onClick={() => handleUpdate(note.id)} className="flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-teal-700 transition-all">
                    <Save size={14} /> Actualizar
                  </button>
                </div>
              </div>
            ) : (
              <div 
                onClick={() => {
                  setEditingNoteId(note.id);
                  setEditContent(note.content);
                  setIsAdding(false);
                }}
                className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:border-teal-200 hover:shadow-md transition-all cursor-pointer group/card flex flex-col h-full"
              >
                <div 
                  className="prose prose-sm text-slate-600 max-w-none mb-4 flex-1"
                  dangerouslySetInnerHTML={{ __html: note.content }} 
                />
                
                <div className="flex justify-between items-center text-[9px] text-slate-400 font-bold uppercase tracking-tighter pt-3 border-t border-slate-50">
                  <span>{new Date(note.createdAt).toLocaleDateString()}</span>
                  
                  <div className="flex items-center gap-3">
                    <Edit3 size={14} className="text-teal-500 opacity-0 group-hover/card:opacity-100 transition-opacity" />
                    
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setNoteToDelete(note.id);
                        setIsDeleteModalOpen(true);
                      }}
                      className="text-slate-300 hover:text-rose-500 transition-all p-1"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <ConfirmDeleteModal 
        isOpen={isDeleteModalOpen}
        onClose={() => { setIsDeleteModalOpen(false); setNoteToDelete(null); }}
        onConfirm={handleDelete}
      />
    </div>
  );
}

const ConfirmDeleteModal = ({ isOpen, onClose, onConfirm }: { isOpen: boolean, onClose: () => void, onConfirm: () => void }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[250] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-[2.5rem] p-8 max-w-sm w-full shadow-2xl border border-slate-100 text-center">
                <div className="w-14 h-14 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4 text-rose-500">
                    <AlertTriangle size={24} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2 tracking-tight">¿Eliminar nota?</h3>
                <p className="text-slate-500 text-sm mb-8 leading-relaxed px-2">
                    Esta nota se borrará permanentemente de tu diario de lectura. Esta acción no se puede deshacer.
                </p>
                <div className="flex gap-3">
                    <button onClick={onClose} className="flex-1 py-3 font-bold text-slate-400 hover:text-slate-600 transition-colors uppercase text-[10px] tracking-widest">Cancelar</button>
                    <button onClick={onConfirm} className="flex-1 py-3 bg-slate-900 text-white rounded-xl font-bold shadow-lg hover:bg-rose-600 transition-all uppercase text-[10px] tracking-widest">Eliminar</button>
                </div>
            </div>
        </div>
    );
};