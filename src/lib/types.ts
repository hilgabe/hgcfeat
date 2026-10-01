export type Status =
  | "recebida"
  | "analise"
  | "desenvolvimento"
  | "revisao"
  | "entregue"
  | "cancelada";
export type RequestType = "funcionalidade" | "ajuste" | "correcao" | "conteudo" | "outro";
export type Priority = "baixa" | "media" | "alta" | "urgente";
export type Source = "whatsapp" | "cliente" | "interno";

export type Client = {
  id: string;
  name: string;
  company: string | null;
  whatsapp: string | null;
  system_name: string | null;
  system_url: string | null;
  created_at: string;
};

export type Demand = {
  id: string;
  number: number;
  client_id: string;
  title: string;
  description: string | null;
  type: RequestType;
  priority: Priority;
  status: Status;
  source: Source;
  original_message: string | null;
  estimate_hours: number | null;
  due_date: string | null;
  delivered_url: string | null;
  delivered_at: string | null;
  created_at: string;
  updated_at: string;
};

export type Update = {
  id: string;
  request_id: string;
  body: string | null;
  status_to: Status | null;
  author: "hgc" | "cliente";
  created_at: string;
};

export const STATUS: Record<Status, { label: string; hint: string }> = {
  recebida: { label: "Recebida", hint: "Pedido registrado" },
  analise: { label: "Em análise", hint: "Entendendo o escopo" },
  desenvolvimento: { label: "Em desenvolvimento", hint: "Mão na massa" },
  revisao: { label: "Para aprovação", hint: "Aguardando o seu ok" },
  entregue: { label: "Entregue", hint: "Publicado" },
  cancelada: { label: "Cancelada", hint: "Não será feita" },
};
export const STATUS_ORDER: Status[] = [
  "recebida",
  "analise",
  "desenvolvimento",
  "revisao",
  "entregue",
  "cancelada",
];

export const TYPES: Record<RequestType, string> = {
  funcionalidade: "Nova funcionalidade",
  ajuste: "Ajuste / melhoria",
  correcao: "Correção de erro",
  conteudo: "Conteúdo / texto",
  outro: "Outro",
};

export const PRIORITIES: Record<Priority, string> = {
  baixa: "Baixa",
  media: "Média",
  alta: "Alta",
  urgente: "Urgente",
};

export const SOURCES: Record<Source, string> = {
  whatsapp: "WhatsApp",
  cliente: "Pedido direto no painel",
  interno: "Interno",
};

export const code = (n: number) => `HGC-${String(n).padStart(3, "0")}`;

export const AUTHORS = { hgc: "HGC", cliente: "GM Sports" } as const;
