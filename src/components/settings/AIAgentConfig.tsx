import { Bot, CheckCircle, User } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function AIAgentConfig() {
  return (
    <Card className="glass border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-primary" />
          Modo AI Agent
        </CardTitle>
        <CardDescription>
          Estado del agente de inteligencia artificial
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Always Active Status */}
        <div className="flex items-center justify-between p-4 rounded-lg bg-primary/10 border border-primary/30">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-primary" />
              <span className="text-base font-medium text-foreground">
                AI Agent Activo
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              El AI Agent está permanentemente activo para atender clientes automáticamente
            </p>
          </div>
          <Badge 
            variant="outline" 
            className="bg-primary/10 text-primary border-primary/30"
          >
            <Bot className="w-3 h-3 mr-1" /> Siempre Activo
          </Badge>
        </div>

        {/* Per-customer override info */}
        <div className="flex items-center justify-between p-4 rounded-lg border border-border/50">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-muted-foreground" />
              <span className="text-base font-medium text-foreground">
                Control por Cliente
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Puedes cambiar el modo a atención manual para clientes específicos desde su ficha
            </p>
          </div>
          <Badge variant="outline" className="bg-muted text-muted-foreground">
            Configurable
          </Badge>
        </div>

        {/* Info about the system */}
        <div className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg">
          <p>
            💡 <strong>Nota:</strong> El Modo AI Agent está siempre activo a nivel global. 
            Para clientes que requieran atención especial, puedes cambiar su modo a "Manual" 
            desde la ficha del cliente individual.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
