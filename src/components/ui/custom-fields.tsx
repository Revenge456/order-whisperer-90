import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, X, Pencil, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface CustomFieldsManagerProps {
  fields: Record<string, string | number | boolean>;
  onChange: (fields: Record<string, string | number | boolean>) => void;
  readOnly?: boolean;
}

export function CustomFieldsManager({
  fields,
  onChange,
  readOnly = false,
}: CustomFieldsManagerProps) {
  const [isAddingField, setIsAddingField] = useState(false);
  const [newFieldName, setNewFieldName] = useState("");
  const [newFieldValue, setNewFieldValue] = useState("");
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const handleAddField = () => {
    if (newFieldName.trim() && newFieldValue.trim()) {
      const key = newFieldName.trim().toLowerCase().replace(/\s+/g, "_");
      onChange({
        ...fields,
        [key]: newFieldValue.trim(),
      });
      setNewFieldName("");
      setNewFieldValue("");
      setIsAddingField(false);
    }
  };

  const handleRemoveField = (key: string) => {
    const newFields = { ...fields };
    delete newFields[key];
    onChange(newFields);
  };

  const handleEditField = (key: string) => {
    setEditingField(key);
    setEditValue(String(fields[key]));
  };

  const handleSaveEdit = (key: string) => {
    onChange({
      ...fields,
      [key]: editValue.trim(),
    });
    setEditingField(null);
    setEditValue("");
  };

  const formatFieldName = (key: string) => {
    return key
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const fieldEntries = Object.entries(fields);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium text-muted-foreground">
          Campos Personalizados
        </Label>
        {!readOnly && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsAddingField(true)}
            className="h-7 text-xs gap-1 border-border"
          >
            <Plus className="w-3 h-3" />
            Agregar Campo
          </Button>
        )}
      </div>

      {fieldEntries.length === 0 ? (
        <p className="text-sm text-muted-foreground italic">
          No hay campos personalizados
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {fieldEntries.map(([key, value]) => (
            <div
              key={key}
              className="flex items-center gap-1 bg-secondary/50 rounded-lg px-2 py-1 text-sm"
            >
              <span className="text-muted-foreground">{formatFieldName(key)}:</span>
              {editingField === key ? (
                <>
                  <Input
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="h-6 w-24 text-xs bg-input border-border"
                    autoFocus
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5"
                    onClick={() => handleSaveEdit(key)}
                  >
                    <Check className="w-3 h-3 text-success" />
                  </Button>
                </>
              ) : (
                <>
                  <span className="font-medium text-foreground">{String(value)}</span>
                  {!readOnly && (
                    <>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5"
                        onClick={() => handleEditField(key)}
                      >
                        <Pencil className="w-3 h-3 text-muted-foreground" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5"
                        onClick={() => handleRemoveField(key)}
                      >
                        <X className="w-3 h-3 text-destructive" />
                      </Button>
                    </>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      )}

      <Dialog open={isAddingField} onOpenChange={setIsAddingField}>
        <DialogContent className="sm:max-w-[400px] bg-card border-border">
          <DialogHeader>
            <DialogTitle>Agregar Campo Personalizado</DialogTitle>
            <DialogDescription>
              Crea un nuevo campo para almacenar información adicional
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="fieldName">Nombre del Campo</Label>
              <Input
                id="fieldName"
                value={newFieldName}
                onChange={(e) => setNewFieldName(e.target.value)}
                placeholder="Ej: Talla, Fecha Cumpleaños, etc."
                className="bg-input border-border"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="fieldValue">Valor</Label>
              <Input
                id="fieldValue"
                value={newFieldValue}
                onChange={(e) => setNewFieldValue(e.target.value)}
                placeholder="Ej: M, 15/05/1990, etc."
                className="bg-input border-border"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAddingField(false)}
              className="border-border"
            >
              Cancelar
            </Button>
            <Button type="button" onClick={handleAddField}>
              Agregar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Display-only version for tables
interface CustomFieldsBadgesProps {
  fields: Record<string, string | number | boolean>;
}

export function CustomFieldsBadges({ fields }: CustomFieldsBadgesProps) {
  const entries = Object.entries(fields);
  
  if (entries.length === 0) return null;

  const formatFieldName = (key: string) => {
    return key
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <div className="flex flex-wrap gap-1">
      {entries.slice(0, 3).map(([key, value]) => (
        <Badge
          key={key}
          variant="outline"
          className="text-xs bg-secondary/30 border-border/50"
        >
          {formatFieldName(key)}: {String(value)}
        </Badge>
      ))}
      {entries.length > 3 && (
        <Badge variant="outline" className="text-xs bg-muted border-border/50">
          +{entries.length - 3} más
        </Badge>
      )}
    </div>
  );
}
