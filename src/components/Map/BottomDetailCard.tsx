import { X, Navigation, Calendar, Image as ImageIcon, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/useAuthStore';
import { useState } from 'react';
import { ImageGalleryModal } from '@/shared/components/ImageGalleryModal';

interface BottomDetailCardProps {
  complaint: any;
  onClose: () => void;
}

export function BottomDetailCard({ complaint, onClose }: BottomDetailCardProps) {
  const { user } = useAuthStore();
  const [showImage, setShowImage] = useState(false);
  
  if (!complaint) return null;

  const handleViewOS = () => {
    if (!complaint.serviceOrderProtocol) return;
    window.dispatchEvent(new CustomEvent('open-os-tab'));
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('open-os', { detail: { protocol: complaint.serviceOrderProtocol } }));
    }, 50);
    onClose();
  };
  const handleViewComplaint = () => {
    if (!complaint.complaint?.protocol) return;
    window.dispatchEvent(new CustomEvent('open-complaints-tab'));
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('open-complaint', { detail: { protocol: complaint.complaint.protocol } }));
    }, 50);
    onClose();
  };
  const handleViewDetails = () => {
    if (complaint.type === 'OS') {
      window.dispatchEvent(new CustomEvent('open-os-tab'));
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('open-os', { detail: { protocol: complaint.protocol } }));
      }, 50);
    } else {
      window.dispatchEvent(new CustomEvent('open-complaints-tab'));
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('open-complaint', { detail: { protocol: complaint.protocol } }));
      }, 50);
    }
    onClose();
  };

  const handleEdit = () => {
    if (complaint.type !== 'OS' && user?.id === complaint.userId) {
      onClose();
      window.dispatchEvent(new CustomEvent('open-edit-complaint', { detail: { complaint } }));
    }
  };

  return (
    <>
      <div className={`absolute md:bottom-4 md:right-4 left-1/2 -translate-x-1/2 md:left-auto md:translate-x-0 z-50 w-[calc(100%-1.5rem)] md:w-[340px] pointer-events-none transition-all ${
        user ? 'bottom-20' : 'bottom-4'
      }`}>
        <div className="p-4 rounded-2xl pointer-events-auto animate-in slide-in-from-bottom-8 fade-in duration-500 shadow-2xl relative bg-background/85 backdrop-blur-md border border-border">
          <button 
            onClick={onClose}
            className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 text-foreground/50 hover:text-foreground transition-all"
          >
            <X size={16} />
          </button>

          <div className="flex flex-col justify-between">
            <div>
              <div className="flex flex-col gap-1 mb-3 pr-6">
                <h3 className="text-lg font-bold text-foreground capitalize leading-tight line-clamp-1">
                  {complaint.category}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase shrink-0 text-white shadow-sm ${complaint.type === 'OS' ? (complaint.complaintId || complaint.complaint ? 'bg-blue-600' : 'bg-purple-600') : 'bg-orange-500'}`}>
                    {complaint.type === 'OS' ? (complaint.complaintId || complaint.complaint ? 'OS' : 'OS Avulsa') : 'Denúncia'}
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider shrink-0 ${
                    complaint.status?.toUpperCase() === 'RESOLVIDA' || complaint.status?.toUpperCase() === 'RESOLVIDO' || complaint.status?.toUpperCase() === 'CONCLUIDA' ? 'bg-green-500/20 text-green-600 dark:text-green-400' :
                    complaint.status?.toUpperCase() === 'EM_ANDAMENTO' || complaint.status?.toUpperCase() === 'EM ANDAMENTO' ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400' :
                    'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400'
                  }`}>
                    {(complaint.status?.toUpperCase() === 'RESOLVIDO' || complaint.status?.toUpperCase() === 'CONCLUIDA'
                      ? 'RESOLVIDA'
                      : complaint.status)?.replace('_', ' ')}
                  </span>
                </div>
              </div>
              
              <div className="flex items-start gap-2 text-foreground/70">
                <Navigation size={14} className="mt-0.5 flex-shrink-0 text-primary" />
                <p className="text-xs font-medium leading-tight">{complaint.address || `${complaint.latitude}, ${complaint.longitude}`}</p>
              </div>

              {complaint.description && (
                <p className="text-foreground/80 text-xs mt-3 leading-relaxed line-clamp-3">
                  {complaint.description}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-3 mt-4 pt-3 border-t border-foreground/10">
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-1.5 shrink-0">
                  {complaint.createdAt && (
                    <div className="flex items-center gap-1.5 text-foreground/50 text-[10px] font-medium">
                      <Calendar size={12} />
                      <span>{new Date(complaint.createdAt).toLocaleDateString('pt-BR')}</span>
                    </div>
                  )}
                  {complaint.serviceOrderProtocol && (
                    <div className="flex items-center gap-1.5 text-[10px] font-medium">
                      <span className="text-foreground/50 uppercase tracking-wider font-semibold">OS:</span>
                      <span className="font-mono text-primary font-bold">{complaint.serviceOrderProtocol}</span>
                    </div>
                  )}
                  {complaint.type === 'OS' && (
                    complaint.complaint?.protocol ? (
                      <div className="flex items-center gap-1.5 text-[10px] font-medium">
                        <span className="text-foreground/50 uppercase tracking-wider font-semibold">DEN:</span>
                        <span className="font-mono text-primary font-bold">{complaint.complaint.protocol}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-[10px] font-medium text-purple-600 dark:text-purple-400">
                        <span className="font-semibold uppercase tracking-wider text-[9px] bg-purple-500/15 px-1.5 py-0.5 rounded-full border border-purple-500/30">
                          OS Avulsa (Gestão)
                        </span>
                      </div>
                    )
                  )}
                </div>
                
                <div className="flex gap-2 items-center flex-wrap justify-end">
                  {complaint.photos && complaint.photos.length > 0 && (
                    <Button variant="outline" size="sm" className="h-7 px-3 rounded-full text-[10px] font-semibold shrink-0" onClick={() => setShowImage(true)}>
                      <ImageIcon size={12} className="mr-1.5" />
                      {complaint.photos.length > 1 ? `Fotos (${complaint.photos.length})` : 'Foto'}
                    </Button>
                  )}
                  
                  {user?.role !== 'cidadao' && (
                    <>
                      <Button onClick={handleViewDetails} className="h-7 px-3 rounded-full text-[10px] font-semibold bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 text-foreground shrink-0">
                        Detalhes
                      </Button>
                      
                      {complaint.serviceOrderProtocol && complaint.type !== 'OS' && (
                        <Button onClick={handleViewOS} className="h-7 px-3 rounded-full text-[10px] font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shrink-0">
                          Ver OS
                        </Button>
                      )}

                      {complaint.type === 'OS' && complaint.complaint?.protocol && (
                        <Button onClick={handleViewComplaint} className="h-7 px-3 rounded-full text-[10px] font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shrink-0">
                          Ver Denúncia
                        </Button>
                      )}
                    </>
                  )}
                  
                  {user?.role === 'cidadao' && user?.id === complaint.userId && complaint.type !== 'OS' && (
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      className="h-7 px-3 rounded-full text-[10px] font-semibold bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 text-foreground shrink-0"
                      onClick={handleEdit}
                    >
                      <Edit2 size={12} className="mr-1" /> Editar
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ImageGalleryModal
        isOpen={showImage}
        photos={complaint.photos || []}
        title={complaint.category || 'Fotos da Denúncia'}
        onClose={() => setShowImage(false)}
      />
    </>
  );
}
