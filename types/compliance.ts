export type ComplianceStatus = "Not Started" | "In Progress" | "Done";

export interface ComplianceItem {
  id: string;
  name: string;
  category: string;
  description: string | null;
  how_to_apply: string | null;
  mandatory: boolean;
  domain_specific: boolean;
  created_at: string;
}

export interface UserCompliance {
  id: string;
  user_id: string;
  compliance_item_id: string;
  status: ComplianceStatus;
  deadline: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface Deadline {
  id: string;
  compliance_item_id: string;
  due_date: string;
  recurrence: string | null;
  penalty_description: string | null;
  created_at: string;
}

export interface DocumentRecord {
  id: string;
  user_id: string;
  file_name: string;
  file_url: string;
  doc_type: string | null;
  expiry_date: string | null;
  uploaded_at: string;
}

export interface EmbeddingRecord {
  id: string;
  content: string;
  metadata: Record<string, unknown> | null;
  chunk_index: number;
  created_at: string;
}

export interface NotificationRecord {
  id: string;
  user_id: string;
  type: string;
  message: string;
  sent_at: string;
  compliance_item_id: string | null;
}

export interface MatchedDocument {
  id: string;
  content: string;
  metadata: Record<string, unknown> | null;
  chunk_index: number;
  similarity: number;
}
