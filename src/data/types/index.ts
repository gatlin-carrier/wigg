// Data layer type definitions

export interface WiggPoint {
  id: string;
  media_id: string;
  user_id: string;
  pos_value: number;
  pos_kind: string;
  reason_short?: string;
  spoiler_level: number;
  tags?: string[]; // Optional tags array matching database schema
  created_at: string;
  updated_at: string;
}

export type CreateWiggPointInput = Omit<WiggPoint, 'id' | 'created_at' | 'updated_at'>;

// Input for hook consumers - they don't need to provide user_id and media_id as those are injected
export type WiggPointFormInput = Omit<CreateWiggPointInput, 'user_id' | 'media_id'>;