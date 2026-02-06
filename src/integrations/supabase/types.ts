export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      backups: {
        Row: {
          backup_data: Json
          backup_type: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          backup_data?: Json
          backup_type?: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          backup_data?: Json
          backup_type?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      debts: {
        Row: {
          created_at: string
          id: string
          jatuh_tempo: string | null
          keterangan: string | null
          nama: string
          payments: Json
          project_id: string | null
          sisa: number
          tanggal: string
          total: number
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          jatuh_tempo?: string | null
          keterangan?: string | null
          nama: string
          payments?: Json
          project_id?: string | null
          sisa?: number
          tanggal?: string
          total?: number
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          jatuh_tempo?: string | null
          keterangan?: string | null
          nama?: string
          payments?: Json
          project_id?: string | null
          sisa?: number
          tanggal?: string
          total?: number
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      expenses: {
        Row: {
          created_at: string
          deskripsi: string | null
          id: string
          jumlah: number
          kategori: string
          tanggal: string
          user_id: string
        }
        Insert: {
          created_at?: string
          deskripsi?: string | null
          id?: string
          jumlah?: number
          kategori: string
          tanggal?: string
          user_id: string
        }
        Update: {
          created_at?: string
          deskripsi?: string | null
          id?: string
          jumlah?: number
          kategori?: string
          tanggal?: string
          user_id?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          created_at: string
          harga_beli: number
          harga_jual: number
          id: string
          kategori: string
          min_stok: number | null
          nama: string
          satuan: string
          stok: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          harga_beli?: number
          harga_jual?: number
          id?: string
          kategori?: string
          min_stok?: number | null
          nama: string
          satuan?: string
          stok?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          harga_beli?: number
          harga_jual?: number
          id?: string
          kategori?: string
          min_stok?: number | null
          nama?: string
          satuan?: string
          stok?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          auto_print: boolean | null
          created_at: string
          id: string
          min_stock_alert: number | null
          paper_width: string | null
          printer_type: string | null
          store_address: string | null
          store_logo: string | null
          store_name: string
          store_phone: string | null
          updated_at: string
        }
        Insert: {
          auto_print?: boolean | null
          created_at?: string
          id: string
          min_stock_alert?: number | null
          paper_width?: string | null
          printer_type?: string | null
          store_address?: string | null
          store_logo?: string | null
          store_name?: string
          store_phone?: string | null
          updated_at?: string
        }
        Update: {
          auto_print?: boolean | null
          created_at?: string
          id?: string
          min_stock_alert?: number | null
          paper_width?: string | null
          printer_type?: string | null
          store_address?: string | null
          store_logo?: string | null
          store_name?: string
          store_phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          alamat: string | null
          biaya_tenaga_kerja: number | null
          catatan: string | null
          created_at: string
          deskripsi: string | null
          diskon_nominal: number | null
          diskon_persen: number | null
          dp: number
          id: string
          materials: Json
          nama_proyek: string
          nilai_kontrak: number
          pelanggan: string
          status: string
          tanggal_mulai: string | null
          tanggal_order: string | null
          tanggal_selesai: string | null
          telepon: string | null
          user_id: string
        }
        Insert: {
          alamat?: string | null
          biaya_tenaga_kerja?: number | null
          catatan?: string | null
          created_at?: string
          deskripsi?: string | null
          diskon_nominal?: number | null
          diskon_persen?: number | null
          dp?: number
          id?: string
          materials?: Json
          nama_proyek: string
          nilai_kontrak?: number
          pelanggan: string
          status?: string
          tanggal_mulai?: string | null
          tanggal_order?: string | null
          tanggal_selesai?: string | null
          telepon?: string | null
          user_id: string
        }
        Update: {
          alamat?: string | null
          biaya_tenaga_kerja?: number | null
          catatan?: string | null
          created_at?: string
          deskripsi?: string | null
          diskon_nominal?: number | null
          diskon_persen?: number | null
          dp?: number
          id?: string
          materials?: Json
          nama_proyek?: string
          nilai_kontrak?: number
          pelanggan?: string
          status?: string
          tanggal_mulai?: string | null
          tanggal_order?: string | null
          tanggal_selesai?: string | null
          telepon?: string | null
          user_id?: string
        }
        Relationships: []
      }
      purchases: {
        Row: {
          catatan: string | null
          created_at: string
          dp: number
          id: string
          items: Json
          metode_bayar: string
          status: string
          supplier_id: string | null
          supplier_name: string
          tanggal: string
          total: number
          user_id: string
        }
        Insert: {
          catatan?: string | null
          created_at?: string
          dp?: number
          id?: string
          items?: Json
          metode_bayar?: string
          status?: string
          supplier_id?: string | null
          supplier_name: string
          tanggal?: string
          total?: number
          user_id: string
        }
        Update: {
          catatan?: string | null
          created_at?: string
          dp?: number
          id?: string
          items?: Json
          metode_bayar?: string
          status?: string
          supplier_id?: string | null
          supplier_name?: string
          tanggal?: string
          total?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchases_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          alamat: string | null
          catatan: string | null
          created_at: string
          email: string | null
          id: string
          nama: string
          telepon: string | null
          user_id: string
        }
        Insert: {
          alamat?: string | null
          catatan?: string | null
          created_at?: string
          email?: string | null
          id?: string
          nama: string
          telepon?: string | null
          user_id: string
        }
        Update: {
          alamat?: string | null
          catatan?: string | null
          created_at?: string
          email?: string | null
          id?: string
          nama?: string
          telepon?: string | null
          user_id?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          bayar: number
          created_at: string
          diskon: number
          diskon_persen: number
          id: string
          items: Json
          kembalian: number
          metode: string
          pelanggan: string | null
          status: string
          subtotal: number
          tanggal: string
          total: number
          user_id: string
        }
        Insert: {
          bayar?: number
          created_at?: string
          diskon?: number
          diskon_persen?: number
          id?: string
          items?: Json
          kembalian?: number
          metode?: string
          pelanggan?: string | null
          status?: string
          subtotal?: number
          tanggal?: string
          total?: number
          user_id: string
        }
        Update: {
          bayar?: number
          created_at?: string
          diskon?: number
          diskon_persen?: number
          id?: string
          items?: Json
          kembalian?: number
          metode?: string
          pelanggan?: string | null
          status?: string
          subtotal?: number
          tanggal?: string
          total?: number
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
