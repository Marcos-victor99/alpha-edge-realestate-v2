export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      achados_perdidos: {
        Row: {
          card_id: string
          card_vinculado_id: string | null
          categoria_item: string | null
          codigo_localizacao: string | null
          colaborador_responsavel: string | null
          condicoes_item: string | null
          cor_principal: string | null
          cpf: string | null
          created_at: string | null
          data_agendamento: string | null
          data_hora_evento: string | null
          data_vinculacao: string | null
          descricao_adicional: string | null
          email: string | null
          endereco: Json | null
          fotos_item: Json | null
          id: string
          local_armazenamento: string | null
          local_evento: string | null
          loja_especifica: string | null
          marca_modelo: string | null
          match_score: number | null
          nivel_urgencia: string | null
          nome_completo: string | null
          observacoes: string | null
          outros_locais: string | null
          phase_atual: string | null
          pipe_id: string | null
          protocolo: string | null
          responsavel_entrega: string | null
          status_atual: string | null
          telefone: string | null
          tipo_card: string
          tipo_vinculacao: string | null
          titulo: string | null
          updated_at: string | null
        }
        Insert: {
          card_id: string
          card_vinculado_id?: string | null
          categoria_item?: string | null
          codigo_localizacao?: string | null
          colaborador_responsavel?: string | null
          condicoes_item?: string | null
          cor_principal?: string | null
          cpf?: string | null
          created_at?: string | null
          data_agendamento?: string | null
          data_hora_evento?: string | null
          data_vinculacao?: string | null
          descricao_adicional?: string | null
          email?: string | null
          endereco?: Json | null
          fotos_item?: Json | null
          id?: string
          local_armazenamento?: string | null
          local_evento?: string | null
          loja_especifica?: string | null
          marca_modelo?: string | null
          match_score?: number | null
          nivel_urgencia?: string | null
          nome_completo?: string | null
          observacoes?: string | null
          outros_locais?: string | null
          phase_atual?: string | null
          pipe_id?: string | null
          protocolo?: string | null
          responsavel_entrega?: string | null
          status_atual?: string | null
          telefone?: string | null
          tipo_card: string
          tipo_vinculacao?: string | null
          titulo?: string | null
          updated_at?: string | null
        }
        Update: {
          card_id?: string
          card_vinculado_id?: string | null
          categoria_item?: string | null
          codigo_localizacao?: string | null
          colaborador_responsavel?: string | null
          condicoes_item?: string | null
          cor_principal?: string | null
          cpf?: string | null
          created_at?: string | null
          data_agendamento?: string | null
          data_hora_evento?: string | null
          data_vinculacao?: string | null
          descricao_adicional?: string | null
          email?: string | null
          endereco?: Json | null
          fotos_item?: Json | null
          id?: string
          local_armazenamento?: string | null
          local_evento?: string | null
          loja_especifica?: string | null
          marca_modelo?: string | null
          match_score?: number | null
          nivel_urgencia?: string | null
          nome_completo?: string | null
          observacoes?: string | null
          outros_locais?: string | null
          phase_atual?: string | null
          pipe_id?: string | null
          protocolo?: string | null
          responsavel_entrega?: string | null
          status_atual?: string | null
          telefone?: string | null
          tipo_card?: string
          tipo_vinculacao?: string | null
          titulo?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      beeoz_nutricional_documents: {
        Row: {
          content: string | null
          embedding: string | null
          id: number
          metadata: Json | null
        }
        Insert: {
          content?: string | null
          embedding?: string | null
          id?: number
          metadata?: Json | null
        }
        Update: {
          content?: string | null
          embedding?: string | null
          id?: number
          metadata?: Json | null
        }
        Relationships: []
      }
      beeoz_produtos: {
        Row: {
          ativo: boolean | null
          beneficios: string | null
          categoria_id: number | null
          conteudo: string | null
          created_at: string | null
          descricao: string | null
          id: number
          img_produto: string | null
          ingredientes: Json | null
          link: string | null
          nome: string
          preco_normal: number | null
          preco_promocional: number | null
          quantidade: number | null
          sem_gluten_lactose: boolean | null
          sugestao_uso: string | null
          tabela_nutricional: Json | null
          versatilidade: string | null
        }
        Insert: {
          ativo?: boolean | null
          beneficios?: string | null
          categoria_id?: number | null
          conteudo?: string | null
          created_at?: string | null
          descricao?: string | null
          id?: number
          img_produto?: string | null
          ingredientes?: Json | null
          link?: string | null
          nome: string
          preco_normal?: number | null
          preco_promocional?: number | null
          quantidade?: number | null
          sem_gluten_lactose?: boolean | null
          sugestao_uso?: string | null
          tabela_nutricional?: Json | null
          versatilidade?: string | null
        }
        Update: {
          ativo?: boolean | null
          beneficios?: string | null
          categoria_id?: number | null
          conteudo?: string | null
          created_at?: string | null
          descricao?: string | null
          id?: number
          img_produto?: string | null
          ingredientes?: Json | null
          link?: string | null
          nome?: string
          preco_normal?: number | null
          preco_promocional?: number | null
          quantidade?: number | null
          sem_gluten_lactose?: boolean | null
          sugestao_uso?: string | null
          tabela_nutricional?: Json | null
          versatilidade?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "beeoz_produtos_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
        ]
      }
      beeoz_sports_documents: {
        Row: {
          content: string | null
          embedding: string | null
          id: number
          metadata: Json | null
        }
        Insert: {
          content?: string | null
          embedding?: string | null
          id?: number
          metadata?: Json | null
        }
        Update: {
          content?: string | null
          embedding?: string | null
          id?: number
          metadata?: Json | null
        }
        Relationships: []
      }
      bhs_categorias_tarefas: {
        Row: {
          created_at: string | null
          descricao: string | null
          id: string
          nome: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          descricao?: string | null
          id?: string
          nome: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          descricao?: string | null
          id?: string
          nome?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      bhs_centros_custo: {
        Row: {
          created_at: string | null
          descricao: string | null
          id: string
          nome: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          descricao?: string | null
          id?: string
          nome: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          descricao?: string | null
          id?: string
          nome?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      bhs_crm_contatos: {
        Row: {
          cargo: string | null
          created_at: string
          email: string | null
          empresa: string | null
          id: string
          nome: string
          observacoes: string | null
          origem: string | null
          pipefy_person_id: string | null
          telefone: string | null
          updated_at: string
        }
        Insert: {
          cargo?: string | null
          created_at?: string
          email?: string | null
          empresa?: string | null
          id?: string
          nome: string
          observacoes?: string | null
          origem?: string | null
          pipefy_person_id?: string | null
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          cargo?: string | null
          created_at?: string
          email?: string | null
          empresa?: string | null
          id?: string
          nome?: string
          observacoes?: string | null
          origem?: string | null
          pipefy_person_id?: string | null
          telefone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      bhs_crm_historico: {
        Row: {
          created_at: string
          fase_anterior: string | null
          fase_nova: string | null
          id: string
          negocio_id: string | null
          observacoes: string | null
          origem: string | null
          status_anterior: string | null
          status_novo: string
          usuario: string | null
          valor_anterior: number | null
          valor_novo: number | null
        }
        Insert: {
          created_at?: string
          fase_anterior?: string | null
          fase_nova?: string | null
          id?: string
          negocio_id?: string | null
          observacoes?: string | null
          origem?: string | null
          status_anterior?: string | null
          status_novo: string
          usuario?: string | null
          valor_anterior?: number | null
          valor_novo?: number | null
        }
        Update: {
          created_at?: string
          fase_anterior?: string | null
          fase_nova?: string | null
          id?: string
          negocio_id?: string | null
          observacoes?: string | null
          origem?: string | null
          status_anterior?: string | null
          status_novo?: string
          usuario?: string | null
          valor_anterior?: number | null
          valor_novo?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "bhs_crm_historico_negocio_id_fkey"
            columns: ["negocio_id"]
            isOneToOne: false
            referencedRelation: "bhs_crm_negocios"
            referencedColumns: ["id"]
          },
        ]
      }
      bhs_crm_negocios: {
        Row: {
          contato_id: string | null
          created_at: string
          data_fechamento_esperada: string | null
          data_fechamento_real: string | null
          fase: string | null
          id: string
          observacoes: string | null
          origem: string | null
          pipefy_card_id: string | null
          pipefy_pipe_id: string | null
          probabilidade_fechamento: number | null
          status: string
          tipo_negocio: string
          titulo: string
          updated_at: string
          valor_estimado: number | null
          valor_fechado: number | null
          vendedor_id: string | null
        }
        Insert: {
          contato_id?: string | null
          created_at?: string
          data_fechamento_esperada?: string | null
          data_fechamento_real?: string | null
          fase?: string | null
          id?: string
          observacoes?: string | null
          origem?: string | null
          pipefy_card_id?: string | null
          pipefy_pipe_id?: string | null
          probabilidade_fechamento?: number | null
          status?: string
          tipo_negocio: string
          titulo: string
          updated_at?: string
          valor_estimado?: number | null
          valor_fechado?: number | null
          vendedor_id?: string | null
        }
        Update: {
          contato_id?: string | null
          created_at?: string
          data_fechamento_esperada?: string | null
          data_fechamento_real?: string | null
          fase?: string | null
          id?: string
          observacoes?: string | null
          origem?: string | null
          pipefy_card_id?: string | null
          pipefy_pipe_id?: string | null
          probabilidade_fechamento?: number | null
          status?: string
          tipo_negocio?: string
          titulo?: string
          updated_at?: string
          valor_estimado?: number | null
          valor_fechado?: number | null
          vendedor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bhs_crm_negocios_contato_id_fkey"
            columns: ["contato_id"]
            isOneToOne: false
            referencedRelation: "bhs_crm_contatos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bhs_crm_negocios_vendedor_id_fkey"
            columns: ["vendedor_id"]
            isOneToOne: false
            referencedRelation: "bhs_vendedores"
            referencedColumns: ["id"]
          },
        ]
      }
      bhs_estandes: {
        Row: {
          created_at: string | null
          data_locacao: string | null
          id: string
          locatario: string | null
          numero: string
          observacoes: string | null
          status: string | null
          tipo: string
          updated_at: string | null
          valor: number
        }
        Insert: {
          created_at?: string | null
          data_locacao?: string | null
          id?: string
          locatario?: string | null
          numero: string
          observacoes?: string | null
          status?: string | null
          tipo: string
          updated_at?: string | null
          valor?: number
        }
        Update: {
          created_at?: string | null
          data_locacao?: string | null
          id?: string
          locatario?: string | null
          numero?: string
          observacoes?: string | null
          status?: string | null
          tipo?: string
          updated_at?: string | null
          valor?: number
        }
        Relationships: []
      }
      bhs_projecoes_despesas: {
        Row: {
          ano_referencia: number
          centro_custo_id: string | null
          created_at: string | null
          id: string
          observacoes: string | null
          updated_at: string | null
          valor_projetado: number
        }
        Insert: {
          ano_referencia?: number
          centro_custo_id?: string | null
          created_at?: string | null
          id?: string
          observacoes?: string | null
          updated_at?: string | null
          valor_projetado?: number
        }
        Update: {
          ano_referencia?: number
          centro_custo_id?: string | null
          created_at?: string | null
          id?: string
          observacoes?: string | null
          updated_at?: string | null
          valor_projetado?: number
        }
        Relationships: [
          {
            foreignKeyName: "bhs_projecoes_despesas_centro_custo_id_fkey"
            columns: ["centro_custo_id"]
            isOneToOne: false
            referencedRelation: "bhs_centros_custo"
            referencedColumns: ["id"]
          },
        ]
      }
      bhs_receitas: {
        Row: {
          created_at: string | null
          data_confirmacao: string | null
          data_vencimento: string | null
          fonte: string
          id: string
          meta: number | null
          observacoes: string | null
          status: string | null
          tipo_receita_id: string | null
          updated_at: string | null
          valor: number
          vendedor_id: string | null
        }
        Insert: {
          created_at?: string | null
          data_confirmacao?: string | null
          data_vencimento?: string | null
          fonte: string
          id?: string
          meta?: number | null
          observacoes?: string | null
          status?: string | null
          tipo_receita_id?: string | null
          updated_at?: string | null
          valor?: number
          vendedor_id?: string | null
        }
        Update: {
          created_at?: string | null
          data_confirmacao?: string | null
          data_vencimento?: string | null
          fonte?: string
          id?: string
          meta?: number | null
          observacoes?: string | null
          status?: string | null
          tipo_receita_id?: string | null
          updated_at?: string | null
          valor?: number
          vendedor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bhs_receitas_tipo_receita_id_fkey"
            columns: ["tipo_receita_id"]
            isOneToOne: false
            referencedRelation: "bhs_tipos_receita"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bhs_receitas_vendedor_id_fkey"
            columns: ["vendedor_id"]
            isOneToOne: false
            referencedRelation: "bhs_vendedores"
            referencedColumns: ["id"]
          },
        ]
      }
      bhs_status_tarefas: {
        Row: {
          cor: string | null
          created_at: string | null
          id: string
          nome: string
          updated_at: string | null
        }
        Insert: {
          cor?: string | null
          created_at?: string | null
          id?: string
          nome: string
          updated_at?: string | null
        }
        Update: {
          cor?: string | null
          created_at?: string | null
          id?: string
          nome?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      bhs_tarefas: {
        Row: {
          categoria_id: string | null
          centro_custo_id: string | null
          created_at: string | null
          data_entrega: string | null
          data_limite: string | null
          data_vencimento: string | null
          descricao_servico: string
          fornecedor: string | null
          id: string
          lancamento: string | null
          observacoes: string | null
          situacao: string | null
          status_id: string | null
          updated_at: string | null
          valor: number
        }
        Insert: {
          categoria_id?: string | null
          centro_custo_id?: string | null
          created_at?: string | null
          data_entrega?: string | null
          data_limite?: string | null
          data_vencimento?: string | null
          descricao_servico: string
          fornecedor?: string | null
          id?: string
          lancamento?: string | null
          observacoes?: string | null
          situacao?: string | null
          status_id?: string | null
          updated_at?: string | null
          valor?: number
        }
        Update: {
          categoria_id?: string | null
          centro_custo_id?: string | null
          created_at?: string | null
          data_entrega?: string | null
          data_limite?: string | null
          data_vencimento?: string | null
          descricao_servico?: string
          fornecedor?: string | null
          id?: string
          lancamento?: string | null
          observacoes?: string | null
          situacao?: string | null
          status_id?: string | null
          updated_at?: string | null
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "bhs_tarefas_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "bhs_categorias_tarefas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bhs_tarefas_centro_custo_id_fkey"
            columns: ["centro_custo_id"]
            isOneToOne: false
            referencedRelation: "bhs_centros_custo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bhs_tarefas_status_id_fkey"
            columns: ["status_id"]
            isOneToOne: false
            referencedRelation: "bhs_status_tarefas"
            referencedColumns: ["id"]
          },
        ]
      }
      bhs_tipos_receita: {
        Row: {
          created_at: string | null
          descricao: string | null
          gera_comissao: boolean | null
          id: string
          nome: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          descricao?: string | null
          gera_comissao?: boolean | null
          id?: string
          nome: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          descricao?: string | null
          gera_comissao?: boolean | null
          id?: string
          nome?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      bhs_vendedores: {
        Row: {
          ativo: boolean | null
          comissao_percentual: number | null
          created_at: string | null
          email: string | null
          id: string
          meta_vendas: number | null
          nome: string
          telefone: string | null
          tipo_negociacao: string | null
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          comissao_percentual?: number | null
          created_at?: string | null
          email?: string | null
          id?: string
          meta_vendas?: number | null
          nome: string
          telefone?: string | null
          tipo_negociacao?: string | null
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          comissao_percentual?: number | null
          created_at?: string | null
          email?: string | null
          id?: string
          meta_vendas?: number | null
          nome?: string
          telefone?: string | null
          tipo_negociacao?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      bhs_wix_beeoz_sports_config: {
        Row: {
          chave: string
          created_at: string
          descricao: string | null
          id: string
          tipo: string | null
          updated_at: string
          valor: string | null
        }
        Insert: {
          chave: string
          created_at?: string
          descricao?: string | null
          id?: string
          tipo?: string | null
          updated_at?: string
          valor?: string | null
        }
        Update: {
          chave?: string
          created_at?: string
          descricao?: string | null
          id?: string
          tipo?: string | null
          updated_at?: string
          valor?: string | null
        }
        Relationships: []
      }
      bhs_wix_beeoz_sports_eventos: {
        Row: {
          capacidade_maxima: number | null
          categoria: string | null
          created_at: string
          data_fim: string | null
          data_inicio: string
          descricao: string | null
          id: string
          imagem_url: string | null
          local: string | null
          preco: number | null
          slug: string | null
          status: string | null
          titulo: string
          updated_at: string
          wix_event_id: string
        }
        Insert: {
          capacidade_maxima?: number | null
          categoria?: string | null
          created_at?: string
          data_fim?: string | null
          data_inicio: string
          descricao?: string | null
          id?: string
          imagem_url?: string | null
          local?: string | null
          preco?: number | null
          slug?: string | null
          status?: string | null
          titulo: string
          updated_at?: string
          wix_event_id: string
        }
        Update: {
          capacidade_maxima?: number | null
          categoria?: string | null
          created_at?: string
          data_fim?: string | null
          data_inicio?: string
          descricao?: string | null
          id?: string
          imagem_url?: string | null
          local?: string | null
          preco?: number | null
          slug?: string | null
          status?: string | null
          titulo?: string
          updated_at?: string
          wix_event_id?: string
        }
        Relationships: []
      }
      bhs_wix_beeoz_sports_pagamentos: {
        Row: {
          created_at: string
          data_pagamento: string | null
          gateway_resposta: Json | null
          id: string
          metodo_pagamento: string | null
          participante_id: string
          status_pagamento: string | null
          transaction_id: string | null
          updated_at: string
          valor: number
          wix_payment_id: string
        }
        Insert: {
          created_at?: string
          data_pagamento?: string | null
          gateway_resposta?: Json | null
          id?: string
          metodo_pagamento?: string | null
          participante_id: string
          status_pagamento?: string | null
          transaction_id?: string | null
          updated_at?: string
          valor: number
          wix_payment_id: string
        }
        Update: {
          created_at?: string
          data_pagamento?: string | null
          gateway_resposta?: Json | null
          id?: string
          metodo_pagamento?: string | null
          participante_id?: string
          status_pagamento?: string | null
          transaction_id?: string | null
          updated_at?: string
          valor?: number
          wix_payment_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bhs_wix_beeoz_sports_pagamentos_participante_id_fkey"
            columns: ["participante_id"]
            isOneToOne: false
            referencedRelation: "bhs_wix_beeoz_sports_participantes"
            referencedColumns: ["id"]
          },
        ]
      }
      bhs_wix_beeoz_sports_participantes: {
        Row: {
          cpf: string | null
          created_at: string
          data_inscricao: string
          data_nascimento: string | null
          email: string
          evento_id: string
          forma_pagamento: string | null
          id: string
          nome_completo: string
          observacoes: string | null
          status_inscricao: string | null
          telefone: string | null
          updated_at: string
          valor_pago: number | null
          wix_order_id: string
        }
        Insert: {
          cpf?: string | null
          created_at?: string
          data_inscricao?: string
          data_nascimento?: string | null
          email: string
          evento_id: string
          forma_pagamento?: string | null
          id?: string
          nome_completo: string
          observacoes?: string | null
          status_inscricao?: string | null
          telefone?: string | null
          updated_at?: string
          valor_pago?: number | null
          wix_order_id: string
        }
        Update: {
          cpf?: string | null
          created_at?: string
          data_inscricao?: string
          data_nascimento?: string | null
          email?: string
          evento_id?: string
          forma_pagamento?: string | null
          id?: string
          nome_completo?: string
          observacoes?: string | null
          status_inscricao?: string | null
          telefone?: string | null
          updated_at?: string
          valor_pago?: number | null
          wix_order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bhs_wix_beeoz_sports_participantes_evento_id_fkey"
            columns: ["evento_id"]
            isOneToOne: false
            referencedRelation: "bhs_wix_beeoz_sports_eventos"
            referencedColumns: ["id"]
          },
        ]
      }
      campanhas_parabens_spb: {
        Row: {
          assunto_email: string | null
          canal_email_enviado: boolean | null
          canal_whatsapp_enviado: boolean | null
          cliente_id: number
          data_envio: string | null
          data_nascimento: string
          email_cliente: string | null
          id: number
          mensagem_whatsapp: string | null
          nome_cliente: string
          responsavel_envio: string | null
          status_envio: string | null
          telefone_cliente: string | null
          titulo_email: string | null
        }
        Insert: {
          assunto_email?: string | null
          canal_email_enviado?: boolean | null
          canal_whatsapp_enviado?: boolean | null
          cliente_id: number
          data_envio?: string | null
          data_nascimento: string
          email_cliente?: string | null
          id?: number
          mensagem_whatsapp?: string | null
          nome_cliente: string
          responsavel_envio?: string | null
          status_envio?: string | null
          telefone_cliente?: string | null
          titulo_email?: string | null
        }
        Update: {
          assunto_email?: string | null
          canal_email_enviado?: boolean | null
          canal_whatsapp_enviado?: boolean | null
          cliente_id?: number
          data_envio?: string | null
          data_nascimento?: string
          email_cliente?: string | null
          id?: number
          mensagem_whatsapp?: string | null
          nome_cliente?: string
          responsavel_envio?: string | null
          status_envio?: string | null
          telefone_cliente?: string | null
          titulo_email?: string | null
        }
        Relationships: []
      }
      categorias: {
        Row: {
          id: number
          nome: string
        }
        Insert: {
          id?: number
          nome: string
        }
        Update: {
          id?: number
          nome?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          active: boolean | null
          bot_message: string | null
          conversation_id: string | null
          created_at: string | null
          id: number
          message_type: string | null
          phone: string | null
          user_message: string | null
        }
        Insert: {
          active?: boolean | null
          bot_message?: string | null
          conversation_id?: string | null
          created_at?: string | null
          id?: number
          message_type?: string | null
          phone?: string | null
          user_message?: string | null
        }
        Update: {
          active?: boolean | null
          bot_message?: string | null
          conversation_id?: string | null
          created_at?: string | null
          id?: number
          message_type?: string | null
          phone?: string | null
          user_message?: string | null
        }
        Relationships: []
      }
      chatbot_beeoz_sports_tickets: {
        Row: {
          cliente_email: string | null
          created_at: string
          descricao: string | null
          id: number
          link_whatsapp: string | null
          nome: string | null
          pedido_id: string | null
          prioridade: string
          sessionid: string | null
          setor: string | null
          status: string
          telefone: string | null
          ticket_numero: string | null
        }
        Insert: {
          cliente_email?: string | null
          created_at?: string
          descricao?: string | null
          id?: number
          link_whatsapp?: string | null
          nome?: string | null
          pedido_id?: string | null
          prioridade?: string
          sessionid?: string | null
          setor?: string | null
          status?: string
          telefone?: string | null
          ticket_numero?: string | null
        }
        Update: {
          cliente_email?: string | null
          created_at?: string
          descricao?: string | null
          id?: number
          link_whatsapp?: string | null
          nome?: string | null
          pedido_id?: string | null
          prioridade?: string
          sessionid?: string | null
          setor?: string | null
          status?: string
          telefone?: string | null
          ticket_numero?: string | null
        }
        Relationships: []
      }
      chatbot_beeoz_tickets: {
        Row: {
          cliente_email: string | null
          cliente_nome: string | null
          cliente_telefone: string | null
          created_at: string
          descricao: string | null
          id: number
          link_whatsapp: string | null
          pedido_id: string | null
          prioridade: string
          session_id: string | null
          setor: string | null
          solucao_desejada: string | null
          status: string
          ticket_numero: string
        }
        Insert: {
          cliente_email?: string | null
          cliente_nome?: string | null
          cliente_telefone?: string | null
          created_at?: string
          descricao?: string | null
          id?: number
          link_whatsapp?: string | null
          pedido_id?: string | null
          prioridade?: string
          session_id?: string | null
          setor?: string | null
          solucao_desejada?: string | null
          status?: string
          ticket_numero: string
        }
        Update: {
          cliente_email?: string | null
          cliente_nome?: string | null
          cliente_telefone?: string | null
          created_at?: string
          descricao?: string | null
          id?: number
          link_whatsapp?: string | null
          pedido_id?: string | null
          prioridade?: string
          session_id?: string | null
          setor?: string | null
          solucao_desejada?: string | null
          status?: string
          ticket_numero?: string
        }
        Relationships: []
      }
      chatbot_bozsports_04052025: {
        Row: {
          id: number
          message: Json
          session_id: string
        }
        Insert: {
          id?: number
          message: Json
          session_id: string
        }
        Update: {
          id?: number
          message?: Json
          session_id?: string
        }
        Relationships: []
      }
      chatbot_bozsports_07052025: {
        Row: {
          id: number
          message: Json
          session_id: string
        }
        Insert: {
          id?: number
          message: Json
          session_id: string
        }
        Update: {
          id?: number
          message?: Json
          session_id?: string
        }
        Relationships: []
      }
      chatbot_bozsports_pos_evento: {
        Row: {
          id: number
          message: Json
          session_id: string
        }
        Insert: {
          id?: number
          message: Json
          session_id: string
        }
        Update: {
          id?: number
          message?: Json
          session_id?: string
        }
        Relationships: []
      }
      chatbot_spb_tickets: {
        Row: {
          cliente_email: string | null
          created_at: string
          descricao: string | null
          id: number
          link_whatsapp: string | null
          nome: string | null
          prioridade: string
          sessionid: string | null
          setor: string | null
          status: string
          telefone: string | null
          ticket_numero: string | null
        }
        Insert: {
          cliente_email?: string | null
          created_at?: string
          descricao?: string | null
          id?: number
          link_whatsapp?: string | null
          nome?: string | null
          prioridade?: string
          sessionid?: string | null
          setor?: string | null
          status?: string
          telefone?: string | null
          ticket_numero?: string | null
        }
        Update: {
          cliente_email?: string | null
          created_at?: string
          descricao?: string | null
          id?: number
          link_whatsapp?: string | null
          nome?: string | null
          prioridade?: string
          sessionid?: string | null
          setor?: string | null
          status?: string
          telefone?: string | null
          ticket_numero?: string | null
        }
        Relationships: []
      }
      chatbot_teste_22042025: {
        Row: {
          id: number
          message: Json
          session_id: string
        }
        Insert: {
          id?: number
          message: Json
          session_id: string
        }
        Update: {
          id?: number
          message?: Json
          session_id?: string
        }
        Relationships: []
      }
      chatbot_teste_24042025: {
        Row: {
          id: number
          message: Json
          session_id: string
        }
        Insert: {
          id?: number
          message: Json
          session_id: string
        }
        Update: {
          id?: number
          message?: Json
          session_id?: string
        }
        Relationships: []
      }
      chats: {
        Row: {
          app: string | null
          conversation_id: string | null
          created_at: string | null
          id: number
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          app?: string | null
          conversation_id?: string | null
          created_at?: string | null
          id?: number
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          app?: string | null
          conversation_id?: string | null
          created_at?: string | null
          id?: number
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      clientes_boz: {
        Row: {
          created_at: string
          email: string | null
          id: number
          nome: string | null
          primeiro_contato: boolean | null
          sessionId: string | null
          telefone: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: number
          nome?: string | null
          primeiro_contato?: boolean | null
          sessionId?: string | null
          telefone?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: number
          nome?: string | null
          primeiro_contato?: boolean | null
          sessionId?: string | null
          telefone?: string | null
        }
        Relationships: []
      }
      contatos: {
        Row: {
          audio: boolean | null
          id: number
          nome: string
          registros: number | null
          whatsapp: string
        }
        Insert: {
          audio?: boolean | null
          id?: number
          nome: string
          registros?: number | null
          whatsapp: string
        }
        Update: {
          audio?: boolean | null
          id?: number
          nome?: string
          registros?: number | null
          whatsapp?: string
        }
        Relationships: []
      }
      cri_file_uploads: {
        Row: {
          category: string | null
          created_at: string
          extracted_data: Json | null
          file_name: string
          file_size: number
          file_type: string
          id: string
          month_year: string | null
          processed_date: string | null
          status: string
          storage_path: string
          table_name: string | null
          total_amount: number | null
          transaction_count: number | null
          updated_at: string
          upload_date: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          extracted_data?: Json | null
          file_name: string
          file_size: number
          file_type: string
          id?: string
          month_year?: string | null
          processed_date?: string | null
          status?: string
          storage_path: string
          table_name?: string | null
          total_amount?: number | null
          transaction_count?: number | null
          updated_at?: string
          upload_date?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          extracted_data?: Json | null
          file_name?: string
          file_size?: number
          file_type?: string
          id?: string
          month_year?: string | null
          processed_date?: string | null
          status?: string
          storage_path?: string
          table_name?: string | null
          total_amount?: number | null
          transaction_count?: number | null
          updated_at?: string
          upload_date?: string
        }
        Relationships: []
      }
      dados_cliente: {
        Row: {
          created_at: string | null
          id: number
          sessionid: string | null
          telefone: string | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          sessionid?: string | null
          telefone?: string | null
        }
        Update: {
          created_at?: string | null
          id?: number
          sessionid?: string | null
          telefone?: string | null
        }
        Relationships: []
      }
      daily_summary: {
        Row: {
          account_id: string
          account_name: string
          avg_cost_per_result: number | null
          avg_ctr: number | null
          created_at: string | null
          id: number
          sector: string
          summary_date: string
          total_clicks: number | null
          total_impressions: number | null
          total_results: number | null
          total_spend: number | null
        }
        Insert: {
          account_id: string
          account_name: string
          avg_cost_per_result?: number | null
          avg_ctr?: number | null
          created_at?: string | null
          id?: number
          sector: string
          summary_date: string
          total_clicks?: number | null
          total_impressions?: number | null
          total_results?: number | null
          total_spend?: number | null
        }
        Update: {
          account_id?: string
          account_name?: string
          avg_cost_per_result?: number | null
          avg_ctr?: number | null
          created_at?: string | null
          id?: number
          sector?: string
          summary_date?: string
          total_clicks?: number | null
          total_impressions?: number | null
          total_results?: number | null
          total_spend?: number | null
        }
        Relationships: []
      }
      dynamic_1752536912409_pagamentos_empreendedor_xlsx_175253691495: {
        Row: {
          amount: number | null
          category: string | null
          created_at: string | null
          date: string | null
          description: string | null
          id: number
          supplier: string | null
        }
        Insert: {
          amount?: number | null
          category?: string | null
          created_at?: string | null
          date?: string | null
          description?: string | null
          id?: number
          supplier?: string | null
        }
        Update: {
          amount?: number | null
          category?: string | null
          created_at?: string | null
          date?: string | null
          description?: string | null
          id?: number
          supplier?: string | null
        }
        Relationships: []
      }
      emprestimos_fila: {
        Row: {
          atualizado_em: string | null
          avaliacao: string | null
          cpf_cliente: string | null
          criado_em: string | null
          data_devolucao: string | null
          data_retirada: string | null
          data_solicitacao: string | null
          email_cliente: string | null
          id: number
          id_card: string | null
          id_equipamento: string | null
          nivel_prioridade: number | null
          nivel_urgencia: string | null
          nome_cliente: string | null
          obs: string | null
          periodo_solicitado: string | null
          posicao_na_fila: number | null
          previsao_devolucao: string | null
          status_disponibilidade: string | null
          status_emprestimo: string | null
          telefone_cliente: string | null
          tipo_equipamento: string | null
          tipo_solicitante: string | null
          whatsapp_cliente: string | null
        }
        Insert: {
          atualizado_em?: string | null
          avaliacao?: string | null
          cpf_cliente?: string | null
          criado_em?: string | null
          data_devolucao?: string | null
          data_retirada?: string | null
          data_solicitacao?: string | null
          email_cliente?: string | null
          id?: number
          id_card?: string | null
          id_equipamento?: string | null
          nivel_prioridade?: number | null
          nivel_urgencia?: string | null
          nome_cliente?: string | null
          obs?: string | null
          periodo_solicitado?: string | null
          posicao_na_fila?: number | null
          previsao_devolucao?: string | null
          status_disponibilidade?: string | null
          status_emprestimo?: string | null
          telefone_cliente?: string | null
          tipo_equipamento?: string | null
          tipo_solicitante?: string | null
          whatsapp_cliente?: string | null
        }
        Update: {
          atualizado_em?: string | null
          avaliacao?: string | null
          cpf_cliente?: string | null
          criado_em?: string | null
          data_devolucao?: string | null
          data_retirada?: string | null
          data_solicitacao?: string | null
          email_cliente?: string | null
          id?: number
          id_card?: string | null
          id_equipamento?: string | null
          nivel_prioridade?: number | null
          nivel_urgencia?: string | null
          nome_cliente?: string | null
          obs?: string | null
          periodo_solicitado?: string | null
          posicao_na_fila?: number | null
          previsao_devolucao?: string | null
          status_disponibilidade?: string | null
          status_emprestimo?: string | null
          telefone_cliente?: string | null
          tipo_equipamento?: string | null
          tipo_solicitante?: string | null
          whatsapp_cliente?: string | null
        }
        Relationships: []
      }
      event_schedule: {
        Row: {
          atividade: string
          data: string
          horario_fim: string | null
          horario_inicio: string | null
          horario_livre: string | null
          id: string
          local: string | null
        }
        Insert: {
          atividade: string
          data: string
          horario_fim?: string | null
          horario_inicio?: string | null
          horario_livre?: string | null
          id?: string
          local?: string | null
        }
        Update: {
          atividade?: string
          data?: string
          horario_fim?: string | null
          horario_inicio?: string | null
          horario_livre?: string | null
          id?: string
          local?: string | null
        }
        Relationships: []
      }
      eventos_spb: {
        Row: {
          criado_em: string | null
          data_evento: string
          dia_semana: string
          horario: string | null
          id: string
          nome: string
          tipo: string
        }
        Insert: {
          criado_em?: string | null
          data_evento: string
          dia_semana: string
          horario?: string | null
          id?: string
          nome: string
          tipo: string
        }
        Update: {
          criado_em?: string | null
          data_evento?: string
          dia_semana?: string
          horario?: string | null
          id?: string
          nome?: string
          tipo?: string
        }
        Relationships: []
      }
      facebook_ads_data: {
        Row: {
          account_id: string
          account_name: string
          ad_id: string
          ad_name: string
          campaign_id: string
          campaign_name: string
          clicks: number | null
          collected_at: string | null
          comments: number | null
          cost_per_result: number | null
          ctr: number | null
          date_start: string
          date_stop: string
          id: number
          impressions: number | null
          likes: number | null
          page_engagement: number | null
          results: number | null
          sector: string
          shares: number | null
          spend: number | null
          video_views: number | null
        }
        Insert: {
          account_id: string
          account_name: string
          ad_id: string
          ad_name: string
          campaign_id: string
          campaign_name: string
          clicks?: number | null
          collected_at?: string | null
          comments?: number | null
          cost_per_result?: number | null
          ctr?: number | null
          date_start: string
          date_stop: string
          id?: number
          impressions?: number | null
          likes?: number | null
          page_engagement?: number | null
          results?: number | null
          sector: string
          shares?: number | null
          spend?: number | null
          video_views?: number | null
        }
        Update: {
          account_id?: string
          account_name?: string
          ad_id?: string
          ad_name?: string
          campaign_id?: string
          campaign_name?: string
          clicks?: number | null
          collected_at?: string | null
          comments?: number | null
          cost_per_result?: number | null
          ctr?: number | null
          date_start?: string
          date_stop?: string
          id?: number
          impressions?: number | null
          likes?: number | null
          page_engagement?: number | null
          results?: number | null
          sector?: string
          shares?: number | null
          spend?: number | null
          video_views?: number | null
        }
        Relationships: []
      }
      faq_beeoz_sports: {
        Row: {
          categoria: string
          created_at: string | null
          id: number
          pergunta: string
          resposta: string
        }
        Insert: {
          categoria: string
          created_at?: string | null
          id?: number
          pergunta: string
          resposta: string
        }
        Update: {
          categoria?: string
          created_at?: string | null
          id?: number
          pergunta?: string
          resposta?: string
        }
        Relationships: []
      }
      faq_cacau_bee: {
        Row: {
          categoria: string
          created_at: string | null
          id: number
          pergunta: string
          resposta: string
        }
        Insert: {
          categoria: string
          created_at?: string | null
          id?: number
          pergunta: string
          resposta: string
        }
        Update: {
          categoria?: string
          created_at?: string | null
          id?: number
          pergunta?: string
          resposta?: string
        }
        Relationships: []
      }
      faq_comercial: {
        Row: {
          categoria: string
          created_at: string | null
          id: number
          pergunta: string
          resposta: string
        }
        Insert: {
          categoria?: string
          created_at?: string | null
          id?: number
          pergunta: string
          resposta: string
        }
        Update: {
          categoria?: string
          created_at?: string | null
          id?: number
          pergunta?: string
          resposta?: string
        }
        Relationships: []
      }
      faq_empresa: {
        Row: {
          categoria: string
          created_at: string | null
          id: number
          pergunta: string
          resposta: string
        }
        Insert: {
          categoria: string
          created_at?: string | null
          id?: number
          pergunta: string
          resposta: string
        }
        Update: {
          categoria?: string
          created_at?: string | null
          id?: number
          pergunta?: string
          resposta?: string
        }
        Relationships: []
      }
      faq_eventos: {
        Row: {
          categoria: string
          created_at: string | null
          id: number
          pergunta: string
          resposta: string
        }
        Insert: {
          categoria: string
          created_at?: string | null
          id?: number
          pergunta: string
          resposta: string
        }
        Update: {
          categoria?: string
          created_at?: string | null
          id?: number
          pergunta?: string
          resposta?: string
        }
        Relationships: []
      }
      faq_financeiro: {
        Row: {
          categoria: string
          created_at: string | null
          id: number
          pergunta: string
          resposta: string
        }
        Insert: {
          categoria: string
          created_at?: string | null
          id?: number
          pergunta: string
          resposta: string
        }
        Update: {
          categoria?: string
          created_at?: string | null
          id?: number
          pergunta?: string
          resposta?: string
        }
        Relationships: []
      }
      faq_geral: {
        Row: {
          categoria: string
          created_at: string | null
          id: number
          pergunta: string
          resposta: string
        }
        Insert: {
          categoria: string
          created_at?: string | null
          id?: number
          pergunta: string
          resposta: string
        }
        Update: {
          categoria?: string
          created_at?: string | null
          id?: number
          pergunta?: string
          resposta?: string
        }
        Relationships: []
      }
      faq_honey_blend: {
        Row: {
          categoria: string
          created_at: string | null
          id: number
          pergunta: string
          resposta: string
        }
        Insert: {
          categoria: string
          created_at?: string | null
          id?: number
          pergunta: string
          resposta: string
        }
        Update: {
          categoria?: string
          created_at?: string | null
          id?: number
          pergunta?: string
          resposta?: string
        }
        Relationships: []
      }
      faq_honey_fusion: {
        Row: {
          categoria: string
          created_at: string | null
          id: number
          pergunta: string
          resposta: string
        }
        Insert: {
          categoria: string
          created_at?: string | null
          id?: number
          pergunta: string
          resposta: string
        }
        Update: {
          categoria?: string
          created_at?: string | null
          id?: number
          pergunta?: string
          resposta?: string
        }
        Relationships: []
      }
      faq_logistica: {
        Row: {
          categoria: string
          created_at: string | null
          id: number
          pergunta: string
          resposta: string
        }
        Insert: {
          categoria: string
          created_at?: string | null
          id?: number
          pergunta: string
          resposta: string
        }
        Update: {
          categoria?: string
          created_at?: string | null
          id?: number
          pergunta?: string
          resposta?: string
        }
        Relationships: []
      }
      faq_parcerias: {
        Row: {
          categoria: string
          created_at: string | null
          id: number
          pergunta: string
          resposta: string
        }
        Insert: {
          categoria: string
          created_at?: string | null
          id?: number
          pergunta: string
          resposta: string
        }
        Update: {
          categoria?: string
          created_at?: string | null
          id?: number
          pergunta?: string
          resposta?: string
        }
        Relationships: []
      }
      faq_qualidade: {
        Row: {
          categoria: string
          created_at: string | null
          id: number
          pergunta: string
          resposta: string
        }
        Insert: {
          categoria: string
          created_at?: string | null
          id?: number
          pergunta: string
          resposta: string
        }
        Update: {
          categoria?: string
          created_at?: string | null
          id?: number
          pergunta?: string
          resposta?: string
        }
        Relationships: []
      }
      faturamento: {
        Row: {
          ala: string | null
          area: number | null
          categoria: string | null
          contratomaster: string | null
          cpfcnpj: string | null
          datafimcompetencia: string | null
          datainiciocompetencia: string | null
          dataio: string | null
          datapagamento: string | null
          dataprorrogocacao: string | null
          dataresumofimcompetencia: string | null
          dataresumoiniciocompetencia: string | null
          datavencimento: string | null
          descontocontratual: number | null
          descontos: number | null
          idcontrato: number
          idfichafinanceira: number
          idparcela: number
          idresumocontratrual: number
          inadimplencia: number | null
          local: string | null
          locatario: string | null
          luc: string | null
          mallloja: string | null
          mesanofaturamento: string | null
          nomerazaosocial: string | null
          parcela: string | null
          percentualreajuste: number | null
          piso: string | null
          reajuste: string | null
          resumocontratual: string | null
          rua: string | null
          shopping: string | null
          statuscliente: string | null
          statusparcela: string | null
          valorcorrecaomonetaria: number | null
          valorfaturado: number | null
          valorinativo: number | null
          valorjuros: number | null
          valormultamora: number | null
          valorpago: number | null
          valortotalaberto: number | null
          valortotalfaturado: number | null
          valortotalpago: number | null
          vigenciacontatoinicio: string | null
          vigenciacontatotermino: string | null
        }
        Insert: {
          ala?: string | null
          area?: number | null
          categoria?: string | null
          contratomaster?: string | null
          cpfcnpj?: string | null
          datafimcompetencia?: string | null
          datainiciocompetencia?: string | null
          dataio?: string | null
          datapagamento?: string | null
          dataprorrogocacao?: string | null
          dataresumofimcompetencia?: string | null
          dataresumoiniciocompetencia?: string | null
          datavencimento?: string | null
          descontocontratual?: number | null
          descontos?: number | null
          idcontrato: number
          idfichafinanceira: number
          idparcela: number
          idresumocontratrual: number
          inadimplencia?: number | null
          local?: string | null
          locatario?: string | null
          luc?: string | null
          mallloja?: string | null
          mesanofaturamento?: string | null
          nomerazaosocial?: string | null
          parcela?: string | null
          percentualreajuste?: number | null
          piso?: string | null
          reajuste?: string | null
          resumocontratual?: string | null
          rua?: string | null
          shopping?: string | null
          statuscliente?: string | null
          statusparcela?: string | null
          valorcorrecaomonetaria?: number | null
          valorfaturado?: number | null
          valorinativo?: number | null
          valorjuros?: number | null
          valormultamora?: number | null
          valorpago?: number | null
          valortotalaberto?: number | null
          valortotalfaturado?: number | null
          valortotalpago?: number | null
          vigenciacontatoinicio?: string | null
          vigenciacontatotermino?: string | null
        }
        Update: {
          ala?: string | null
          area?: number | null
          categoria?: string | null
          contratomaster?: string | null
          cpfcnpj?: string | null
          datafimcompetencia?: string | null
          datainiciocompetencia?: string | null
          dataio?: string | null
          datapagamento?: string | null
          dataprorrogocacao?: string | null
          dataresumofimcompetencia?: string | null
          dataresumoiniciocompetencia?: string | null
          datavencimento?: string | null
          descontocontratual?: number | null
          descontos?: number | null
          idcontrato?: number
          idfichafinanceira?: number
          idparcela?: number
          idresumocontratrual?: number
          inadimplencia?: number | null
          local?: string | null
          locatario?: string | null
          luc?: string | null
          mallloja?: string | null
          mesanofaturamento?: string | null
          nomerazaosocial?: string | null
          parcela?: string | null
          percentualreajuste?: number | null
          piso?: string | null
          reajuste?: string | null
          resumocontratual?: string | null
          rua?: string | null
          shopping?: string | null
          statuscliente?: string | null
          statusparcela?: string | null
          valorcorrecaomonetaria?: number | null
          valorfaturado?: number | null
          valorinativo?: number | null
          valorjuros?: number | null
          valormultamora?: number | null
          valorpago?: number | null
          valortotalaberto?: number | null
          valortotalfaturado?: number | null
          valortotalpago?: number | null
          vigenciacontatoinicio?: string | null
          vigenciacontatotermino?: string | null
        }
        Relationships: []
      }
      faturamento_lojista: {
        Row: {
          created_at: string
          id: number
          id_locatario: string | null
          mes_referencia: string | null
          nome_locatario: string | null
          valor_faturado: number | null
        }
        Insert: {
          created_at?: string
          id?: number
          id_locatario?: string | null
          mes_referencia?: string | null
          nome_locatario?: string | null
          valor_faturado?: number | null
        }
        Update: {
          created_at?: string
          id?: number
          id_locatario?: string | null
          mes_referencia?: string | null
          nome_locatario?: string | null
          valor_faturado?: number | null
        }
        Relationships: []
      }
      fechamento_mensal_teste: {
        Row: {
          aluguel_complementar: number | null
          aluguel_minimo: number | null
          ano_mes: string | null
          cdu: number | null
          confissao_divida_aluguel: number | null
          confissao_divida_enc_esp: number | null
          confissao_divida_fundo_promocao: number | null
          created_at: string
          encargo_comum: number | null
          encargo_especifico: number | null
          fundo_promocao: number | null
          fundo_reserva_cond: number | null
          id: number
          id_grupo: string | null
          IPTU: number | null
          locacao_diversas: number | null
          locatario: string | null
          luc: string | null
          merchandising: number | null
          multa_contratual: number | null
        }
        Insert: {
          aluguel_complementar?: number | null
          aluguel_minimo?: number | null
          ano_mes?: string | null
          cdu?: number | null
          confissao_divida_aluguel?: number | null
          confissao_divida_enc_esp?: number | null
          confissao_divida_fundo_promocao?: number | null
          created_at?: string
          encargo_comum?: number | null
          encargo_especifico?: number | null
          fundo_promocao?: number | null
          fundo_reserva_cond?: number | null
          id?: number
          id_grupo?: string | null
          IPTU?: number | null
          locacao_diversas?: number | null
          locatario?: string | null
          luc?: string | null
          merchandising?: number | null
          multa_contratual?: number | null
        }
        Update: {
          aluguel_complementar?: number | null
          aluguel_minimo?: number | null
          ano_mes?: string | null
          cdu?: number | null
          confissao_divida_aluguel?: number | null
          confissao_divida_enc_esp?: number | null
          confissao_divida_fundo_promocao?: number | null
          created_at?: string
          encargo_comum?: number | null
          encargo_especifico?: number | null
          fundo_promocao?: number | null
          fundo_reserva_cond?: number | null
          id?: number
          id_grupo?: string | null
          IPTU?: number | null
          locacao_diversas?: number | null
          locatario?: string | null
          luc?: string | null
          merchandising?: number | null
          multa_contratual?: number | null
        }
        Relationships: []
      }
      historico_itens_achados_perdidos: {
        Row: {
          action_description: string
          changed_by: string | null
          created_at: string | null
          id: number
          item_protocol_code: string
        }
        Insert: {
          action_description: string
          changed_by?: string | null
          created_at?: string | null
          id?: number
          item_protocol_code: string
        }
        Update: {
          action_description?: string
          changed_by?: string | null
          created_at?: string | null
          id?: number
          item_protocol_code?: string
        }
        Relationships: []
      }
      img_beeoz_sports: {
        Row: {
          categoria: string | null
          descricao: string | null
          id: number
          link: string | null
        }
        Insert: {
          categoria?: string | null
          descricao?: string | null
          id?: number
          link?: string | null
        }
        Update: {
          categoria?: string | null
          descricao?: string | null
          id?: number
          link?: string | null
        }
        Relationships: []
      }
      inadimplencia: {
        Row: {
          Boleto: string | null
          ContratoMaster: string | null
          Correcao: number | null
          CpfCnpj: string | null
          DataCompetenciaInicio: string | null
          DataCompetenciaTermino: string | null
          DataPagamento: string | null
          DataProcessamentoPagamento: string | null
          DataProrrogacao: string | null
          DataVencimento: string | null
          Desconto: number | null
          id: number
          imported_at: string | null
          Inadimplencia: number | null
          Juros: number | null
          Locatario: string | null
          LUC: string | null
          Multa: number | null
          NomeRazao: string | null
          Parcela: string | null
          ResumoContratual: string | null
          Shopping: string | null
          "Status Parcela": string | null
          StatusCliente: string | null
          UsuarioProcessamentoPagamento: string | null
          ValorFaturado: number | null
          ValorInativo: number | null
          ValorPago: number | null
        }
        Insert: {
          Boleto?: string | null
          ContratoMaster?: string | null
          Correcao?: number | null
          CpfCnpj?: string | null
          DataCompetenciaInicio?: string | null
          DataCompetenciaTermino?: string | null
          DataPagamento?: string | null
          DataProcessamentoPagamento?: string | null
          DataProrrogacao?: string | null
          DataVencimento?: string | null
          Desconto?: number | null
          id?: number
          imported_at?: string | null
          Inadimplencia?: number | null
          Juros?: number | null
          Locatario?: string | null
          LUC?: string | null
          Multa?: number | null
          NomeRazao?: string | null
          Parcela?: string | null
          ResumoContratual?: string | null
          Shopping?: string | null
          "Status Parcela"?: string | null
          StatusCliente?: string | null
          UsuarioProcessamentoPagamento?: string | null
          ValorFaturado?: number | null
          ValorInativo?: number | null
          ValorPago?: number | null
        }
        Update: {
          Boleto?: string | null
          ContratoMaster?: string | null
          Correcao?: number | null
          CpfCnpj?: string | null
          DataCompetenciaInicio?: string | null
          DataCompetenciaTermino?: string | null
          DataPagamento?: string | null
          DataProcessamentoPagamento?: string | null
          DataProrrogacao?: string | null
          DataVencimento?: string | null
          Desconto?: number | null
          id?: number
          imported_at?: string | null
          Inadimplencia?: number | null
          Juros?: number | null
          Locatario?: string | null
          LUC?: string | null
          Multa?: number | null
          NomeRazao?: string | null
          Parcela?: string | null
          ResumoContratual?: string | null
          Shopping?: string | null
          "Status Parcela"?: string | null
          StatusCliente?: string | null
          UsuarioProcessamentoPagamento?: string | null
          ValorFaturado?: number | null
          ValorInativo?: number | null
          ValorPago?: number | null
        }
        Relationships: []
      }
      itens_achados_perdidos: {
        Row: {
          brand_model: string | null
          category: string
          created_at: string | null
          current_status: string
          description: string
          distinguishing_features: string | null
          event_datetime: string
          id: number
          image_urls: Json | null
          informant_name: string
          informant_phone: string
          location: string
          main_color: string
          pipefy_card_id: string | null
          protocol_code: string
          record_type: string
          subcategory: string | null
        }
        Insert: {
          brand_model?: string | null
          category: string
          created_at?: string | null
          current_status?: string
          description: string
          distinguishing_features?: string | null
          event_datetime: string
          id?: number
          image_urls?: Json | null
          informant_name: string
          informant_phone: string
          location: string
          main_color: string
          pipefy_card_id?: string | null
          protocol_code: string
          record_type: string
          subcategory?: string | null
        }
        Update: {
          brand_model?: string | null
          category?: string
          created_at?: string | null
          current_status?: string
          description?: string
          distinguishing_features?: string | null
          event_datetime?: string
          id?: number
          image_urls?: Json | null
          informant_name?: string
          informant_phone?: string
          location?: string
          main_color?: string
          pipefy_card_id?: string | null
          protocol_code?: string
          record_type?: string
          subcategory?: string | null
        }
        Relationships: []
      }
      lista_espera_beeoz: {
        Row: {
          cidade: string | null
          created_at: string
          email: string | null
          id: number
          nome: string | null
          sessionId: string | null
          telefone: string | null
        }
        Insert: {
          cidade?: string | null
          created_at?: string
          email?: string | null
          id?: number
          nome?: string | null
          sessionId?: string | null
          telefone?: string | null
        }
        Update: {
          cidade?: string | null
          created_at?: string
          email?: string | null
          id?: number
          nome?: string | null
          sessionId?: string | null
          telefone?: string | null
        }
        Relationships: []
      }
      lojas_spb: {
        Row: {
          categoria: string | null
          descricao: string | null
          id: number
          img_url: string | null
          local: string | null
          nome: string
          site: string | null
          telefone: string | null
          whatsapp: string | null
        }
        Insert: {
          categoria?: string | null
          descricao?: string | null
          id?: number
          img_url?: string | null
          local?: string | null
          nome: string
          site?: string | null
          telefone?: string | null
          whatsapp?: string | null
        }
        Update: {
          categoria?: string | null
          descricao?: string | null
          id?: number
          img_url?: string | null
          local?: string | null
          nome?: string
          site?: string | null
          telefone?: string | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      monday_test: {
        Row: {
          coluna_pessoa: string | null
          coluna_resposavel: string | null
          coluna_status: string | null
          coluna_texto: string | null
          comentarios: string | null
          created_at: string
          elemento: string | null
          email: string | null
          enviado: boolean | null
          id: number
          id_elemento: string | null
          marcos_ti: string | null
          tiago_ti: string | null
        }
        Insert: {
          coluna_pessoa?: string | null
          coluna_resposavel?: string | null
          coluna_status?: string | null
          coluna_texto?: string | null
          comentarios?: string | null
          created_at?: string
          elemento?: string | null
          email?: string | null
          enviado?: boolean | null
          id?: number
          id_elemento?: string | null
          marcos_ti?: string | null
          tiago_ti?: string | null
        }
        Update: {
          coluna_pessoa?: string | null
          coluna_resposavel?: string | null
          coluna_status?: string | null
          coluna_texto?: string | null
          comentarios?: string | null
          created_at?: string
          elemento?: string | null
          email?: string | null
          enviado?: boolean | null
          id?: number
          id_elemento?: string | null
          marcos_ti?: string | null
          tiago_ti?: string | null
        }
        Relationships: []
      }
      monday_test_roberty: {
        Row: {
          created_at: string
          grupo_criado: boolean | null
          id: number
          id_grupo: string | null
          nome_grupo: string | null
        }
        Insert: {
          created_at?: string
          grupo_criado?: boolean | null
          id?: number
          id_grupo?: string | null
          nome_grupo?: string | null
        }
        Update: {
          created_at?: string
          grupo_criado?: boolean | null
          id?: number
          id_grupo?: string | null
          nome_grupo?: string | null
        }
        Relationships: []
      }
      movies: {
        Row: {
          classification: string | null
          created_at: string
          duration: string | null
          genre: string | null
          id: number
          image: string | null
          title: string | null
        }
        Insert: {
          classification?: string | null
          created_at?: string
          duration?: string | null
          genre?: string | null
          id?: number
          image?: string | null
          title?: string | null
        }
        Update: {
          classification?: string | null
          created_at?: string
          duration?: string | null
          genre?: string | null
          id?: number
          image?: string | null
          title?: string | null
        }
        Relationships: []
      }
      movies_v2: {
        Row: {
          classification: string | null
          created_at: string
          duration: string | null
          genre: string | null
          id: number
          image: string | null
          sessions: Json | null
          title: string | null
        }
        Insert: {
          classification?: string | null
          created_at?: string
          duration?: string | null
          genre?: string | null
          id?: number
          image?: string | null
          sessions?: Json | null
          title?: string | null
        }
        Update: {
          classification?: string | null
          created_at?: string
          duration?: string | null
          genre?: string | null
          id?: number
          image?: string | null
          sessions?: Json | null
          title?: string | null
        }
        Relationships: []
      }
      movimentacoes_financeiras: {
        Row: {
          Agencia: string | null
          Conta: string | null
          ContaOrcamentaria: string | null
          ContratoMaster: string | null
          CpfCnpj: string | null
          created_at: string | null
          Credito: number | null
          Data: string
          Debito: number | null
          Fornecedor: string | null
          Historico: string | null
          id: number
          IdContaBancaria: number | null
          IdContratoMaster: number | null
          IdFichaCP: number | null
          IdMovimentacaoComplementar: number | null
          IdPagamentoCP: number | null
          IdParcela: number | null
          IdVencimentoCP: number | null
          Movimentacao: string | null
          NomeBanco: string | null
          NomeFantasia: string | null
          NumeracaoConta: string | null
          NumeroDocumento: string | null
          NumeroFichaCP: string | null
          NumeroLuc: string | null
          NumeroMovimentacaoComplementar: string | null
          Origem: string | null
          PagamentoCP: string | null
          RazaoSocial: string | null
          RecebimentoAC: string | null
          ResumoContratual: string | null
          Setor: string | null
          Shopping: string | null
          StatusParcela: string | null
          TipoDocumento: string | null
          Valor: number | null
        }
        Insert: {
          Agencia?: string | null
          Conta?: string | null
          ContaOrcamentaria?: string | null
          ContratoMaster?: string | null
          CpfCnpj?: string | null
          created_at?: string | null
          Credito?: number | null
          Data: string
          Debito?: number | null
          Fornecedor?: string | null
          Historico?: string | null
          id?: number
          IdContaBancaria?: number | null
          IdContratoMaster?: number | null
          IdFichaCP?: number | null
          IdMovimentacaoComplementar?: number | null
          IdPagamentoCP?: number | null
          IdParcela?: number | null
          IdVencimentoCP?: number | null
          Movimentacao?: string | null
          NomeBanco?: string | null
          NomeFantasia?: string | null
          NumeracaoConta?: string | null
          NumeroDocumento?: string | null
          NumeroFichaCP?: string | null
          NumeroLuc?: string | null
          NumeroMovimentacaoComplementar?: string | null
          Origem?: string | null
          PagamentoCP?: string | null
          RazaoSocial?: string | null
          RecebimentoAC?: string | null
          ResumoContratual?: string | null
          Setor?: string | null
          Shopping?: string | null
          StatusParcela?: string | null
          TipoDocumento?: string | null
          Valor?: number | null
        }
        Update: {
          Agencia?: string | null
          Conta?: string | null
          ContaOrcamentaria?: string | null
          ContratoMaster?: string | null
          CpfCnpj?: string | null
          created_at?: string | null
          Credito?: number | null
          Data?: string
          Debito?: number | null
          Fornecedor?: string | null
          Historico?: string | null
          id?: number
          IdContaBancaria?: number | null
          IdContratoMaster?: number | null
          IdFichaCP?: number | null
          IdMovimentacaoComplementar?: number | null
          IdPagamentoCP?: number | null
          IdParcela?: number | null
          IdVencimentoCP?: number | null
          Movimentacao?: string | null
          NomeBanco?: string | null
          NomeFantasia?: string | null
          NumeracaoConta?: string | null
          NumeroDocumento?: string | null
          NumeroFichaCP?: string | null
          NumeroLuc?: string | null
          NumeroMovimentacaoComplementar?: string | null
          Origem?: string | null
          PagamentoCP?: string | null
          RazaoSocial?: string | null
          RecebimentoAC?: string | null
          ResumoContratual?: string | null
          Setor?: string | null
          Shopping?: string | null
          StatusParcela?: string | null
          TipoDocumento?: string | null
          Valor?: number | null
        }
        Relationships: []
      }
      n8n_chat_histories_30_06_2025: {
        Row: {
          id: number
          message: Json
          session_id: string
        }
        Insert: {
          id?: number
          message: Json
          session_id: string
        }
        Update: {
          id?: number
          message?: Json
          session_id?: string
        }
        Relationships: []
      }
      orcamentario_chat_histories: {
        Row: {
          id: number
          message: Json
          session_id: string
        }
        Insert: {
          id?: number
          message: Json
          session_id: string
        }
        Update: {
          id?: number
          message?: Json
          session_id?: string
        }
        Relationships: []
      }
      Pagamento_Empreendedor: {
        Row: {
          agencia: string | null
          ala: string | null
          banco: string | null
          conta: string | null
          contacontabil: string | null
          contacontabilcompleta: string | null
          contaorcamentaria1nivel: string | null
          contaorcamentaria1niveldesc: string | null
          contaorcamentaria2nivel: string | null
          contaorcamentaria2niveldesc: string | null
          contaorcamentaria3nivel: string | null
          contaorcamentaria3niveldesc: string | null
          contaorcamentaria4nivel: string | null
          contaorcamentaria4niveldesc: string | null
          contaorcamentaria5nivel: string | null
          contaorcamentaria5niveldesc: string | null
          correcao: number | null
          cpfcnpj: string | null
          dataemissao: string | null
          datalancamento: string | null
          datapagamento: string | null
          dataprorrogacao: string | null
          datavencimento: string | null
          desconto: number | null
          descricaocontacontabil: string | null
          empresasetor: string | null
          formapagamento: string | null
          fornecedor: string | null
          historico: string | null
          idcontacontabil: number | null
          idcontaorcamentaria: number | null
          idfichacp: number
          idpagamentocp: number | null
          idsetor: number | null
          idvencimentocp: number | null
          juros: number | null
          multa: number | null
          nomefantasia: string | null
          numerocp: string | null
          numerodocumento: string | null
          planocontabil: string | null
          planoorcamentario: string | null
          previsao: string | null
          setorcompleto: string | null
          shopping: string | null
          statuspagamento: string | null
          statusvencimento: string | null
          tipocp: string | null
          tipodocumento: string | null
          valorcontacontabil: number | null
          valorcp: number | null
          valorliquido: number | null
          valorpago: number | null
          valorparcela: number | null
          valorrateio: number | null
          valorsetor: number | null
          valorvencimento: number | null
        }
        Insert: {
          agencia?: string | null
          ala?: string | null
          banco?: string | null
          conta?: string | null
          contacontabil?: string | null
          contacontabilcompleta?: string | null
          contaorcamentaria1nivel?: string | null
          contaorcamentaria1niveldesc?: string | null
          contaorcamentaria2nivel?: string | null
          contaorcamentaria2niveldesc?: string | null
          contaorcamentaria3nivel?: string | null
          contaorcamentaria3niveldesc?: string | null
          contaorcamentaria4nivel?: string | null
          contaorcamentaria4niveldesc?: string | null
          contaorcamentaria5nivel?: string | null
          contaorcamentaria5niveldesc?: string | null
          correcao?: number | null
          cpfcnpj?: string | null
          dataemissao?: string | null
          datalancamento?: string | null
          datapagamento?: string | null
          dataprorrogacao?: string | null
          datavencimento?: string | null
          desconto?: number | null
          descricaocontacontabil?: string | null
          empresasetor?: string | null
          formapagamento?: string | null
          fornecedor?: string | null
          historico?: string | null
          idcontacontabil?: number | null
          idcontaorcamentaria?: number | null
          idfichacp: number
          idpagamentocp?: number | null
          idsetor?: number | null
          idvencimentocp?: number | null
          juros?: number | null
          multa?: number | null
          nomefantasia?: string | null
          numerocp?: string | null
          numerodocumento?: string | null
          planocontabil?: string | null
          planoorcamentario?: string | null
          previsao?: string | null
          setorcompleto?: string | null
          shopping?: string | null
          statuspagamento?: string | null
          statusvencimento?: string | null
          tipocp?: string | null
          tipodocumento?: string | null
          valorcontacontabil?: number | null
          valorcp?: number | null
          valorliquido?: number | null
          valorpago?: number | null
          valorparcela?: number | null
          valorrateio?: number | null
          valorsetor?: number | null
          valorvencimento?: number | null
        }
        Update: {
          agencia?: string | null
          ala?: string | null
          banco?: string | null
          conta?: string | null
          contacontabil?: string | null
          contacontabilcompleta?: string | null
          contaorcamentaria1nivel?: string | null
          contaorcamentaria1niveldesc?: string | null
          contaorcamentaria2nivel?: string | null
          contaorcamentaria2niveldesc?: string | null
          contaorcamentaria3nivel?: string | null
          contaorcamentaria3niveldesc?: string | null
          contaorcamentaria4nivel?: string | null
          contaorcamentaria4niveldesc?: string | null
          contaorcamentaria5nivel?: string | null
          contaorcamentaria5niveldesc?: string | null
          correcao?: number | null
          cpfcnpj?: string | null
          dataemissao?: string | null
          datalancamento?: string | null
          datapagamento?: string | null
          dataprorrogacao?: string | null
          datavencimento?: string | null
          desconto?: number | null
          descricaocontacontabil?: string | null
          empresasetor?: string | null
          formapagamento?: string | null
          fornecedor?: string | null
          historico?: string | null
          idcontacontabil?: number | null
          idcontaorcamentaria?: number | null
          idfichacp?: number
          idpagamentocp?: number | null
          idsetor?: number | null
          idvencimentocp?: number | null
          juros?: number | null
          multa?: number | null
          nomefantasia?: string | null
          numerocp?: string | null
          numerodocumento?: string | null
          planocontabil?: string | null
          planoorcamentario?: string | null
          previsao?: string | null
          setorcompleto?: string | null
          shopping?: string | null
          statuspagamento?: string | null
          statusvencimento?: string | null
          tipocp?: string | null
          tipodocumento?: string | null
          valorcontacontabil?: number | null
          valorcp?: number | null
          valorliquido?: number | null
          valorpago?: number | null
          valorparcela?: number | null
          valorrateio?: number | null
          valorsetor?: number | null
          valorvencimento?: number | null
        }
        Relationships: []
      }
      performance_alerts: {
        Row: {
          account_id: string
          action_required: string | null
          alert_type: string
          created_at: string | null
          id: number
          message: string
          sector: string
          severity: string
          slack_sent: boolean | null
          status: string | null
        }
        Insert: {
          account_id: string
          action_required?: string | null
          alert_type: string
          created_at?: string | null
          id?: number
          message: string
          sector: string
          severity: string
          slack_sent?: boolean | null
          status?: string | null
        }
        Update: {
          account_id?: string
          action_required?: string | null
          alert_type?: string
          created_at?: string | null
          id?: number
          message?: string
          sector?: string
          severity?: string
          slack_sent?: boolean | null
          status?: string | null
        }
        Relationships: []
      }
      spb: {
        Row: {
          content: string | null
          embedding: string | null
          id: number
          metadata: Json | null
        }
        Insert: {
          content?: string | null
          embedding?: string | null
          id?: number
          metadata?: Json | null
        }
        Update: {
          content?: string | null
          embedding?: string | null
          id?: number
          metadata?: Json | null
        }
        Relationships: []
      }
      spb_chat_histories: {
        Row: {
          id: number
          message: Json
          session_id: string
        }
        Insert: {
          id?: number
          message: Json
          session_id: string
        }
        Update: {
          id?: number
          message?: Json
          session_id?: string
        }
        Relationships: []
      }
      spb_chat_histories_05_06_2025: {
        Row: {
          id: number
          message: Json
          session_id: string
        }
        Insert: {
          id?: number
          message: Json
          session_id: string
        }
        Update: {
          id?: number
          message?: Json
          session_id?: string
        }
        Relationships: []
      }
      spb_chat_histories_06_06_2025: {
        Row: {
          id: number
          message: Json
          session_id: string
        }
        Insert: {
          id?: number
          message: Json
          session_id: string
        }
        Update: {
          id?: number
          message?: Json
          session_id?: string
        }
        Relationships: []
      }
      spb_chat_histories_teste_2020_06_10: {
        Row: {
          id: number
          message: Json
          session_id: string
        }
        Insert: {
          id?: number
          message: Json
          session_id: string
        }
        Update: {
          id?: number
          message?: Json
          session_id?: string
        }
        Relationships: []
      }
      "tabela grupo monday": {
        Row: {
          created_at: string
          id: number
          id_grupo: string | null
          nome_grupo: string | null
        }
        Insert: {
          created_at?: string
          id?: number
          id_grupo?: string | null
          nome_grupo?: string | null
        }
        Update: {
          created_at?: string
          id?: number
          id_grupo?: string | null
          nome_grupo?: string | null
        }
        Relationships: []
      }
      wix_bs_bhs_analytics_cache: {
        Row: {
          analytics_data: Json
          created_at: string | null
          id: string
          insights: Json | null
          period: string | null
          summary: Json | null
          updated_at: string | null
        }
        Insert: {
          analytics_data?: Json
          created_at?: string | null
          id?: string
          insights?: Json | null
          period?: string | null
          summary?: Json | null
          updated_at?: string | null
        }
        Update: {
          analytics_data?: Json
          created_at?: string | null
          id?: string
          insights?: Json | null
          period?: string | null
          summary?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      wix_bs_bhs_kpi_cache: {
        Row: {
          calculated_at: string | null
          expires_at: string | null
          id: string
          kpi_data: Json
          kpi_type: string
        }
        Insert: {
          calculated_at?: string | null
          expires_at?: string | null
          id?: string
          kpi_data?: Json
          kpi_type: string
        }
        Update: {
          calculated_at?: string | null
          expires_at?: string | null
          id?: string
          kpi_data?: Json
          kpi_type?: string
        }
        Relationships: []
      }
      wix_bs_bhs_orders_cache: {
        Row: {
          created_at: string | null
          id: string
          last_sync: string | null
          orders_data: Json
          summary: Json | null
          total_orders: number | null
          total_revenue: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_sync?: string | null
          orders_data?: Json
          summary?: Json | null
          total_orders?: number | null
          total_revenue?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          last_sync?: string | null
          orders_data?: Json
          summary?: Json | null
          total_orders?: number | null
          total_revenue?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      vw_sector_summary: {
        Row: {
          avg_ctr: number | null
          last_update: string | null
          sector: string | null
          total_ads: number | null
          total_clicks: number | null
          total_impressions: number | null
          total_spend: number | null
        }
        Relationships: []
      }
      vw_top_performers: {
        Row: {
          account_name: string | null
          ad_name: string | null
          campaign_name: string | null
          clicks: number | null
          cost_per_result: number | null
          ctr: number | null
          results: number | null
          sector: string | null
          spend: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      binary_quantize: {
        Args: { "": string } | { "": unknown }
        Returns: unknown
      }
      check_table_exists: {
        Args: { table_name: string }
        Returns: boolean
      }
      execute_sql: {
        Args: { sql: string }
        Returns: undefined
      }
      halfvec_avg: {
        Args: { "": number[] }
        Returns: unknown
      }
      halfvec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      halfvec_send: {
        Args: { "": unknown }
        Returns: string
      }
      halfvec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      hnsw_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_sparsevec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnswhandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      insert_daily_summary: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      ivfflat_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflathandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      l2_norm: {
        Args: { "": unknown } | { "": unknown }
        Returns: number
      }
      l2_normalize: {
        Args: { "": string } | { "": unknown } | { "": unknown }
        Returns: unknown
      }
      match_beeoz_nutricional_documents: {
        Args: { query_embedding: string; match_count?: number; filter?: Json }
        Returns: {
          id: number
          content: string
          metadata: Json
          similarity: number
        }[]
      }
      match_beeoz_sports_documents: {
        Args: { query_embedding: string; match_count?: number; filter?: Json }
        Returns: {
          id: number
          content: string
          metadata: Json
          similarity: number
        }[]
      }
      match_spb: {
        Args: { query_embedding: string; match_count?: number; filter?: Json }
        Returns: {
          id: number
          content: string
          metadata: Json
          similarity: number
        }[]
      }
      sparsevec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      sparsevec_send: {
        Args: { "": unknown }
        Returns: string
      }
      sparsevec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      vector_avg: {
        Args: { "": number[] }
        Returns: string
      }
      vector_dims: {
        Args: { "": string } | { "": unknown }
        Returns: number
      }
      vector_norm: {
        Args: { "": string }
        Returns: number
      }
      vector_out: {
        Args: { "": string }
        Returns: unknown
      }
      vector_send: {
        Args: { "": string }
        Returns: string
      }
      vector_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
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
