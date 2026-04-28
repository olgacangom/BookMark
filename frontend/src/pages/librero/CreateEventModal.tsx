import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { X, Calendar, Check } from 'lucide-react';
import api from '../../services/api';

export const CreateEventModal = ({ isOpen, onClose, onSuccess, eventToEdit = null }: any) => {
    const { register, handleSubmit, reset } = useForm();
    const isEditing = !!eventToEdit;

    const now = new Date().toISOString().slice(0, 16);

    useEffect(() => {
        if (isOpen) {
            if (isEditing) {
                const formattedDate = new Date(eventToEdit.eventDate).toISOString().slice(0, 16);
                reset({ ...eventToEdit, eventDate: formattedDate });
            } else {
                reset({ title: '', description: '', eventDate: '', maxCapacity: '' });
            }
        }
    }, [isOpen, eventToEdit, reset, isEditing]);

    const onSubmit = async (data: any) => {
        try {
            if (isEditing) {
                await api.patch(`/librero/events/${eventToEdit.id}`, data);
            } else {
                await api.post('/librero/events', data);
            }
            onSuccess();
        } catch {
            alert("Error al procesar el evento");
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[250] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-300 text-left">
            <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-lg overflow-hidden border-8 border-white animate-in zoom-in-95">
                <header className={`px-8 py-6 ${isEditing ? 'bg-teal-600' : 'bg-teal-600'} text-white flex justify-between items-center`}>
                    <div className="flex items-center gap-3">
                        <Calendar size={20} />
                        <h2 className="text-lg font-black uppercase tracking-tight">
                            {isEditing ? 'Editar Quedada' : 'Nuevo Evento'}
                        </h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors"><X size={20}/></button>
                </header>

                <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-5">
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Título</label>
                        <input {...register('title', { required: true })} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:border-teal-500 outline-none font-bold text-slate-700" placeholder="Nombre de la quedada..." />
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Descripción</label>
                        <textarea {...register('description', { required: true })} rows={3} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:border-teal-500 outline-none font-medium text-sm" placeholder="¿Qué haremos?" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Fecha y Hora</label>
                            <input 
                                type="datetime-local" 
                                min={now}
                                {...register('eventDate', { required: true })} 
                                className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:border-teal-500 outline-none text-sm font-bold" 
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Aforo</label>
                            <input type="number" {...register('maxCapacity')} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:border-teal-500 outline-none text-sm font-bold" placeholder="Personas" />
                        </div>
                    </div>

                    <button type="submit" className={`w-full py-4 ${isEditing ? 'bg-slate-900 hover:bg-teal-600' : 'bg-slate-900 hover:bg-teal-600'} text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl transition-all flex items-center justify-center gap-2 mt-4`}>
                        <Check size={18} /> {isEditing ? 'Guardar Cambios' : 'Publicar Evento'}
                    </button>
                </form>
            </div>
        </div>
    );
};