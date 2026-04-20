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

const BATCH_SIZE = 1000;

/** Full team list (used for stats). Batched. */
export function useTeam() {
  const queryClient = useQueryClient();

  const { data: teamMembers = [], isLoading, error } = useQuery({
    queryKey: ["team"],
    queryFn: async () => {
      const all: TeamMember[] = [];
      let offset = 0;
      while (true) {
        const { data, error } = await supabase
          .from("users")
          .select("*")
          .order("created_at", { ascending: false })
          .range(offset, offset + BATCH_SIZE - 1);

        if (error) throw error;
        if (!data || data.length === 0) break;
        all.push(...(data as TeamMember[]));
        if (data.length < BATCH_SIZE) break;
        offset += BATCH_SIZE;
      }
      return all;
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
      queryClient.invalidateQueries({ queryKey: ["team-paginated"] });
      queryClient.invalidateQueries({ queryKey: ["team-counts"] });
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
      queryClient.invalidateQueries({ queryKey: ["team-paginated"] });
      queryClient.invalidateQueries({ queryKey: ["team-counts"] });
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
      queryClient.invalidateQueries({ queryKey: ["team-paginated"] });
      queryClient.invalidateQueries({ queryKey: ["team-counts"] });
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

/** Server-side paginated team members. */
export function usePaginatedTeam(params: {
  page: number;
  pageSize: number;
  search?: string;
  role?: string; // 'all' | 'admin' | 'operator' | 'viewer'
}) {
  const { page, pageSize, search = '', role = 'all' } = params;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  return useQuery({
    queryKey: ["team-paginated", page, pageSize, search, role],
    queryFn: async () => {
      let query = supabase
        .from("users")
        .select("*", { count: "exact" });

      if (role && role !== 'all') {
        query = query.eq('role', role as 'admin' | 'operator' | 'viewer');
      }

      const term = search.trim();
      if (term) {
        const escaped = term.replace(/[%,()]/g, ' ').trim();
        query = query.or(`full_name.ilike.%${escaped}%,email.ilike.%${escaped}%`);
      }

      const { data, error, count } = await query
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) throw error;
      const total = count ?? 0;
      return {
        rows: (data ?? []) as TeamMember[],
        total,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      };
    },
  });
}

/** Lightweight counts for KPI cards. */
export function useTeamCounts() {
  return useQuery({
    queryKey: ["team-counts"],
    queryFn: async () => {
      const [total, admins, active] = await Promise.all([
        supabase.from("users").select("id", { count: "exact", head: true }),
        supabase.from("users").select("id", { count: "exact", head: true }).eq("role", "admin"),
        supabase.from("users").select("id", { count: "exact", head: true }).eq("is_active", true),
      ]);
      return {
        total: total.count ?? 0,
        admins: admins.count ?? 0,
        active: active.count ?? 0,
      };
    },
  });
}
