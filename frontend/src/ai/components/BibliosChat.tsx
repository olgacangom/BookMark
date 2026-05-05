import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Sparkles, Loader2, Trash2, Calendar, Users, Search } from 'lucide-react';
import { aiService } from '../service/ai.service';

export const BibliosChat = () => {
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

    const handleSend = async (forcedPrompt?: string) => {
        const text = forcedPrompt || input;
        if (!text.trim() || loading) return;

        const newMsg = { role: 'user' as const, text };
        setMessages(prev => [...prev, newMsg]);
        setInput('');
        setLoading(true);

        try {
            const history = messages.map(m => ({ role: m.role, parts: [{ text: m.text }] }));
            const response = await aiService.sendMessage(text, history);
            setMessages(prev => [...prev, { role: 'model', text: response }]);
        } catch (e) {
            setMessages(prev => [...prev, { role: 'model', text: "La biblioteca está cerrada temporalmente. 📚🔌" }]);
        } finally {
            setLoading(false);
        }
    };

    const clearChat = () => {
        setMessages([]);
        setInput('');
    };

    return (
        <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end font-sans">
            {isOpen && (
                <div className="mb-4 w-[380px] sm:w-[420px] h-[650px] max-h-[85vh] bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.2)] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-100">
                    
                    {/* Header Premium */}
                    <header className="bg-slate-900 px-6 py-5 text-white flex justify-between items-center shrink-0 border-b border-white/10">
                        <div className="flex items-center gap-3">
                            <div className="bg-teal-500 p-2 rounded-xl shadow-lg shadow-teal-500/20">
                                <Sparkles size={18} />
                            </div>
                            <div>
                                <h3 className="font-bold text-sm tracking-tight leading-none mb-1">Biblios AI</h3>
                                <div className="flex items-center gap-1.5">
                                    <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Activo</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            {messages.length > 0 && (
                                <button onClick={clearChat} className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-red-400" title="Reiniciar chat">
                                    <Trash2 size={16} />
                                </button>
                            )}
                            <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                    </header>

                    {/* Chat Area */}
                    <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50 custom-scrollbar scroll-smooth">
                        {messages.length === 0 ? (
                            <div className="space-y-6 animate-in fade-in duration-700">
                                <div className="bg-white border border-slate-200 p-6 rounded-[2rem] shadow-sm">
                                    <p className="text-slate-600 text-[13px] leading-relaxed font-medium">
                                        ¡Hola! Soy **Biblios**. Estoy conectado a toda la red de **BookMark**. ¿En qué puedo ayudarte hoy?
                                    </p>
                                </div>
                                
                                {/* Quick Actions */}
                                <div className="grid gap-3">
                                    {[
                                        { label: "Recomiéndame algo", prompt: "Basado en mis gustos, recomiéndame libros que no tenga.", icon: <Sparkles size={16}/> },
                                        { label: "Próximos eventos", prompt: "¿Qué eventos o quedadas hay programadas?", icon: <Calendar size={16}/> },
                                        { label: "Clubes de lectura", prompt: "¿Qué clubes hay activos ahora?", icon: <Users size={16}/> },
                                        { label: "Analizar un libro", prompt: "¿De qué trata y a qué género pertenece el libro '...'?", icon: <Search size={16}/> }
                                    ].map((q, i) => (
                                        <button 
                                            key={i} 
                                            onClick={() => handleSend(q.prompt)}
                                            className="flex items-center gap-4 p-4 bg-white hover:bg-teal-50 border border-slate-200 hover:border-teal-200 rounded-2xl text-[13px] font-bold text-slate-700 transition-all shadow-sm group text-left"
                                        >
                                            <div className="p-2 bg-slate-50 text-teal-600 rounded-xl group-hover:bg-white transition-colors shadow-inner">
                                                {q.icon}
                                            </div>
                                            {q.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            messages.map((m, i) => (
                                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}>
                                    <div className={`whitespace-pre-wrap max-w-[85%] px-5 py-3.5 rounded-2xl text-[13px] leading-relaxed shadow-sm ${
                                        m.role === 'user' 
                                        ? 'bg-teal-600 text-white rounded-tr-none font-medium' 
                                        : 'bg-white text-slate-700 border border-slate-200 rounded-tl-none font-medium ring-1 ring-black/5'
                                    }`}>
                                        {m.text}
                                    </div>
                                </div>
                            ))
                        )}
                        {loading && (
                            <div className="flex justify-start items-center gap-3 animate-pulse">
                                <div className="bg-white px-4 py-3 rounded-2xl shadow-sm border border-slate-200">
                                    <Loader2 size={16} className="animate-spin text-teal-600" />
                                </div>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Consultando archivos...</span>
                            </div>
                        )}
                    </div>

                    <div className="p-5 bg-white border-t border-slate-100">
                        <div className="flex items-center gap-2 bg-slate-100 rounded-2xl px-4 py-2 focus-within:ring-2 focus-within:ring-teal-500/20 transition-all border border-transparent focus-within:border-teal-500/10">
                            <input
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                                placeholder="Escribe tu consulta literaria..."
                                className="flex-1 bg-transparent border-none py-3 text-[13px] outline-none text-slate-700 font-medium placeholder:text-slate-400"
                            />
                            <button 
                                onClick={() => handleSend()} 
                                disabled={loading} 
                                className="bg-teal-600 text-white p-2.5 rounded-xl hover:bg-teal-700 disabled:opacity-30 shadow-lg shadow-teal-600/20 transition-all active:scale-95"
                            >
                                <Send size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Trigger Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-16 h-16 rounded-full flex items-center justify-center shadow-[0_10px_30px_rgba(13,148,136,0.3)] transition-all duration-500 ${
                    isOpen ? 'bg-slate-900 rotate-90 scale-90' : 'bg-teal-600 hover:scale-105 active:scale-95'
                }`}
            >
                {isOpen ? <X className="text-white" size={28} /> : <MessageCircle className="text-white" size={30} fill="currentColor" />}
            </button>
        </div>
    );
};