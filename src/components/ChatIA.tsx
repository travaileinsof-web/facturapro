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
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-4xl mx-auto bg-[var(--background)] rounded-none shadow-[0_4px_30px_rgba(0,0,0,0.05)] border border-[var(--border)] relative overflow-hidden">
      <div className="flex-1 overflow-y-auto p-8 bg-[var(--background)] pb-40">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center max-w-lg mx-auto">
             <div className="w-24 h-24 flex items-center justify-center bg-[var(--surface-2)] mb-8 shadow-sm">
               <Bot className="w-12 h-12 text-[var(--gold)]" />
             </div>
             <h2 className="text-4xl font-extrabold text-[var(--foreground)] tracking-tight mb-4 font-display">Je suis l'Assistant IA</h2>
             <p className="text-[var(--foreground-muted)] text-base leading-relaxed">
                Votre assistant intelligent propulsé par Gemini. <br/>
                Demandez-moi d'analyser vos chiffres, de créer une facture ou de rechercher un document.
             </p>
          </div>
        )}
        <div className="flex flex-col gap-10">
          {messages.map((m, i) => (
            <div key={i} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div className="flex items-center gap-2 mb-2">
                {m.role === 'model' && <Bot className="w-4 h-4 text-[var(--emerald)]" />}
                {m.role === 'user' && <User className="w-4 h-4 text-[var(--foreground-subtle)]" />}
                <span className="text-[11px] font-bold tracking-[0.8px] uppercase text-[var(--foreground-subtle)]">
                  {m.role === 'user' ? 'Vous' : 'ARIA'}
                </span>
              </div>
              <div className={`w-full max-w-3xl ${m.role === 'user' ? 'text-right' : 'text-left pl-5 border-l-2 border-[var(--emerald)] bg-[rgba(16,185,129,0.02)] p-4 shadow-sm'}`}>
                 <p className="whitespace-pre-wrap text-[var(--foreground)] leading-relaxed text-sm">{m.text}</p>
                 {m.action && (
                   <div className="mt-4 inline-flex items-center gap-2 bg-[var(--surface-1)] text-[var(--foreground)] px-4 py-2 border border-[var(--emerald)] shadow-[0_2px_10px_rgba(16,185,129,0.1)]">
                     <CheckCircle2 className="w-4 h-4 text-[var(--emerald)]" />
                     <span className="text-xs font-bold uppercase tracking-wider text-[var(--emerald)]">
                       {m.action.type === 'REFETCH' && `Base de données mise à jour`}
                       {m.action.type === 'WHATSAPP_SHARE' && `WhatsApp préparé`}
                     </span>
                   </div>
                 )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex flex-col items-start gap-2">
              <div className="flex items-center gap-2 mb-2">
                <Bot className="w-4 h-4 text-[var(--emerald)]" />
                <span className="text-[11px] font-bold tracking-[0.8px] uppercase text-[var(--foreground-subtle)]">ARIA</span>
              </div>
              <div className="pl-5 border-l-2 border-[var(--border)] flex items-center h-8">
                  <span className="flex gap-1.5">
                    <span className="w-1.5 h-1.5 bg-[var(--gold)] animate-pulse"></span>
                    <span className="w-1.5 h-1.5 bg-[var(--gold)] animate-pulse" style={{animationDelay: '0.2s'}}></span>
                    <span className="w-1.5 h-1.5 bg-[var(--gold)] animate-pulse" style={{animationDelay: '0.4s'}}></span>
                  </span>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Floating Input Area */}
      <div className="absolute bottom-0 left-0 right-0 p-8 pt-20 bg-gradient-to-t from-[var(--background)] via-[var(--background)] to-transparent pointer-events-none flex flex-col items-center">
        <div className="w-full max-w-3xl bg-[var(--surface-1)] border border-[var(--border)] shadow-[0_10px_40px_rgba(0,0,0,0.06)] pointer-events-auto flex flex-col p-2 relative overflow-hidden opacity-80 backdrop-blur-sm grayscale-[50%] cursor-not-allowed">
          
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-[rgba(255,255,255,0.4)] backdrop-blur-[2px]">
             <span className="text-[11px] font-bold tracking-[1px] uppercase bg-[var(--foreground)] text-[var(--background)] px-4 py-2 shadow-xl">Bientôt disponible</span>
          </div>

          <div className="flex gap-2">
            <Button 
               variant="ghost" 
               size="icon" 
               className="h-12 w-12 shrink-0 rounded-none text-[var(--foreground-muted)] hover:bg-[var(--surface-hover)]"
               disabled
            >
              <Mic className="w-5 h-5" />
            </Button>
            <Textarea 
              placeholder="Je vous écoute..." 
              className="resize-none h-12 min-h-[48px] py-3 bg-transparent border-none shadow-none focus-visible:ring-0 text-[var(--foreground)] text-sm"
              disabled
            />
            <Button disabled size="icon" className="h-12 w-12 shrink-0 rounded-none bg-[var(--gold)] text-black hover:bg-[#d4af37]">
              <Send className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
