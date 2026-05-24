import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Sparkles, Loader2, Trash2, Calendar, Users, TrendingUp } from 'lucide-react';
import { aiService } from '../service/ai.service';
import { useAuth } from '../../context/AuthContext';
import ReactMarkdown from 'react-markdown';

export const BibliosChat = () => {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<{ role: 'user' | 'model', text: string }[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, loading]);

    const getQuickActions = () => {
        const role = user?.role?.toLowerCase();
        if (role === 'admin') return [
            { label: "Top Interacción", prompt: "¿Cuál es el usuario que más interactúa con la app?" },
            { label: "Libro Popular", prompt: "¿Cuál es el libro más registrado?" }
        ];
        if (role === 'librero') return [
            { label: "Horario ideal para eventos", prompt: "¿En qué franja horaria asisten más lectores?" },
            { label: "Género más vendido", prompt: "¿Qué género vendo más?" },
            { label: "Usuario que más compra", prompt: "¿Qué género vendo más?" }
        ];
        return [
            { label: "Recomiéndame algo", prompt: "Dame una recomendación de libro que no tenga en mi biblioteca.", icon: <Sparkles size={16}/> },
            { label: "Próximos eventos", prompt: "¿Qué eventos tengo y cuáles hay disponibles?", icon: <Calendar size={16}/> },
            { label: "Clubes de lectura", prompt: "¿A qué clubes me recomiendas unirme?", icon: <Users size={16}/> },
        ];
    };

    const handleSend = async (forcedPrompt?: string) => {
        const text = forcedPrompt || input;
        if (!text.trim() || loading) return;

        setMessages(prev => [...prev, { role: 'user', text: forcedPrompt || text }]);
        setInput('');
        setLoading(true);

        try {
            const history = messages.map(m => ({ role: m.role, parts: [{ text: m.text }] }));
            const response = await aiService.sendMessage(text, history);
            setMessages(prev => [...prev, { role: 'model', text: response }]);
        } catch {
            setMessages(prev => [...prev, { role: 'model', text: "La conexión con Biblios se ha interrumpido temporalmente. 🔌" }]);
        } finally {
            setLoading(false);
        }
    };

    const clearChat = () => { setMessages([]); setInput(''); };

    return (
        <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end font-sans">
            {isOpen && (
                <div className="mb-4 w-[380px] sm:w-[420px] h-[650px] max-h-[85vh] bg-white rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-300 text-left">
                    
                    <header className="bg-slate-900 px-6 py-5 text-white flex justify-between items-center shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="bg-teal-500 p-2 rounded-xl"><Sparkles size={18} /></div>
                            <div>
                                <h3 className="font-bold text-sm leading-none">Biblios AI</h3>
                                <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">En línea</span>
                            </div>
                        </div>
                        <div className="flex gap-1">
                            <button onClick={clearChat} className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-red-400"><Trash2 size={16} /></button>
                            <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={20} /></button>
                        </div>
                    </header>

                    <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50 custom-scrollbar">
                        {messages.length === 0 ? (
                            <div className="space-y-6">
                                <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200 text-slate-600 text-sm font-medium">
                                    ¡Hola! Soy **Biblios**. Estoy conectado a la red de **BookMark**. ¿En qué puedo ayudarte hoy?
                                </div>
                                <div className="grid gap-3">
                                    {getQuickActions().map((q, i) => (
                                        <button key={i} onClick={() => handleSend(q.prompt)} className="flex items-center gap-4 p-4 bg-white hover:bg-teal-50 border border-slate-200 rounded-2xl text-[13px] font-bold text-slate-700 transition-all shadow-sm group">
                                            <div className="p-2 bg-slate-50 text-teal-600 rounded-xl group-hover:bg-white transition-colors">{(q as any).icon || <TrendingUp size={16}/>}</div>
                                            {q.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            messages.map((m, i) => (
                                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}>
                                    <div className={`max-w-[85%] px-5 py-3.5 rounded-2xl text-[13px] leading-relaxed shadow-sm ${
                                        m.role === 'user' ? 'bg-teal-600 text-white rounded-tr-none' : 'bg-white text-slate-700 border border-slate-200 rounded-tl-none'
                                    }`}>
                                        {m.role === 'user' ? (m.text) : (
                                            <div className="markdown-container">
                                                <ReactMarkdown>{m.text}</ReactMarkdown>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                        {loading && <div className="flex justify-start animate-pulse"><Loader2 size={16} className="animate-spin text-teal-600" /></div>}
                    </div>

                    <div className="p-5 bg-white border-t border-slate-100">
                        <div className="flex items-center gap-2 bg-slate-100 rounded-2xl px-4 py-1">
                            <input 
                                value={input} 
                                onChange={e => setInput(e.target.value)} 
                                onKeyPress={e => e.key === 'Enter' && handleSend()} 
                                placeholder="Pregunta a Biblios..." 
                                className="flex-1 bg-transparent border-none py-3 text-[13px] outline-none text-slate-700 font-medium" 
                            />
                            <button onClick={() => handleSend()} disabled={loading || !input.trim()} className="bg-teal-600 text-white p-2.5 rounded-xl hover:bg-teal-700 transition-all active:scale-95"><Send size={18} /></button>
                        </div>
                    </div>
                </div>
            )}
            <button onClick={() => setIsOpen(!isOpen)} className={`w-16 h-16 rounded-full flex items-center justify-center shadow-xl transition-all duration-500 ${isOpen ? 'bg-slate-900 rotate-90' : 'bg-teal-600 hover:scale-105'}`}>
                {isOpen ? <X className="text-white" size={28} /> : <MessageCircle className="text-white" size={30} fill="currentColor" />}
            </button>
        </div>
    );
};