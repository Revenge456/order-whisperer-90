import { Bot, User, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useAIAgentSettings, useUpdateSystemSetting } from '@/hooks/useSystemSettings';
import { useIsAdmin } from '@/hooks/useAuth';
import type { Json } from '@/integrations/supabase/types';

export function AIAgentConfig() {
  const { data: settings, isLoading } = useAIAgentSettings();
  const updateSetting = useUpdateSystemSetting();
  const isAdmin = useIsAdmin();

  const handleToggle = async (field: 'enabled' | 'default_for_new_customers', value: boolean) => {
    if (!settings) return;
    
    const newSettings = {
      ...settings,
      [field]: value,
    };

    await updateSetting.mutateAsync({
      key: 'ai_agent_mode',
      value: newSettings as unknown as Json,
    });
  };

  if (isLoading) {
    return (
      <Card className="glass border-border/50">
        <CardContent className="pt-6 flex justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-primary" />
          Modo AI Agent
        </CardTitle>
        <CardDescription>
          Configura el comportamiento del agente de inteligencia artificial
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Global toggle */}
        <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 border border-border/50">
          <div className="space-y-1">
            <Label htmlFor="ai-enabled" className="text-base font-medium">
              AI Agent Global
            </Label>
            <p className="text-sm text-muted-foreground">
              {settings?.enabled 
                ? 'El AI Agent está activo para atender clientes automáticamente'
                : 'Atención 100% manual por operadores humanos'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge 
              variant="outline" 
              className={settings?.enabled 
                ? 'bg-primary/10 text-primary border-primary/30'
                : 'bg-muted text-muted-foreground'
              }
            >
              {settings?.enabled ? (
                <><Bot className="w-3 h-3 mr-1" /> Activo</>
              ) : (
                <><User className="w-3 h-3 mr-1" /> Inactivo</>
              )}
            </Badge>
            <Switch
              id="ai-enabled"
              checked={settings?.enabled ?? true}
              onCheckedChange={(checked) => handleToggle('enabled', checked)}
              disabled={!isAdmin || updateSetting.isPending}
            />
          </div>
        </div>

        {/* Default for new customers */}
        <div className="flex items-center justify-between p-4 rounded-lg border border-border/50">
          <div className="space-y-1">
            <Label htmlFor="ai-default" className="text-base font-medium">
              Por defecto en nuevos clientes
            </Label>
            <p className="text-sm text-muted-foreground">
              Los nuevos clientes serán atendidos por el AI Agent automáticamente
            </p>
          </div>
          <Switch
            id="ai-default"
            checked={settings?.default_for_new_customers ?? true}
            onCheckedChange={(checked) => handleToggle('default_for_new_customers', checked)}
            disabled={!isAdmin || updateSetting.isPending || !settings?.enabled}
          />
        </div>

        {/* Info about per-customer override */}
        <div className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg">
          <p>
            💡 <strong>Nota:</strong> Puedes cambiar el modo AI individualmente para cada cliente 
            desde su ficha de detalle, independientemente de esta configuración global.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
