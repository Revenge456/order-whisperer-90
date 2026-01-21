import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface TeamMember {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'operator' | 'viewer' | null;
  is_active: boolean | null;
  last_login: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface CreateTeamMemberData {
  email: string;
  full_name: string;
  role: 'admin' | 'operator' | 'viewer';
}

export interface UpdateTeamMemberData {
  id: string;
  email?: string;
  full_name?: string;
  role?: 'admin' | 'operator' | 'viewer';
  is_active?: boolean;
}

export function useTeam() {
  const queryClient = useQueryClient();

  const { data: teamMembers = [], isLoading, error } = useQuery({
    queryKey: ["team"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as TeamMember[];
    },
  });

  const createMember = useMutation({
    mutationFn: async (memberData: CreateTeamMemberData) => {
      const { data, error } = await supabase
        .from("users")
        .insert({
          email: memberData.email,
          full_name: memberData.full_name,
          role: memberData.role,
          is_active: true,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team"] });
      toast.success("Miembro del equipo creado exitosamente");
    },
    onError: (error) => {
      console.error("Error creating team member:", error);
      toast.error("Error al crear miembro del equipo");
    },
  });

  const updateMember = useMutation({
    mutationFn: async (memberData: UpdateTeamMemberData) => {
      const { id, ...updateData } = memberData;
      const { data, error } = await supabase
        .from("users")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team"] });
      toast.success("Miembro actualizado exitosamente");
    },
    onError: (error) => {
      console.error("Error updating team member:", error);
      toast.error("Error al actualizar miembro");
    },
  });

  const deleteMember = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("users")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team"] });
      toast.success("Miembro eliminado exitosamente");
    },
    onError: (error) => {
      console.error("Error deleting team member:", error);
      toast.error("Error al eliminar miembro");
    },
  });

  return {
    teamMembers,
    isLoading,
    error,
    createMember,
    updateMember,
    deleteMember,
  };
}
