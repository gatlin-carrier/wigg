// Data layer type definitions

export interface WiggPoint {
  id: string;
  media_id: string;
  user_id: string;
  pos_value: number;
  pos_kind: string;
  reason_short?: string;
  spoiler_level: number;
  created_at: string;
  updated_at: string;
}

export type CreateWiggPointInput = Omit<WiggPoint, 'id' | 'created_at' | 'updated_at'>;