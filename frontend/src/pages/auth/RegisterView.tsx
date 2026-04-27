import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
    BookOpen, User, Mail, Lock, Loader2, 
    Eye, EyeOff, ChevronRight, Store, Users, 
    MapPin, Building2, UploadCloud, FileText, ShieldCheck
} from 'lucide-react';

export const RegisterView = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('user'); 
    
    const [libraryName, setLibraryName] = useState('');
    const [libraryAddress, setLibraryAddress] = useState('');
    const [document, setDocument] = useState<File | null>(null);

    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    const { register } = useAuth(); 
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        try {
            const extraData = role === 'librero_pendiente' ? {
                libraryName,
                libraryAddress,
                document: document, 
            } : {};

            await register(name, email, password, role, extraData);

            if (role === 'librero_pendiente') {
                setShowSuccessModal(true);
            } else {
                navigate('/login'); 
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Error al crear la cuenta.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F0F9F9] flex items-center justify-center px-4 py-12 relative overflow-hidden font-sans">
            
            {/* MODAL DE ÉXITO */}
            {showSuccessModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"></div>
                    <div className="bg-white rounded-[3rem] w-full max-w-sm p-10 shadow-2xl relative border-8 border-teal-50/50 text-center">
                        <div className="w-20 h-20 bg-teal-100 rounded-3xl flex items-center justify-center text-teal-600 mx-auto mb-6">
                            <ShieldCheck size={40} />
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 mb-2 uppercase tracking-tight">Solicitud Enviada</h3>
                        <p className="text-slate-500 text-sm mb-8 leading-relaxed">¡Gracias por unirte! Un administrador revisará tu licencia pronto para poder acceder.</p>
                        <button onClick={() => navigate('/login')} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-teal-600 transition-all">Entendido</button>
                    </div>
                </div>
            )}

            <div className="absolute top-[-5%] right-[-5%] w-80 h-80 bg-emerald-200/20 rounded-full blur-[100px]" />
            <div className="absolute bottom-[-5%] left-[-5%] w-80 h-80 bg-teal-200/20 rounded-full blur-[100px]" />
            
            <div className="w-full max-w-[500px] relative z-10">
                <div className="bg-white/90 backdrop-blur-2xl rounded-[2.5rem] shadow-xl border border-white p-10 md:p-12">
                    
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-teal-600 rounded-[1.8rem] mb-6">
                            <BookOpen className="w-10 h-10 text-white" />
                        </div>
                        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Book<span className="text-teal-600 font-serif italic font-normal">Mark</span></h1>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl text-xs font-bold animate-in slide-in-from-top-2">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* SELECTOR DE ROL */}
                        <div className="grid grid-cols-2 gap-3 mb-6">
                            <button type="button" onClick={() => setRole('user')} className={`flex items-center justify-center gap-2 p-3 rounded-2xl border-2 transition-all ${role === 'user' ? 'border-teal-600 bg-teal-50 text-teal-700' : 'border-slate-100 text-slate-400'}`}>
                                <Users size={18} /> <span className="text-xs font-bold uppercase">Lector</span>
                            </button>
                            <button type="button" onClick={() => setRole('librero_pendiente')} className={`flex items-center justify-center gap-2 p-3 rounded-2xl border-2 transition-all ${role === 'librero_pendiente' ? 'border-teal-600 bg-teal-50 text-teal-700' : 'border-slate-100 text-slate-400'}`}>
                                <Store size={18} /> <span className="text-xs font-bold uppercase">Librería</span>
                            </button>
                        </div>

                        {/* CAMPOS COMUNES */}
                        <div className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase ml-2">Nombre completo</label>
                                <div className="relative group">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:border-teal-500 text-sm font-semibold outline-none" placeholder="Tu nombre" required />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase ml-2">Email</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:border-teal-500 text-sm font-semibold outline-none" placeholder="tu@email.com" required />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase ml-2">Contraseña</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                    <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full pl-12 pr-12 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:border-teal-500 text-sm font-semibold outline-none" placeholder="Mínimo 6 caracteres" required />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300">
                                        {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* CAMPOS LIBRERÍA */}
                        {role === 'librero_pendiente' && (
                            <div className="space-y-4 pt-4 border-t border-slate-100">
                                <p className="text-[10px] font-black text-teal-600 uppercase text-center mb-4">Datos del Establecimiento</p>
                                
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-2">Nombre Comercial</label>
                                    <div className="relative">
                                        <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                        <input 
                                            type="text" 
                                            value={libraryName} 
                                            onChange={(e) => setLibraryName(e.target.value)} 
                                            className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:border-teal-500 text-sm font-semibold outline-none" 
                                            placeholder="Nombre de la librería" 
                                            required={role === 'librero_pendiente'} 
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-2">Dirección Física</label>
                                    <div className="relative">
                                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                        <input 
                                            type="text" 
                                            value={libraryAddress} 
                                            onChange={(e) => setLibraryAddress(e.target.value)} 
                                            className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:border-teal-500 text-sm font-semibold outline-none" 
                                            placeholder="Calle, Ciudad..." 
                                            required={role === 'librero_pendiente'}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-2">Licencia (IAE/Licencia)</label>
                                    <div className="relative">
                                        <input 
                                            type="file" 
                                            id="file-upload" 
                                            required={role === 'librero_pendiente'}
                                            className="absolute w-full h-full opacity-0 cursor-pointer z-10" 
                                            onChange={(e) => setDocument(e.target.files ? e.target.files[0] : null)}
                                        />
                                        <div className={`flex items-center justify-center gap-3 w-full p-4 border-2 border-dashed rounded-2xl transition-all ${
                                            document ? 'bg-teal-50 border-teal-200 text-teal-600' : 'bg-slate-50 border-slate-200 text-slate-400'
                                        }`}>
                                            {document ? (
                                                <div className="flex items-center gap-2 font-bold text-xs truncate max-w-[200px]">
                                                    <FileText size={16} /> {document.name} 
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2 font-bold text-xs">
                                                    <UploadCloud size={18} /> Licencia librería PDF/JPG 
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <button type="submit" disabled={isSubmitting} className="w-full bg-gradient-to-r from-slate-700 via-teal-600 to-emerald-600 text-white py-4 rounded-2xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-3 mt-6">
                            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Finalizar Registro <ChevronRight size={16} /></>}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};