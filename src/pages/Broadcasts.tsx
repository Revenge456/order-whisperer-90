import { useState, useRef, useCallback } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Plus, Upload, Send, Trash2, FileText, Image, File, Users, CheckCircle2, XCircle, Clock, Eye, X
} from "lucide-react";
import {
  useCampaigns, useCampaignContacts, useCampaignMedia,
  useCreateCampaign, useImportContacts, useUploadBroadcastMedia,
  useDeleteBroadcastMedia, useSendCampaign, useDeleteCampaign,
  type BroadcastCampaign,
} from "@/hooks/useBroadcast";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  draft: { label: "Borrador", variant: "secondary" },
  sending: { label: "Enviando", variant: "default" },
  completed: { label: "Completada", variant: "outline" },
  failed: { label: "Fallida", variant: "destructive" },
  cancelled: { label: "Cancelada", variant: "destructive" },
};

export default function Broadcasts() {
  const { data: campaigns, isLoading } = useCampaigns();
  const [selectedCampaign, setSelectedCampaign] = useState<BroadcastCampaign | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Campañas de Difusión</h1>
            <p className="text-muted-foreground text-sm mt-1">Envía mensajes masivos por WhatsApp vía n8n</p>
          </div>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="w-4 h-4 mr-2" />Nueva Campaña</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>Crear Campaña</DialogTitle></DialogHeader>
              <CreateCampaignForm onCreated={() => setCreateOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-40" />)}
          </div>
        ) : !campaigns?.length ? (
          <Card className="py-12">
            <CardContent className="flex flex-col items-center text-center">
              <Users className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">Sin campañas</p>
              <p className="text-muted-foreground text-sm">Crea tu primera campaña de difusión</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {campaigns.map((c) => (
              <CampaignCard key={c.id} campaign={c} onSelect={() => setSelectedCampaign(c)} />
            ))}
          </div>
        )}

        {selectedCampaign && (
          <CampaignDetail
            campaign={selectedCampaign}
            onClose={() => setSelectedCampaign(null)}
            onRefresh={(updated) => setSelectedCampaign(updated)}
          />
        )}
      </div>
    </DashboardLayout>
  );
}

function CampaignCard({ campaign: c, onSelect }: { campaign: BroadcastCampaign; onSelect: () => void }) {
  const deleteCampaign = useDeleteCampaign();
  const status = statusConfig[c.status] || statusConfig.draft;

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={onSelect}>
      <CardHeader className="pb-2 flex flex-row items-start justify-between">
        <div className="space-y-1 min-w-0 flex-1">
          <CardTitle className="text-base truncate">{c.name}</CardTitle>
          <p className="text-xs text-muted-foreground">
            {format(new Date(c.created_at), "dd MMM yyyy HH:mm", { locale: es })}
          </p>
        </div>
        <Badge variant={status.variant}>{status.label}</Badge>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{c.message || "Sin mensaje"}</p>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{c.total_contacts}</span>
          <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-green-500" />{c.sent_count}</span>
          <span className="flex items-center gap-1"><XCircle className="w-3.5 h-3.5 text-red-500" />{c.failed_count}</span>
        </div>
        <div className="flex justify-end mt-2">
          <Button
            size="sm" variant="ghost"
            onClick={(e) => { e.stopPropagation(); deleteCampaign.mutate(c.id); }}
          >
            <Trash2 className="w-4 h-4 text-destructive" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function CreateCampaignForm({ onCreated }: { onCreated: () => void }) {
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const createCampaign = useCreateCampaign();

  const handleSubmit = async () => {
    if (!name.trim()) return;
    await createCampaign.mutateAsync({ name: name.trim(), message: message.trim() });
    onCreated();
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium">Nombre de la campaña</label>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Promo Marzo 2026" />
      </div>
      <div>
        <label className="text-sm font-medium">Mensaje</label>
        <Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Escribe el mensaje que se enviará a todos los contactos..." rows={4} />
      </div>
      <Button onClick={handleSubmit} disabled={!name.trim() || createCampaign.isPending} className="w-full">
        {createCampaign.isPending ? "Creando..." : "Crear Campaña"}
      </Button>
    </div>
  );
}

function CampaignDetail({ campaign, onClose, onRefresh }: {
  campaign: BroadcastCampaign;
  onClose: () => void;
  onRefresh: (c: BroadcastCampaign) => void;
}) {
  const { data: contacts, isLoading: contactsLoading } = useCampaignContacts(campaign.id);
  const { data: media, isLoading: mediaLoading } = useCampaignMedia(campaign.id);
  const importContacts = useImportContacts();
  const uploadMedia = useUploadBroadcastMedia();
  const deleteMedia = useDeleteBroadcastMedia();
  const sendCampaign = useSendCampaign();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaInputRef = useRef<HTMLInputElement>(null);
  const [webhookUrl, setWebhookUrl] = useState(campaign.webhook_url || "");

  const handleCsvImport = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split("\n").filter(l => l.trim());
      if (lines.length < 2) { toast.error("CSV vacío"); return; }

      // Parse header
      const header = lines[0].toLowerCase().split(",").map(h => h.trim().replace(/"/g, ''));
      const phoneIdx = header.findIndex(h => ["phone", "telefono", "teléfono", "número", "numero", "whatsapp", "celular"].includes(h));
      const nameIdx = header.findIndex(h => ["name", "nombre", "cliente"].includes(h));

      if (phoneIdx === -1) {
        toast.error('CSV debe tener columna "phone", "telefono" o "numero"');
        return;
      }

      const parsed: { name?: string; phone: string }[] = [];
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(",").map(c => c.trim().replace(/"/g, ''));
        const phone = cols[phoneIdx]?.replace(/\s/g, '');
        if (!phone) continue;
        parsed.push({ phone, name: nameIdx >= 0 ? cols[nameIdx] : undefined });
      }

      if (!parsed.length) { toast.error("No se encontraron contactos válidos"); return; }

      importContacts.mutate({ campaignId: campaign.id, contacts: parsed });
    };
    reader.readAsText(file);
    e.target.value = "";
  }, [campaign.id, importContacts]);

  const handleMediaUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach(file => {
      uploadMedia.mutate({ campaignId: campaign.id, file });
    });
    e.target.value = "";
  }, [campaign.id, uploadMedia]);

  const handleSend = async () => {
    if (!webhookUrl.trim()) {
      toast.error("Ingresa la URL del webhook de n8n");
      return;
    }
    if (!contacts?.length) {
      toast.error("Importa contactos primero");
      return;
    }
    await sendCampaign.mutateAsync({ campaignId: campaign.id, webhookUrl: webhookUrl.trim() });
  };

  const isDraft = campaign.status === "draft";

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) return <Image className="w-4 h-4" />;
    if (type.includes("pdf")) return <FileText className="w-4 h-4" />;
    return <File className="w-4 h-4" />;
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {campaign.name}
            <Badge variant={statusConfig[campaign.status]?.variant || "secondary"}>
              {statusConfig[campaign.status]?.label || campaign.status}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6">
            {/* Message */}
            <div>
              <label className="text-sm font-medium">Mensaje</label>
              <div className="mt-1 p-3 bg-muted/50 rounded-lg text-sm whitespace-pre-wrap">
                {campaign.message || "Sin mensaje"}
              </div>
            </div>

            {/* Media */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">Archivos adjuntos ({media?.length || 0})</label>
                {isDraft && (
                  <>
                    <Button size="sm" variant="outline" onClick={() => mediaInputRef.current?.click()}>
                      <Upload className="w-4 h-4 mr-1" />Subir
                    </Button>
                    <input ref={mediaInputRef} type="file" multiple accept="image/*,.pdf,.doc,.docx" className="hidden" onChange={handleMediaUpload} />
                  </>
                )}
              </div>
              {mediaLoading ? <Skeleton className="h-16" /> : media?.length ? (
                <div className="space-y-2">
                  {media.map(m => (
                    <div key={m.id} className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-2 min-w-0">
                        {getFileIcon(m.file_type)}
                        <span className="text-sm truncate">{m.file_name}</span>
                        <span className="text-xs text-muted-foreground">{m.file_size ? `${(m.file_size / 1024).toFixed(0)}KB` : ''}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button size="sm" variant="ghost" asChild>
                          <a href={m.file_url} target="_blank" rel="noreferrer"><Eye className="w-4 h-4" /></a>
                        </Button>
                        {isDraft && (
                          <Button size="sm" variant="ghost" onClick={() => deleteMedia.mutate({ mediaId: m.id, campaignId: campaign.id })}>
                            <X className="w-4 h-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Sin archivos adjuntos</p>
              )}
            </div>

            {/* Contacts */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">Contactos ({contacts?.length || 0})</label>
                {isDraft && (
                  <>
                    <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()}>
                      <Upload className="w-4 h-4 mr-1" />Importar CSV
                    </Button>
                    <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleCsvImport} />
                  </>
                )}
              </div>
              {contactsLoading ? <Skeleton className="h-32" /> : contacts?.length ? (
                <div className="border rounded-lg overflow-hidden">
                  <ScrollArea className="max-h-60">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nombre</TableHead>
                          <TableHead>Teléfono</TableHead>
                          <TableHead>Estado</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {contacts.map(c => (
                          <TableRow key={c.id}>
                            <TableCell className="text-sm">{c.name || "—"}</TableCell>
                            <TableCell className="text-sm font-mono">{c.phone}</TableCell>
                            <TableCell>
                              {c.status === "sent" && <Badge variant="outline" className="text-green-600"><CheckCircle2 className="w-3 h-3 mr-1" />Enviado</Badge>}
                              {c.status === "failed" && (
                                <Badge variant="destructive" title={c.error_message || ''}>
                                  <XCircle className="w-3 h-3 mr-1" />Fallido
                                </Badge>
                              )}
                              {c.status === "pending" && <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pendiente</Badge>}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </div>
              ) : (
                <Card className="py-6"><CardContent className="text-center text-sm text-muted-foreground">
                  Importa un CSV con columnas "nombre" y "telefono"
                </CardContent></Card>
              )}
            </div>

            {/* Webhook & Send */}
            {isDraft && (
              <div className="space-y-3 border-t pt-4">
                <div>
                  <label className="text-sm font-medium">URL del Webhook n8n</label>
                  <Input
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    placeholder="https://n8n.tudominio.com/webhook/..."
                    className="mt-1"
                  />
                </div>
                <Button onClick={handleSend} disabled={sendCampaign.isPending} className="w-full">
                  <Send className="w-4 h-4 mr-2" />
                  {sendCampaign.isPending ? "Enviando..." : "Enviar Campaña"}
                </Button>
              </div>
            )}

            {/* Stats for non-draft */}
            {!isDraft && (
              <div className="grid grid-cols-3 gap-4 border-t pt-4">
                <div className="text-center">
                  <p className="text-2xl font-bold">{campaign.total_contacts}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{campaign.sent_count}</p>
                  <p className="text-xs text-muted-foreground">Enviados</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-600">{campaign.failed_count}</p>
                  <p className="text-xs text-muted-foreground">Fallidos</p>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

function toast_error(msg: string) {
  // Using sonner toast imported at hook level
}
