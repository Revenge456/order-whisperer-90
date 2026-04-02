import { useState, useRef, useCallback, useEffect } from "react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { supabase } from "@/integrations/supabase/client";
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
import { Progress } from "@/components/ui/progress";
import {
  Plus, Upload, Send, Trash2, FileText, Users, CheckCircle2, XCircle, Clock, X, Info, Loader2
} from "lucide-react";
import {
  useCampaigns, useCampaignContacts,
  useCreateCampaign, useImportContacts, useDeleteCampaign,
  type BroadcastCampaign,
} from "@/hooks/useBroadcast";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const AVAILABLE_VARIABLES = [
  { key: "{nombre}", desc: "Nombre del contacto" },
  { key: "{telefono}", desc: "Teléfono del contacto" },
  { key: "{tienda}", desc: "Tienda del contacto" },
];

const WEBHOOK_URL = "https://n8n.groupquimera.com/webhook/broadcast-campaign";

export default function Broadcasts() {
  const { data: campaigns, isLoading } = useCampaigns();
  const [selectedCampaign, setSelectedCampaign] = useState<BroadcastCampaign | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  // Poll for active campaigns
  const queryClient = useQueryClient();
  const hasActiveCampaigns = campaigns?.some(c => c.status === 'sending');

  useEffect(() => {
    if (!hasActiveCampaigns) return;
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ['broadcast-campaigns'] });
    }, 5000);
    return () => clearInterval(interval);
  }, [hasActiveCampaigns, queryClient]);

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
            <DialogContent className="max-w-lg max-h-[85vh] overflow-hidden flex flex-col p-0">
              <DialogHeader className="px-6 pt-6 pb-0">
                <DialogTitle>Crear Campaña</DialogTitle>
              </DialogHeader>
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
          />
        )}
      </div>
    </DashboardLayout>
  );
}

function CampaignProgressBar({ campaign }: { campaign: BroadcastCampaign }) {
  const total = campaign.total_contacts || 0;
  const sent = (campaign as any).sent_contacts || 0;
  const failed = (campaign as any).failed_contacts || 0;
  const processed = sent + failed;
  const percent = total > 0 ? Math.round((processed / total) * 100) : 0;

  if (campaign.status === 'completed') {
    return (
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
          <CheckCircle2 className="w-4 h-4" />
          Campaña completada ✓
        </div>
        <div className="flex gap-3 text-xs text-muted-foreground">
          <span className="text-green-600">{sent} enviados</span>
          {failed > 0 && <span className="text-destructive">{failed} fallidos</span>}
        </div>
        <Progress value={100} className="h-2" />
      </div>
    );
  }

  if (campaign.status === 'sending') {
    return (
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-sm font-medium text-primary">
          <Loader2 className="w-4 h-4 animate-spin" />
          Enviando: {processed} de {total} ({percent}%)
        </div>
        <Progress value={percent} className="h-2 [&>div]:transition-all [&>div]:duration-500" />
      </div>
    );
  }

  return null;
}

function CampaignCard({ campaign: c, onSelect }: { campaign: BroadcastCampaign; onSelect: () => void }) {
  const deleteCampaign = useDeleteCampaign();

  const getStatusBadge = () => {
    switch (c.status) {
      case 'sending':
        return <Badge className="bg-blue-500 text-white animate-pulse">Enviando</Badge>;
      case 'completed':
        return <Badge className="bg-green-500 text-white">Completada</Badge>;
      case 'failed':
        return <Badge variant="destructive">Fallida</Badge>;
      default:
        return <Badge variant="secondary">Borrador</Badge>;
    }
  };

  const total = c.total_contacts || 0;
  const sent = (c as any).sent_contacts || 0;
  const failed = (c as any).failed_contacts || 0;
  const processed = sent + failed;

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={onSelect}>
      <CardHeader className="pb-2 flex flex-row items-start justify-between">
        <div className="space-y-1 min-w-0 flex-1">
          <CardTitle className="text-base truncate">{c.campaign_name}</CardTitle>
          <p className="text-xs text-muted-foreground">
            {format(new Date(c.created_at), "dd MMM yyyy HH:mm", { locale: es })}
          </p>
        </div>
        {getStatusBadge()}
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
          {c.message || "Sin mensaje"}
        </p>
        {c.pdf_name && (
          <Badge variant="outline" className="text-xs mb-2">📄 {c.pdf_name}</Badge>
        )}

        {c.status === 'sending' && total > 0 && (
          <div className="mb-2">
            <div className="flex items-center gap-2 text-xs text-primary font-medium mb-1">
              <Loader2 className="w-3 h-3 animate-spin" />
              {processed}/{total} enviados
            </div>
            <Progress value={total > 0 ? (processed / total) * 100 : 0} className="h-1.5" />
          </div>
        )}

        {c.status !== 'sending' && (
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{total}</span>
            <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-green-500" />{sent}</span>
            {failed > 0 && (
              <span className="flex items-center gap-1"><XCircle className="w-3.5 h-3.5 text-destructive" />{failed}</span>
            )}
          </div>
        )}

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
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [contactsFile, setContactsFile] = useState<File | null>(null);
  const [parsedContacts, setParsedContacts] = useState<{ name?: string; phone: string; store?: string }[]>([]);
  const createCampaign = useCreateCampaign();
  const importContacts = useImportContacts();
  const contactsInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  const handleContactsFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setContactsFile(file);
    const ext = file.name.split('.').pop()?.toLowerCase();

    const parseRows = (rows: string[][]) => {
      if (rows.length < 2) { toast.error("Archivo vacío"); return; }
      const header = rows[0].map(h => h.toLowerCase().trim());
      const phoneIdx = header.findIndex(h => ["phone", "telefono", "teléfono", "número", "numero", "whatsapp", "celular"].includes(h));
      const nameIdx = header.findIndex(h => ["name", "nombre", "cliente"].includes(h));
      const storeIdx = header.findIndex(h => ["store", "tienda", "sucursal", "local"].includes(h));
      if (phoneIdx === -1) {
        toast.error('Debe tener columna "phone", "telefono" o "numero"');
        return;
      }
      const parsed: { name?: string; phone: string; store?: string }[] = [];
      for (let i = 1; i < rows.length; i++) {
        const phone = rows[i][phoneIdx]?.toString().replace(/\s/g, '');
        if (!phone) continue;
        parsed.push({
          phone,
          name: nameIdx >= 0 ? rows[i][nameIdx]?.toString() : undefined,
          store: storeIdx >= 0 ? rows[i][storeIdx]?.toString() : undefined,
        });
      }
      if (!parsed.length) { toast.error("No se encontraron contactos válidos"); return; }
      setParsedContacts(parsed);
      toast.success(`${parsed.length} contactos encontrados`);
    };

    if (ext === 'csv') {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        const rows = text.split("\n").filter(l => l.trim()).map(l => l.split(",").map(c => c.trim().replace(/"/g, '')));
        parseRows(rows);
      };
      reader.readAsText(file);
    } else if (ext === 'xlsx' || ext === 'xls') {
      const reader = new FileReader();
      reader.onload = (event) => {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows: string[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        parseRows(rows);
      };
      reader.readAsArrayBuffer(file);
    } else {
      toast.error("Formato no soportado. Usa CSV o Excel (.xlsx)");
    }
    e.target.value = "";
  }, []);

  const handlePdfFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.includes("pdf")) {
      toast.error("Solo se permiten archivos PDF");
      return;
    }
    setPdfFile(file);
    e.target.value = "";
  }, []);

  const handleSubmit = async () => {
    if (!name.trim()) return;
    if (!message.trim()) {
      toast.error("Escribe un mensaje");
      return;
    }
    if (!parsedContacts.length) {
      toast.error("Importa contactos primero");
      return;
    }

    try {
      // 1. Upload PDF if applicable
      let pdfUrl: string | null = null;
      let pdfName: string | null = null;
      if (pdfFile) {
        const safeName = pdfFile.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9._-]/g, "_");
        const filePath = `broadcasts/${Date.now()}_${safeName}`;
        const { error: uploadError } = await supabase.storage
          .from('broadcast-media')
          .upload(filePath, pdfFile);
        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('broadcast-media')
          .getPublicUrl(filePath);
        pdfUrl = urlData.publicUrl;
        pdfName = pdfFile.name;
      }

      // 2. Create campaign in DB with all data
      const campaign = await createCampaign.mutateAsync({
        campaign_name: name.trim(),
        content_type: pdfFile ? 'text_and_pdf' : 'text',
        message: message.trim(),
        pdf_url: pdfUrl || undefined,
        pdf_name: pdfName || undefined,
      });

      // 3. Import contacts to DB (each with status="pending")
      await importContacts.mutateAsync({ campaignId: campaign.id, contacts: parsedContacts });

      // 4. Update campaign status to "sending"
      await supabase
        .from('broadcast_campaigns')
        .update({ status: 'sending', total_contacts: parsedContacts.length })
        .eq('id', campaign.id);

      // 5. Trigger n8n webhook with ONLY campaign_id
      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaign_id: campaign.id }),
      });

      if (!response.ok) {
        console.warn('Webhook response not ok:', response.status);
      }

      toast.success(`Campaña enviada (${parsedContacts.length} contactos)`);
      onCreated();
    } catch (err) {
      toast.error('Error: ' + (err instanceof Error ? err.message : 'Error desconocido'));
    }
  };

  const isSubmitting = createCampaign.isPending || importContacts.isPending;

  return (
    <ScrollArea className="max-h-[calc(85vh-5rem)] px-6 pb-6">
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium">Nombre de la campaña</label>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Promo Marzo 2026" />
      </div>

      {/* Text Message */}
      <div>
        <label className="text-sm font-medium">Mensaje</label>
        <Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Hola {nombre}, te escribimos para..." rows={4} />
        <div className="mt-2 p-2 bg-muted/50 rounded-md">
          <p className="text-xs font-medium text-muted-foreground flex items-center gap-1 mb-1">
            <Info className="w-3 h-3" /> Variables disponibles (se reemplazan por contacto):
          </p>
          <div className="flex flex-wrap gap-1">
            {AVAILABLE_VARIABLES.map(v => (
              <button
                key={v.key}
                type="button"
                className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                onClick={() => setMessage(prev => prev + v.key)}
              >
                {v.key} <span className="text-muted-foreground">— {v.desc}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Optional PDF Upload */}
      <div>
        <label className="text-sm font-medium">Adjuntar archivo PDF (opcional)</label>
        <div className="mt-1">
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="w-full"
            onClick={() => pdfInputRef.current?.click()}
          >
            <Upload className="w-4 h-4 mr-2" />
            {pdfFile ? pdfFile.name : "Seleccionar archivo PDF"}
          </Button>
          <input ref={pdfInputRef} type="file" accept=".pdf" className="hidden" onChange={handlePdfFile} />
        </div>
        {pdfFile && (
          <div className="mt-2 flex items-center justify-between p-2 bg-muted/30 rounded text-sm">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              <span className="truncate">{pdfFile.name}</span>
              <span className="text-xs text-muted-foreground">{(pdfFile.size / 1024).toFixed(0)}KB</span>
            </div>
            <Button size="sm" variant="ghost" onClick={() => setPdfFile(null)}>
              <X className="w-4 h-4 text-destructive" />
            </Button>
          </div>
        )}
      </div>

      {/* Excel/CSV Import */}
      <div>
        <label className="text-sm font-medium">Contactos (Excel o CSV)</label>
        <div className="mt-1">
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="w-full"
            onClick={() => contactsInputRef.current?.click()}
          >
            <Upload className="w-4 h-4 mr-2" />
            {contactsFile ? contactsFile.name : "Subir archivo de contactos (.xlsx, .csv)"}
          </Button>
          <input ref={contactsInputRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={handleContactsFile} />
        </div>
        {parsedContacts.length > 0 && (
          <div className="mt-2 flex items-center gap-2 text-sm text-green-600">
            <CheckCircle2 className="w-4 h-4" />
            <span>{parsedContacts.length} contactos listos para importar</span>
          </div>
        )}
      </div>

      <Button onClick={handleSubmit} disabled={!name.trim() || isSubmitting} className="w-full">
        {isSubmitting ? "Creando y enviando..." : "Crear Campaña y Enviar"}
      </Button>
    </div>
    </ScrollArea>
  );
}

function CampaignDetail({ campaign, onClose }: {
  campaign: BroadcastCampaign;
  onClose: () => void;
}) {
  const { data: contacts, isLoading: contactsLoading } = useCampaignContacts(campaign.id);
  const queryClient = useQueryClient();

  // Poll when sending
  useEffect(() => {
    if (campaign.status !== 'sending') return;
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ['broadcast-campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['broadcast-contacts', campaign.id] });
    }, 5000);
    return () => clearInterval(interval);
  }, [campaign.status, campaign.id, queryClient]);

  const sent = (campaign as any).sent_contacts || 0;
  const failed = (campaign as any).failed_contacts || 0;
  const total = campaign.total_contacts || 0;
  const successRate = total > 0 ? Math.round((sent / total) * 100) : 0;

  const sentContacts = contacts?.filter(c => c.status === 'sent') || [];
  const failedContacts = contacts?.filter(c => c.status === 'failed') || [];
  const pendingContacts = contacts?.filter(c => c.status === 'pending') || [];

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col p-0">
        {/* Fixed Header */}
        <div className="px-6 pt-6 pb-4 border-b space-y-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {campaign.campaign_name}
              {campaign.status === 'sending' && <Badge className="bg-blue-500 text-white animate-pulse">Enviando</Badge>}
              {campaign.status === 'completed' && <Badge className="bg-green-500 text-white">Completada</Badge>}
              {campaign.status === 'failed' && <Badge variant="destructive">Fallida</Badge>}
              {campaign.status === 'pending' && <Badge variant="secondary">Borrador</Badge>}
            </DialogTitle>
          </DialogHeader>

          {/* Stats bar - always visible */}
          <div className="grid grid-cols-4 gap-3">
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <p className="text-xl font-bold">{total}</p>
              <p className="text-[11px] text-muted-foreground">Total</p>
            </div>
            <div className="bg-green-500/10 rounded-lg p-3 text-center">
              <p className="text-xl font-bold text-green-600">{sent}</p>
              <p className="text-[11px] text-muted-foreground">Enviados</p>
            </div>
            <div className="bg-destructive/10 rounded-lg p-3 text-center">
              <p className="text-xl font-bold text-destructive">{failed}</p>
              <p className="text-[11px] text-muted-foreground">Fallidos</p>
            </div>
            <div className="bg-primary/10 rounded-lg p-3 text-center">
              <p className="text-xl font-bold text-primary">{successRate}%</p>
              <p className="text-[11px] text-muted-foreground">Tasa éxito</p>
            </div>
          </div>

          {/* Progress bar */}
          <CampaignProgressBar campaign={campaign} />
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {/* Message - collapsible summary */}
          <details className="group">
            <summary className="text-sm font-medium cursor-pointer flex items-center gap-1 select-none">
              <span className="group-open:rotate-90 transition-transform">▶</span> Mensaje
            </summary>
            <div className="mt-2 p-3 bg-muted/50 rounded-lg text-sm whitespace-pre-wrap max-h-40 overflow-y-auto">
              {campaign.message || "Sin mensaje"}
            </div>
          </details>

          {/* PDF if attached */}
          {campaign.pdf_name && (
            <div className="p-2 bg-muted/30 rounded-lg text-sm flex items-center gap-2">
              <FileText className="w-4 h-4 shrink-0" />
              <span className="truncate">{campaign.pdf_name}</span>
              {campaign.pdf_url && (
                <a href={campaign.pdf_url} target="_blank" rel="noreferrer" className="text-primary underline text-xs ml-auto shrink-0">
                  Ver PDF
                </a>
              )}
            </div>
          )}

          {/* Contacts Table - takes remaining space */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium">Contactos ({contacts?.length || 0})</label>
              {contacts && contacts.length > 0 && (
                <div className="flex gap-2 text-xs">
                  <span className="text-green-600">{sentContacts.length} enviados</span>
                  {failedContacts.length > 0 && <span className="text-destructive">{failedContacts.length} fallidos</span>}
                  {pendingContacts.length > 0 && <span className="text-muted-foreground">{pendingContacts.length} pendientes</span>}
                </div>
              )}
            </div>
            {contactsLoading ? <Skeleton className="h-32" /> : contacts?.length ? (
              <div className="border rounded-lg overflow-hidden">
                <div className="max-h-[40vh] overflow-y-auto">
                  <Table>
                    <TableHeader className="sticky top-0 bg-background z-10">
                      <TableRow>
                        <TableHead className="w-[30%]">Nombre</TableHead>
                        <TableHead className="w-[25%]">Teléfono</TableHead>
                        <TableHead className="w-[20%]">Tienda</TableHead>
                        <TableHead className="w-[25%]">Estado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {contacts.map(c => (
                        <TableRow key={c.id}>
                          <TableCell className="text-sm py-2">{c.name || "—"}</TableCell>
                          <TableCell className="text-sm font-mono py-2">{c.phone}</TableCell>
                          <TableCell className="text-sm py-2">{c.store || "—"}</TableCell>
                          <TableCell className="py-2">
                            {c.status === "sent" && <Badge variant="outline" className="text-green-600 text-xs"><CheckCircle2 className="w-3 h-3 mr-1" />Enviado</Badge>}
                            {c.status === "failed" && <Badge variant="destructive" className="text-xs"><XCircle className="w-3 h-3 mr-1" />Fallido</Badge>}
                            {c.status === "pending" && <Badge variant="secondary" className="text-xs"><Clock className="w-3 h-3 mr-1" />Pendiente</Badge>}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            ) : (
              <Card className="py-6"><CardContent className="text-center text-sm text-muted-foreground">
                Sin contactos
              </CardContent></Card>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
