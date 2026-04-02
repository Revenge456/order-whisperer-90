import { useState, useRef, useCallback } from "react";
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
import {
  Plus, Upload, Send, Trash2, FileText, Users, CheckCircle2, XCircle, Clock, X, Info
} from "lucide-react";
import {
  useCampaigns, useCampaignContacts,
  useCreateCampaign, useImportContacts, useDeleteCampaign,
  type BroadcastCampaign,
} from "@/hooks/useBroadcast";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const AVAILABLE_VARIABLES = [
  { key: "{nombre}", desc: "Nombre del contacto" },
  { key: "{telefono}", desc: "Teléfono del contacto" },
  { key: "{tienda}", desc: "Tienda del contacto" },
];

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Pendiente", variant: "secondary" },
  sending: { label: "Enviando", variant: "default" },
  completed: { label: "Completada", variant: "outline" },
  failed: { label: "Fallida", variant: "destructive" },
};

const DEFAULT_WEBHOOK_URL = "https://n8n.groupquimera.com/webhook-test/broadcast-campaign";

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
          />
        )}
      </div>
    </DashboardLayout>
  );
}

function CampaignCard({ campaign: c, onSelect }: { campaign: BroadcastCampaign; onSelect: () => void }) {
  const deleteCampaign = useDeleteCampaign();
  const status = statusConfig[c.status] || statusConfig.pending;

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={onSelect}>
      <CardHeader className="pb-2 flex flex-row items-start justify-between">
        <div className="space-y-1 min-w-0 flex-1">
          <CardTitle className="text-base truncate">{c.campaign_name}</CardTitle>
          <p className="text-xs text-muted-foreground">
            {format(new Date(c.created_at), "dd MMM yyyy HH:mm", { locale: es })}
          </p>
        </div>
        <Badge variant={status.variant}>{status.label}</Badge>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
          {c.message || "Sin mensaje"}
        </p>
        {c.pdf_name && (
          <Badge variant="outline" className="text-xs mb-2">📄 {c.pdf_name}</Badge>
        )}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{c.total_contacts}</span>
          <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-green-500" />{c.sent_count}</span>
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
        const filePath = `broadcasts/${Date.now()}_${pdfFile.name}`;
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

      // 2. Create campaign in DB
      const campaign = await createCampaign.mutateAsync({
        campaign_name: name.trim(),
        content_type: 'text',
        message: message.trim(),
        pdf_url: pdfUrl || undefined,
        pdf_name: pdfName || undefined,
      });

      // 3. Import contacts to DB
      await importContacts.mutateAsync({ campaignId: campaign.id, contacts: parsedContacts });

      // 4. Update campaign status to sending
      await supabase
        .from('broadcast_campaigns')
        .update({ status: 'sending' })
        .eq('id', campaign.id);

      // 5. Trigger n8n webhook with ALL data
      const webhookPayload = {
        campaign_id: campaign.id,
        campaign_name: name.trim(),
        content_type: 'text',
        message: message.trim(),
        pdf_url: pdfUrl,
        pdf_name: pdfName,
        contacts: parsedContacts.map(c => ({
          phone: c.phone,
          name: c.name || null,
          store: c.store || null,
        })),
        total_contacts: parsedContacts.length,
      };

      await fetch(DEFAULT_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        mode: 'no-cors',
        body: JSON.stringify(webhookPayload),
      });

      toast.success(`Campaña creada y enviada a n8n (${parsedContacts.length} contactos)`);
      onCreated();
    } catch (err) {
      toast.error('Error: ' + (err instanceof Error ? err.message : 'Error desconocido'));
    }
  };

  const isSubmitting = createCampaign.isPending || importContacts.isPending;

  return (
    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
      <div>
        <label className="text-sm font-medium">Nombre de la campaña</label>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Promo Marzo 2026" />
      </div>

      {/* Text Message - Always visible */}
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
  );
}

function CampaignDetail({ campaign, onClose }: {
  campaign: BroadcastCampaign;
  onClose: () => void;
}) {
  const { data: contacts, isLoading: contactsLoading } = useCampaignContacts(campaign.id);

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {campaign.campaign_name}
            <Badge variant={statusConfig[campaign.status]?.variant || "secondary"}>
              {statusConfig[campaign.status]?.label || campaign.status}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6">
            {/* Content */}
            <div>
              <label className="text-sm font-medium">
                {campaign.content_type === "text" ? "Mensaje" : "Documento PDF"}
              </label>
              <div className="mt-1 p-3 bg-muted/50 rounded-lg text-sm whitespace-pre-wrap">
                {campaign.content_type === "text"
                  ? (campaign.message || "Sin mensaje")
                  : (
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      <span>{campaign.pdf_name || "PDF"}</span>
                      {campaign.pdf_url && (
                        <a href={campaign.pdf_url} target="_blank" rel="noreferrer" className="text-primary underline text-xs">
                          Ver PDF
                        </a>
                      )}
                    </div>
                  )}
              </div>
            </div>

            {/* Contacts */}
            <div>
              <label className="text-sm font-medium">Contactos ({contacts?.length || 0})</label>
              {contactsLoading ? <Skeleton className="h-32 mt-2" /> : contacts?.length ? (
                <div className="border rounded-lg overflow-hidden max-h-72 overflow-y-auto mt-2">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Teléfono</TableHead>
                        <TableHead>Tienda</TableHead>
                        <TableHead>Estado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {contacts.map(c => (
                        <TableRow key={c.id}>
                          <TableCell className="text-sm">{c.name || "—"}</TableCell>
                          <TableCell className="text-sm font-mono">{c.phone}</TableCell>
                          <TableCell className="text-sm">{c.store || "—"}</TableCell>
                          <TableCell>
                            {c.status === "sent" && <Badge variant="outline" className="text-green-600"><CheckCircle2 className="w-3 h-3 mr-1" />Enviado</Badge>}
                            {c.status === "failed" && <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Fallido</Badge>}
                            {c.status === "pending" && <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pendiente</Badge>}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <Card className="py-6 mt-2"><CardContent className="text-center text-sm text-muted-foreground">
                  Sin contactos
                </CardContent></Card>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 border-t pt-4">
              <div className="text-center">
                <p className="text-2xl font-bold">{campaign.total_contacts}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{campaign.sent_count}</p>
                <p className="text-xs text-muted-foreground">Enviados</p>
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
