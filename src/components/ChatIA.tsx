import { useState } from 'react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Send, Bot, User, Mic, MicOff, CheckCircle2 } from 'lucide-react';
import { useAppStore, apiFetch } from '../lib/store';
import { toast } from 'sonner';

export function ChatIA() {
  const [messages, setMessages] = useState<{role: 'user'|'model', text: string, action?: any}[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const triggerRefresh = useAppStore(state => state.triggerRefresh);

  const toggleRecording = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("Reconnaissance vocale non supportée par votre navigateur.");
      return;
    }
    
    if (isRecording) {
      setIsRecording(false);
    } else {
      const recognition = new SpeechRecognition();
      recognition.lang = 'fr-FR';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => setIsRecording(true);
      
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(prev => prev + (prev ? ' ' : '') + transcript);
      };
      
      recognition.onerror = () => setIsRecording(false);
      recognition.onend = () => setIsRecording(false);
      
      recognition.start();
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;
    
    const userMsg = input.trim();
    setInput('');
    const newMessages = [...messages, { role: 'user' as const, text: userMsg }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const res = await apiFetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg, history: messages.map(m => ({role: m.role, text: m.text})) })
      });
      const data = await res.json();
      
      if (!res.ok) {
        toast.error(data.error || 'Erreur API IA');
        setIsLoading(false);
        return;
      }

      setMessages([...newMessages, { role: 'model', text: data.text, action: data.action }]);

      // Execute client-side effects
      if (data.action) {
        if (data.action.type === 'REFETCH') {
           triggerRefresh(data.action.target); // Ex: 'clients', 'invoices'
        }
        else if (data.action.type === 'WHATSAPP_SHARE') {
           const shareRes = await apiFetch(`/api/share?invoiceId=${data.action.documentId}`);
           if (shareRes.ok) {
              const shareData = await shareRes.json();
              if (shareData.url) {
                  window.open(shareData.url, '_blank');
              }
           }
        }
      }

    } catch (e) {
      toast.error('Erreur de connexion internet');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-4xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-slate-50 relative">
        {messages.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
             <Bot className="w-16 h-16 mb-4 text-slate-300" />
             <p>Je suis ARIA, votre assistant ERP propulsé par Gemini.</p>
             <p className="text-sm mt-2 text-center max-w-lg">
                Utilisez le micro ou le texte pour tout faire : <br/>
                "Ajoute le client TechMali", "Crée une facture de 5 PC pour Ali et envoie sur WhatsApp"...
             </p>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-4 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
             {m.role === 'model' && (
               <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                 <Bot className="w-5 h-5 text-emerald-600" />
               </div>
             )}
             <div className={`max-w-[80%] rounded-2xl p-4 ${m.role === 'user' ? 'bg-slate-900 text-white rounded-tr-none' : 'bg-white border border-slate-200 shadow-sm rounded-tl-none'}`}>
               <p className="whitespace-pre-wrap">{m.text}</p>
               {m.action && (
                 <div className="mt-3 inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full text-xs font-medium border border-emerald-200">
                   <CheckCircle2 className="w-4 h-4" />
                   {m.action.type === 'REFETCH' && `Base de données mise à jour`}
                   {m.action.type === 'WHATSAPP_SHARE' && `WhatsApp préparé`}
                 </div>
               )}
             </div>
             {m.role === 'user' && (
               <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                 <User className="w-5 h-5 text-slate-600" />
               </div>
             )}
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-4 justify-start">
             <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                 <Bot className="w-5 h-5 text-emerald-600 animate-pulse" />
             </div>
             <div className="bg-white border border-slate-200 shadow-sm rounded-2xl rounded-tl-none p-4 flex items-center">
                <span className="flex gap-1">
                  <span className="w-2 h-2 rounded-full bg-slate-300 animate-bounce"></span>
                  <span className="w-2 h-2 rounded-full bg-slate-300 animate-bounce" style={{animationDelay: '0.2s'}}></span>
                  <span className="w-2 h-2 rounded-full bg-slate-300 animate-bounce" style={{animationDelay: '0.4s'}}></span>
                </span>
             </div>
          </div>
        )}
      </div>
      <div className="p-4 bg-white border-t border-slate-200 flex gap-4 items-end">
        <Button 
           onClick={toggleRecording} 
           variant="outline" 
           size="icon" 
           className={`h-14 w-14 shrink-0 rounded-xl transition-colors ${isRecording ? 'bg-red-100 text-red-600 border-red-200 hover:bg-red-200' : 'text-slate-500'}`}
        >
          {isRecording ? <MicOff className="w-6 h-6 animate-pulse" /> : <Mic className="w-6 h-6" />}
        </Button>
        <Textarea 
          placeholder="Je vous écoute, ou tapez votre demande..." 
          className="resize-none h-14 min-h-[56px] py-4"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if(e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          }}
        />
        <Button onClick={sendMessage} disabled={isLoading || !input.trim()} size="icon" className="h-14 w-14 shrink-0 rounded-xl bg-slate-900 hover:bg-slate-800">
          <Send className="w-6 h-6" />
        </Button>
      </div>
    </div>
  );
}
