import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiFetch, formatCurrency, formatDate } from '../lib/store';
import { Button } from './ui/button';
import { toast } from 'sonner';
import { FileIcon, Trash2, Download, UploadCloud } from 'lucide-react';

export function ClientDocuments({ clientId }: { clientId: string }) {
  const [isUploading, setIsUploading] = useState(false);

  const { data: documents, isLoading, refetch } = useQuery({
    queryKey: ['documents', clientId],
    queryFn: async () => {
      const res = await apiFetch(`/api/documents?entityType=client&entityId=${clientId}`);
      if (!res.ok) throw new Error('Erreur chargement documents');
      return await res.json();
    }
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Le fichier dépasse la taille maximale autorisée (5 MB)");
      return;
    }

    const toastId = toast.loading("Envoi en cours...");
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      
      // L'upload API que l'on a déjà modifié (backend/controllers/UploadController.php)
      const resUpload = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: formData
      });

      if (!resUpload.ok) {
        const err = await resUpload.json().catch(() => ({}));
        throw new Error(err.error || "Erreur lors de l'envoi du fichier");
      }
      
      const { url } = await resUpload.json();

      // Enregistrer le document dans la DB
      const resDoc = await apiFetch('/api/documents', {
        method: 'POST',
        body: JSON.stringify({
          entityType: 'client',
          entityId: clientId,
          fileName: file.name,
          fileUrl: url,
          fileType: file.type || 'application/octet-stream',
          fileSize: file.size
        })
      });

      if (!resDoc.ok) {
         throw new Error("Erreur lors de l'enregistrement du document");
      }

      toast.success("Document ajouté avec succès !", { id: toastId });
      refetch();
    } catch (err: any) {
      toast.error(err.message || "Erreur d'envoi", { id: toastId });
    } finally {
      setIsUploading(false);
      e.target.value = ''; // reset input
    }
  };

  const deleteDocument = async (id: string) => {
    if (!confirm("Voulez-vous vraiment supprimer ce document ?")) return;
    const res = await apiFetch(`/api/documents/${id}`, { method: 'DELETE' });
    if (res.ok) {
      toast.success("Document supprimé");
      refetch();
    } else {
      toast.error("Erreur lors de la suppression");
    }
  };

  return (
    <div className="mt-6">
      <div className="flex justify-between items-center mb-4">
         <h3 className="font-semibold text-lg text-slate-800 border-b pb-2 flex-1 mr-4">Documents Associés (GED)</h3>
         <div className="relative">
            <input 
              type="file" 
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              onChange={handleFileUpload}
              disabled={isUploading}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
            />
            <Button variant="outline" size="sm" className="bg-white" disabled={isUploading}>
               <UploadCloud className="w-4 h-4 mr-2" />
               {isUploading ? 'Envoi...' : 'Ajouter un document'}
            </Button>
         </div>
      </div>

      {isLoading ? (
        <p className="text-slate-500 text-sm">Chargement...</p>
      ) : documents?.length === 0 ? (
        <p className="text-slate-500 text-sm italic">Aucun document attaché à ce client.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {documents?.map((doc: any) => (
            <div key={doc.id} className="border border-slate-200 rounded-lg p-3 bg-white flex items-center justify-between group hover:border-slate-300 hover:shadow-sm transition-all">
               <div className="flex items-center gap-3 overflow-hidden">
                  <div className="p-2 bg-slate-100 text-slate-500 rounded flex-shrink-0">
                     <FileIcon className="w-5 h-5" />
                  </div>
                  <div className="overflow-hidden">
                     <p className="text-sm font-medium text-slate-800 truncate" title={doc.fileName}>{doc.fileName}</p>
                     <p className="text-xs text-slate-400">{formatDate(doc.uploadedAt)} • {(doc.fileSize / 1024).toFixed(0)} KB</p>
                  </div>
               </div>
               <div className="flex gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
                     <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-emerald-600">
                        <Download className="w-4 h-4" />
                     </Button>
                  </a>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-red-600" onClick={() => deleteDocument(doc.id)}>
                     <Trash2 className="w-4 h-4" />
                  </Button>
               </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
