import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, X, Pencil, Check, Columns3, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

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

  const handleKeyDown = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === "Enter") {
      e.preventDefault();
      action();
    }
  };

  const formatFieldName = (key: string) => {
    return key
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const fieldEntries = Object.entries(fields);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Columns3 className="w-4 h-4 text-muted-foreground" />
          <Label className="text-sm font-medium">Campos Personalizados</Label>
          <Badge variant="outline" className="text-xs">
            {fieldEntries.length} campo{fieldEntries.length !== 1 ? 's' : ''}
          </Badge>
        </div>
        {!readOnly && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsAddingField(true)}
            className="h-8 text-xs gap-1.5 border-dashed border-primary/50 text-primary hover:bg-primary/10"
          >
            <Plus className="w-3.5 h-3.5" />
            Agregar Columna
          </Button>
        )}
      </div>

      {fieldEntries.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border/60 p-6 text-center">
          <Columns3 className="w-8 h-8 mx-auto text-muted-foreground/50 mb-2" />
          <p className="text-sm text-muted-foreground">
            No hay columnas personalizadas
          </p>
          {!readOnly && (
            <Button
              type="button"
              variant="link"
              size="sm"
              onClick={() => setIsAddingField(true)}
              className="mt-2 text-primary"
            >
              + Agregar tu primera columna
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-2">
          {fieldEntries.map(([key, value]) => (
            <div
              key={key}
              className="group flex items-center gap-3 rounded-lg border border-border/50 bg-secondary/20 px-3 py-2 transition-colors hover:border-border hover:bg-secondary/30"
            >
              <span className="text-sm font-medium text-muted-foreground min-w-[100px]">
                {formatFieldName(key)}
              </span>
              
              {editingField === key ? (
                <div className="flex items-center gap-2 flex-1">
                  <Input
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, () => handleSaveEdit(key))}
                    className="h-7 text-sm bg-input border-border flex-1"
                    autoFocus
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-success hover:text-success hover:bg-success/10"
                    onClick={() => handleSaveEdit(key)}
                  >
                    <Check className="w-4 h-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-foreground"
                    onClick={() => setEditingField(null)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <>
                  <span className="text-sm text-foreground flex-1">
                    {String(value)}
                  </span>
                  {!readOnly && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-secondary"
                        onClick={() => handleEditField(key)}
                        title="Editar valor"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            title="Eliminar columna"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-56 p-3" align="end">
                          <p className="text-sm mb-3">
                            ¿Eliminar columna "{formatFieldName(key)}"?
                          </p>
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              className="flex-1"
                              onClick={() => handleRemoveField(key)}
                            >
                              Eliminar
                            </Button>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
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
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-primary" />
              Nueva Columna
            </DialogTitle>
            <DialogDescription>
              Agrega una columna personalizada (como en Notion)
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="fieldName">Nombre de la Columna</Label>
              <Input
                id="fieldName"
                value={newFieldName}
                onChange={(e) => setNewFieldName(e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, handleAddField)}
                placeholder="Ej: Talla, CI, Fecha Cumpleaños..."
                className="bg-input border-border"
                autoFocus
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="fieldValue">Valor</Label>
              <Input
                id="fieldValue"
                value={newFieldValue}
                onChange={(e) => setNewFieldValue(e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, handleAddField)}
                placeholder="Ej: M, 12345678, 15/05/1990..."
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
            <Button 
              type="button" 
              onClick={handleAddField}
              disabled={!newFieldName.trim() || !newFieldValue.trim()}
            >
              <Plus className="w-4 h-4 mr-2" />
              Agregar Columna
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Compact display for tables
interface CustomFieldsBadgesProps {
  fields: Record<string, string | number | boolean> | null | undefined;
  maxVisible?: number;
}

export function CustomFieldsBadges({ fields, maxVisible = 3 }: CustomFieldsBadgesProps) {
  if (!fields) return null;
  
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
      {entries.slice(0, maxVisible).map(([key, value]) => (
        <Badge
          key={key}
          variant="outline"
          className="text-xs font-normal bg-primary/5 border-primary/20 text-foreground"
        >
          <span className="text-muted-foreground mr-1">{formatFieldName(key)}:</span>
          {String(value)}
        </Badge>
      ))}
      {entries.length > maxVisible && (
        <Badge variant="outline" className="text-xs bg-muted/50 border-border/50 text-muted-foreground">
          +{entries.length - maxVisible}
        </Badge>
      )}
    </div>
  );
}
