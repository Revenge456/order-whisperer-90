import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';

interface Props {
  value: string[];
  onChange: (v: string[]) => void;
}

export function SucursalAliasesInput({ value, onChange }: Props) {
  const [input, setInput] = useState('');

  const add = () => {
    const trimmed = input.trim().toLowerCase();
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed]);
    }
    setInput('');
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {value.map((alias) => (
          <Badge key={alias} variant="secondary" className="gap-1 text-xs">
            {alias}
            <X
              className="h-3 w-3 cursor-pointer"
              onClick={() => onChange(value.filter((a) => a !== alias))}
            />
          </Badge>
        ))}
      </div>
      <Input
        placeholder="Escribí un alias y presioná Enter"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            add();
          }
        }}
      />
    </div>
  );
}
