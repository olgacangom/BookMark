import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../../context/AuthContext';
import { Send, User as UserIcon, Search, MessageSquare, ArrowLeft } from 'lucide-react';

interface Message {
    id: string;
    content: string;
    sender: { id: string; fullName: string; avatarUrl: string };
    createdAt: string;
}

interface Conversation {
    id: string;
    userOne: any;
    userTwo: any;
    unreadCount?: number;
}

export const ChatView = () => {
    const { user } = useAuth();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [socket, setSocket] = useState<Socket | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const newSocket = io('http://localhost:3000');
        setSocket(newSocket);

        newSocket.on('new_message', (msg: any) => {
            if (selectedConv?.id === (msg.conversationId || msg.conversation?.id)) {
                setMessages((prev) => [...prev, msg]);
            } else {
                setConversations((prev) => 
                    prev.map((c) => 
                        c.id === (msg.conversationId || msg.conversation?.id)
                            ? { ...c, unreadCount: (c.unreadCount || 0) + 1 }
                            : c
                    )
                );
            }
        });

        return () => { newSocket.close(); };
    }, [selectedConv]);

    useEffect(() => {
        fetchConversations();
    }, []);

    useEffect(() => {
        if (selectedConv && socket) {
            socket.emit('join_chat', selectedConv.id);
            fetchMessages(selectedConv.id);
        }
    }, [selectedConv, socket]);

    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const fetchConversations = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('http://localhost:3000/chat/conversations', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            setConversations(Array.isArray(data) ? data : []);
        } catch { setConversations([]); }
    };

    const fetchMessages = async (convId: string) => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:3000/chat/messages/${convId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            setMessages(Array.isArray(data) ? data : []);
        } catch (e) { console.error(e); }
    };

    const handleSelectConversation = async (conv: Conversation) => {
        setSelectedConv(conv);

        if (conv.unreadCount && conv.unreadCount > 0) {
            try {
                const token = localStorage.getItem('token');
                await fetch(`http://localhost:3000/chat/read/${conv.id}`, {
                    method: 'PATCH',
                    headers: { Authorization: `Bearer ${token}` }
                });
                
                setConversations(prev => 
                    prev.map(c => c.id === conv.id ? { ...c, unreadCount: 0 } : c)
                );

                window.dispatchEvent(new Event('refresh_unread_global'));

            } catch (e) { console.error(e); }
        }
    };

    const handleSend = () => {
        if (!newMessage.trim() || !socket || !selectedConv) return;
        socket.emit('send_message', {
            conversationId: selectedConv.id,
            senderId: user?.id,
            content: newMessage
        });
        setNewMessage('');
    };

    const getOtherUser = (conv: Conversation) => {
        return conv.userOne.id === user?.id ? conv.userTwo : conv.userOne;
    };

    return (
        <div className="h-[calc(100vh-10rem)] lg:h-[calc(100vh-8rem)] max-w-6xl mx-auto flex bg-white/80 backdrop-blur-xl rounded-3xl lg:rounded-[3rem] shadow-2xl overflow-hidden border-4 lg:border-8 border-white">
            
            <div className={`w-full lg:w-80 border-r border-slate-100 flex flex-col bg-slate-50/50 ${selectedConv ? 'hidden lg:flex' : 'flex'}`}>
                <div className="p-6">
                    <h2 className="text-xl font-black text-slate-800 uppercase tracking-tighter mb-4">Mensajes</h2>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                        <input type="text" placeholder="Buscar chat..." className="w-full pl-9 pr-4 py-2 bg-white rounded-xl text-xs border border-slate-200 outline-none focus:ring-2 focus:ring-teal-500/20 transition-all" />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto no-scrollbar">
                    {conversations.map((conv) => {
                        const other = getOtherUser(conv);
                        const count = conv.unreadCount || 0;

                        return (
                            <div
                                key={conv.id}
                                onClick={() => handleSelectConversation(conv)}
                                className={`p-4 flex items-center gap-3 cursor-pointer transition-all ${selectedConv?.id === conv.id ? 'bg-white shadow-sm border-y border-slate-100' : 'hover:bg-slate-100/50'}`}
                            >
                                <div className="relative flex-shrink-0">
                                    <div className="w-12 h-12 rounded-full bg-teal-100 overflow-hidden border-2 border-white shadow-sm">
                                        {other.avatarUrl ? <img src={other.avatarUrl} className="w-full h-full object-cover" /> : <UserIcon className="m-auto text-teal-600" />}
                                    </div>
                                    
                                    {count > 0 && (
                                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white animate-pulse">
                                            {count}
                                        </div>
                                    )}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <h4 className={`text-sm truncate text-left ${count > 0 ? 'font-black text-slate-900' : 'font-bold text-slate-800'}`}>
                                        {other.fullName}
                                    </h4>
                                    <p className={`text-[10px] truncate uppercase tracking-widest text-left ${count > 0 ? 'text-teal-600 font-black' : 'text-slate-400 font-bold'}`}>
                                        {count > 0 ? 'Mensaje nuevo' : 'Ver conversación'}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* CHAT ABIERTO */}
            <div className={`flex-1 flex flex-col bg-white ${!selectedConv ? 'hidden lg:flex' : 'flex'}`}>
                {selectedConv ? (
                    <>
                        <div className="p-4 border-b border-slate-50 flex items-center gap-3">
                            <button onClick={() => setSelectedConv(null)} className="lg:hidden p-2 text-slate-400"><ArrowLeft size={20} /></button>
                            <div className="w-10 h-10 rounded-full bg-teal-50 flex overflow-hidden border border-teal-100">
                                {getOtherUser(selectedConv).avatarUrl ? <img src={getOtherUser(selectedConv).avatarUrl} /> : <UserIcon className="m-auto text-teal-600" size={18} />}
                            </div>
                            <span className="font-black text-slate-800 uppercase text-sm tracking-tight">{getOtherUser(selectedConv).fullName}</span>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-4 bg-[#F8FAFC]">
                            {messages.map((msg) => (
                                <div key={msg.id} className={`flex ${msg.sender.id === user?.id ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[85%] lg:max-w-[70%] p-4 rounded-2xl text-sm shadow-sm ${msg.sender.id === user?.id ? 'bg-teal-600 text-white rounded-tr-none' : 'bg-white text-slate-700 rounded-tl-none border border-slate-100'}`}>
                                        <div className="text-left">{msg.content}</div>
                                        <div className={`text-[9px] mt-1 font-bold opacity-50 ${msg.sender.id === user?.id ? 'text-right' : 'text-left'}`}>
                                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <div ref={scrollRef} />
                        </div>

                        <div className="p-4 bg-white border-t border-slate-50">
                            <div className="flex gap-2">
                                <input value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSend()} placeholder="Escribe un mensaje..." className="flex-1 bg-slate-100 border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-teal-500/20 outline-none" />
                                <button onClick={handleSend} className="bg-teal-600 text-white p-3 rounded-2xl hover:bg-teal-700 transition-all shadow-lg shadow-teal-500/20"><Send size={18} /></button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-300 p-8 text-center">
                        <MessageSquare size={48} className="opacity-10 mb-4" />
                        <p className="font-bold uppercase tracking-[0.2em] text-[10px]">Selecciona un lector</p>
                    </div>
                )}
            </div>
        </div>
    );
};