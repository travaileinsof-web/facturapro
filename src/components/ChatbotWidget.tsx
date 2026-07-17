import { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Send, Bot, Mic, MicOff, X } from 'lucide-react';
import { useAppStore, apiFetch } from '../lib/store';
import { toast } from 'sonner';

export function ChatbotWidget({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [messages, setMessages] = useState<{role: 'user'|'model', text: string, action?: any}[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const triggerRefresh = useAppStore(state => state.triggerRefresh);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const recognitionRef = useRef<any>(null);

  const toggleRecording = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("Reconnaissance vocale non supportée par votre navigateur.");
      return;
    }
    
    if (isRecording) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsRecording(false);
    } else {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.lang = 'fr-FR';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => setIsRecording(true);
      
      recognition.onresult = (event: any) => {
        const transcript = event.results[event.resultIndex][0].transcript;
        setInput(prev => {
          // Éviter de dupliquer la phrase si le navigateur déclenche l'événement plusieurs fois
          if (prev.trim().endsWith(transcript.trim())) {
             return prev;
          }
          return prev + (prev ? ' ' : '') + transcript;
        });
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
        body: JSON.stringify({ message: userMsg, history: (messages || []).map(m => ({role: m.role, text: m.text})) })
      });
      const isJson = res.headers.get('content-type')?.includes('application/json');
      if (!res.ok) {
        const errorData = isJson ? await res.json() : null;
        toast.error(errorData?.error || 'Erreur API IA');
        setIsLoading(false);
        return;
      }
      const data = await res.json();

      setMessages([...newMessages, { role: 'model', text: data.text, action: data.action }]);

      // Execute client-side effects
      if (data.action) {
        if (data.action.type === 'REFETCH') {
           triggerRefresh(data.action.target);
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

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-24 right-6 w-[400px] max-w-[calc(100vw-3rem)] h-[600px] max-h-[calc(100vh-8rem)] bg-[var(--background)] rounded-xl shadow-[0_12px_40px_rgba(0,0,0,0.15)] border border-[var(--border)] flex flex-col z-[1000] overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--surface-1)]" style={{ padding: '16px' }}>
        <div className="flex items-center" style={{ gap: '12px' }}>
          <div className="w-8 h-8 rounded-full bg-[var(--gold)] flex items-center justify-center text-[#0A0A0F] shadow-sm">
            <Bot size={18} />
          </div>
          <div>
            <h3 className="font-semibold text-[var(--foreground)] text-sm">Assistant IA</h3>
            <p className="text-xs text-[var(--color-text-secondary)]">FacturaPro Copilot</p>
          </div>
        </div>
        <button onClick={onClose} className="text-[var(--color-text-secondary)] hover:text-[var(--foreground)] transition-colors">
          <X size={20} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto flex flex-col" style={{ padding: '16px', gap: '16px' }}>
        {(messages || []).length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-[var(--color-text-secondary)]">
            <Bot className="w-12 h-12 mb-3 text-[var(--color-border)]" />
            <p className="text-sm">Bonjour ! Je suis l'IA de FacturaPro.<br/>Posez-moi vos questions ou demandez-moi de l'aide.</p>
          </div>
        ) : (
          (messages || []).map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-2xl ${
                m.role === 'user' 
                  ? 'bg-[var(--gold)] text-[#0A0A0F] rounded-br-none font-medium' 
                  : 'bg-[var(--surface-1)] border border-[var(--border)] text-[var(--color-text-primary)] rounded-bl-none shadow-sm'
              }`} style={{ padding: '12px 16px', fontSize: '14px', lineHeight: '1.5' }}>
                {m.text}
              </div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex justify-start">
             <div className="bg-[var(--surface-1)] border border-[var(--border)] rounded-2xl rounded-bl-none shadow-sm flex" style={{ padding: '12px 16px', gap: '4px' }}>
               <span className="w-2 h-2 rounded-full bg-[var(--color-text-secondary)] animate-bounce" />
               <span className="w-2 h-2 rounded-full bg-[var(--color-text-secondary)] animate-bounce" style={{animationDelay: '0.2s'}} />
               <span className="w-2 h-2 rounded-full bg-[var(--color-text-secondary)] animate-bounce" style={{animationDelay: '0.4s'}} />
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-[var(--border)] bg-[var(--surface-1)]" style={{ padding: '16px' }}>
        <div className="relative flex items-center">
          <Textarea 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder="Écrivez un message..."
            className="min-h-[50px] max-h-[120px] pr-24 py-3 resize-none bg-[var(--background)] border-[var(--border)] focus-visible:ring-1 focus-visible:ring-[var(--gold)] text-sm"
            rows={1}
          />
          <div className="absolute right-2 flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleRecording}
              className={`h-8 w-8 ${isRecording ? 'text-red-500 hover:text-red-600 bg-red-500/10' : 'text-[var(--color-text-secondary)] hover:text-[var(--foreground)]'}`}
              style={{ marginRight: '8px' }}
              disabled={isLoading}
            >
              {isRecording ? <Mic size={16} className="animate-pulse" /> : <MicOff size={16} />}
            </Button>
            <Button
              onClick={sendMessage}
              disabled={!input.trim() || isLoading}
              size="icon"
              className="h-8 w-8 bg-[var(--gold)] hover:bg-[var(--gold)]/90 text-[#0A0A0F] shrink-0 rounded-full"
            >
              <Send size={14} className={input.trim() && !isLoading ? "ml-0.5" : ""} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
