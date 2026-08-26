export function statusLabel(status: string) {
  const map: Record<string, string> = {
    EM_INCUBACAO: "Em incubação",
    PRE_OPERACIONAL: "Pré-operacional",
    OPERACIONAL: "Operacional",
    ABERTO: "Aberto",
    EM_AVALIACAO: "Em avaliação",
    ENCERRADO: "Encerrado",
    RESULTADOS: "Resultados",
    RECEBIDA: "Recebida",
    EM_ANALISE: "Em análise",
    ACEITE: "Aceite",
    REJEITADA: "Não seleccionada",
    ATIVO: "Activo",
    ALUMNI: "Alumni",
    ARQUIVADO: "Arquivado",
  };
  return map[status] || status;
}
