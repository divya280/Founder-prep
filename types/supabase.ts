export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string;
          business_type: string | null;
          domain: string | null;
          state: string | null;
          team_size: string | null;
          funding_stage: string | null;
          revenue: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          name: string;
          business_type?: string | null;
          domain?: string | null;
          state?: string | null;
          team_size?: string | null;
          funding_stage?: string | null;
          revenue?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          business_type?: string | null;
          domain?: string | null;
          state?: string | null;
          team_size?: string | null;
          funding_stage?: string | null;
          revenue?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      
      compliance_items: {
        Row: {
          id: string;
          name: string;
          category: string;
          description: string | null;
          how_to_apply: string | null;
          mandatory: boolean;
          domain_specific: boolean;
          penalty: string | null;
          deadline_note: string | null;
          responsible: string | null;
          documents_required: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          category: string;
          description?: string | null;
          how_to_apply?: string | null;
          mandatory?: boolean;
          domain_specific?: boolean;
          penalty?: string | null;
          deadline_note?: string | null;
          responsible?: string | null;
          documents_required?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          category?: string;
          description?: string | null;
          how_to_apply?: string | null;
          mandatory?: boolean;
          domain_specific?: boolean;
          penalty?: string | null;
          deadline_note?: string | null;
          responsible?: string | null;
          documents_required?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      user_compliance: {
        Row: {
          id: string;
          user_id: string;
          compliance_item_id: string;
          status: string;
          deadline: string | null;
          completed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          compliance_item_id: string;
          status?: string;
          deadline?: string | null;
          completed_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          compliance_item_id?: string;
          status?: string;
          deadline?: string | null;
          completed_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      deadlines: {
        Row: {
          id: string;
          compliance_item_id: string;
          due_date: string;
          recurrence: string | null;
          penalty_description: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          compliance_item_id: string;
          due_date: string;
          recurrence?: string | null;
          penalty_description?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          compliance_item_id?: string;
          due_date?: string;
          recurrence?: string | null;
          penalty_description?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      documents: {
        Row: {
          id: string;
          user_id: string;
          file_name: string;
          file_url: string | null;
          storage_path: string | null;
          doc_type: string | null;
          issue_date: string | null;
          expiry_date: string | null;
          file_size: number | null;
          mime_type: string | null;
          uploaded_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          file_name: string;
          file_url?: string | null;
          storage_path?: string | null;
          doc_type?: string | null;
          issue_date?: string | null;
          expiry_date?: string | null;
          file_size?: number | null;
          mime_type?: string | null;
          uploaded_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          file_name?: string;
          file_url?: string | null;
          storage_path?: string | null;
          doc_type?: string | null;
          issue_date?: string | null;
          expiry_date?: string | null;
          file_size?: number | null;
          mime_type?: string | null;
          uploaded_at?: string;
        };
        Relationships: [];
      };
      vault_shares: {
        Row: {
          id: string;
          user_id: string;
          token: string;
          revoked: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          token: string;
          revoked?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          token?: string;
          revoked?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      embeddings: {
        Row: {
          id: string;
          content: string;
          embedding: string | null;
          metadata: Json | null;
          chunk_index: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          content: string;
          embedding?: string | null;
          metadata?: Json | null;
          chunk_index?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          content?: string;
          embedding?: string | null;
          metadata?: Json | null;
          chunk_index?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          message: string;
          sent_at: string;
          compliance_item_id: string | null;
          document_id: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: string;
          message: string;
          sent_at?: string;
          compliance_item_id?: string | null;
          document_id?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: string;
          message?: string;
          sent_at?: string;
          compliance_item_id?: string | null;
          document_id?: string | null;
        };
        Relationships: [];
      };
      rag_documents: {
        Row: {
          id: string;
          source_file: string;
          title: string;
          category: string | null;
          mandatory: string | null;
          domain_specific: boolean;
          jurisdiction: string | null;
          last_updated: string | null;
          disclaimer: string | null;
          sources: Json;
          chunk_count: number;
          content_hash: string | null;
          last_ingested_at: string | null;
          last_run_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          source_file: string;
          title: string;
          category?: string | null;
          mandatory?: string | null;
          domain_specific?: boolean;
          jurisdiction?: string | null;
          last_updated?: string | null;
          disclaimer?: string | null;
          sources?: Json;
          chunk_count?: number;
          content_hash?: string | null;
          last_ingested_at?: string | null;
          last_run_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          source_file?: string;
          title?: string;
          category?: string | null;
          mandatory?: string | null;
          domain_specific?: boolean;
          jurisdiction?: string | null;
          last_updated?: string | null;
          disclaimer?: string | null;
          sources?: Json;
          chunk_count?: number;
          content_hash?: string | null;
          last_ingested_at?: string | null;
          last_run_id?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      ingestion_runs: {
        Row: {
          id: string;
          status: string;
          trigger: string | null;
          file_count: number;
          file_success_count: number;
          chunk_count: number;
          files: Json;
          error: string | null;
          started_at: string;
          finished_at: string | null;
        };
        Insert: {
          id?: string;
          status?: string;
          trigger?: string | null;
          file_count?: number;
          file_success_count?: number;
          chunk_count?: number;
          files?: Json;
          error?: string | null;
          started_at?: string;
          finished_at?: string | null;
        };
        Update: {
          id?: string;
          status?: string;
          trigger?: string | null;
          file_count?: number;
          file_success_count?: number;
          chunk_count?: number;
          files?: Json;
          error?: string | null;
          started_at?: string;
          finished_at?: string | null;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      match_documents: {
        Args: {
          query_embedding: string;
          match_count?: number;
        };
        Returns: {
          id: string;
          content: string;
          metadata: Json | null;
          chunk_index: number;
          similarity: number;
        }[];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
