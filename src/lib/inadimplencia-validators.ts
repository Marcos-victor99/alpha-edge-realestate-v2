import { z } from 'zod';

// Schema Zod para validação de dados de inadimplência
export const InadimplenciaSchema = z.object({
  id: z.number().int().positive(),
  Shopping: z.string().nullable().transform(val => val?.trim() || null),
  LUC: z.string().nullable().transform(val => val?.trim() || null),
  ContratoMaster: z.string().nullable().transform(val => val?.trim() || null),
  Locatario: z.string().nullable().transform(val => val?.trim() || null),
  NomeRazao: z.string().nullable().transform(val => val?.trim() || null),
  CpfCnpj: z.string().nullable().transform(val => val?.replace(/[^\d]/g, '') || null),
  StatusCliente: z.string().nullable().transform(val => val?.trim() || null),
  Parcela: z.string().nullable().transform(val => val?.trim() || null),
  "Status Parcela": z.string().nullable().transform(val => val?.trim() || null),
  
  // Validação de datas com tratamento robusto
  DataCompetenciaInicio: z.string().nullable().transform(val => {
    if (!val) return null;
    try {
      return new Date(val).toISOString();
    } catch {
      return null;
    }
  }),
  DataCompetenciaTermino: z.string().nullable().transform(val => {
    if (!val) return null;
    try {
      return new Date(val).toISOString();
    } catch {
      return null;
    }
  }),
  DataVencimento: z.string().nullable().transform(val => {
    if (!val) return null;
    try {
      return new Date(val).toISOString();
    } catch {
      return null;
    }
  }),
  DataProrrogacao: z.string().nullable().transform(val => {
    if (!val) return null;
    try {
      return new Date(val).toISOString();
    } catch {
      return null;
    }
  }),
  DataPagamento: z.string().nullable().transform(val => {
    if (!val) return null;
    try {
      return new Date(val).toISOString();
    } catch {
      return null;
    }
  }),
  DataProcessamentoPagamento: z.string().nullable().transform(val => {
    if (!val) return null;
    try {
      return new Date(val).toISOString();
    } catch {
      return null;
    }
  }),
  
  Boleto: z.string().nullable().transform(val => val?.trim() || null),
  ResumoContratual: z.string().nullable().transform(val => val?.trim() || null),
  UsuarioProcessamentoPagamento: z.string().nullable().transform(val => val?.trim() || null),
  imported_at: z.string().nullable().transform(val => {
    if (!val) return null;
    try {
      return new Date(val).toISOString();
    } catch {
      return null;
    }
  }),
  
  // Validação de valores monetários com sanitização
  ValorFaturado: z.number().nullable().transform(val => {
    if (val === null || val === undefined) return 0;
    return Math.max(0, Number(val) || 0);
  }),
  Desconto: z.number().nullable().transform(val => {
    if (val === null || val === undefined) return 0;
    return Math.max(0, Number(val) || 0);
  }),
  Correcao: z.number().nullable().transform(val => {
    if (val === null || val === undefined) return 0;
    return Number(val) || 0; // Pode ser negativo
  }),
  Juros: z.number().nullable().transform(val => {
    if (val === null || val === undefined) return 0;
    return Math.max(0, Number(val) || 0);
  }),
  Multa: z.number().nullable().transform(val => {
    if (val === null || val === undefined) return 0;
    return Math.max(0, Number(val) || 0);
  }),
  ValorPago: z.number().nullable().transform(val => {
    if (val === null || val === undefined) return 0;
    return Math.max(0, Number(val) || 0);
  }),
  ValorInativo: z.number().nullable().transform(val => {
    if (val === null || val === undefined) return 0;
    return Math.max(0, Number(val) || 0);
  }),
  Inadimplencia: z.number().nullable().transform(val => {
    if (val === null || val === undefined) return 0;
    return Math.max(0, Number(val) || 0);
  }),
});

// Schema para filtros
export const InadimplenciaFiltersSchema = z.object({
  shopping: z.array(z.string()).optional(),
  statusCliente: z.array(z.string()).optional(),
  statusParcela: z.array(z.string()).optional(),
  periodo: z.object({
    inicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    fim: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
  }).optional(),
  valorMinimo: z.number().min(0).optional(),
  valorMaximo: z.number().min(0).optional(),
  showPagos: z.boolean().optional()
});

// Schema para paginação
export const InadimplenciaPaginationSchema = z.object({
  limit: z.number().int().min(1).max(5000).optional(),
  offset: z.number().int().min(0).optional()
});

// Funções de validação
export function validateInadimplenciaRecord(data: unknown) {
  try {
    return {
      success: true,
      data: InadimplenciaSchema.parse(data),
      errors: null
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        data: null,
        errors: error.issues.map(issue => ({
          field: issue.path.join('.'),
          message: issue.message,
          value: issue.input
        }))
      };
    }
    return {
      success: false,
      data: null,
      errors: [{ field: 'unknown', message: 'Erro de validação desconhecido', value: data }]
    };
  }
}

export function validateInadimplenciaFilters(filters: unknown) {
  try {
    return {
      success: true,
      data: InadimplenciaFiltersSchema.parse(filters),
      errors: null
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        data: null,
        errors: error.issues
      };
    }
    return {
      success: false,
      data: null,
      errors: [{ message: 'Erro de validação de filtros' }]
    };
  }
}

export function validateInadimplenciaPagination(pagination: unknown) {
  try {
    return {
      success: true,
      data: InadimplenciaPaginationSchema.parse(pagination),
      errors: null
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        data: null,
        errors: error.issues
      };
    }
    return {
      success: false,
      data: null,
      errors: [{ message: 'Erro de validação de paginação' }]
    };
  }
}

// Função para sanitizar e validar um array de registros
export function sanitizeInadimplenciaRecords(records: unknown[]): {
  validRecords: InadimplenciaValidated[];
  invalidRecords: { index: number; record: unknown }[];
  errors: { index: number; errors: unknown; record: unknown }[];
} {
  const validRecords: InadimplenciaValidated[] = [];
  const invalidRecords: { index: number; record: unknown }[] = [];
  const errors: { index: number; errors: unknown; record: unknown }[] = [];

  records.forEach((record, index) => {
    const validation = validateInadimplenciaRecord(record);
    
    if (validation.success) {
      validRecords.push(validation.data);
    } else {
      invalidRecords.push({ index, record });
      errors.push({
        index,
        errors: validation.errors,
        record: record
      });
    }
  });

  return { validRecords, invalidRecords, errors };
}

// Funções de utilidade para análise de dados
export function calculateDataQuality(records: InadimplenciaValidated[]): {
  completeness: number;
  validity: number;
  consistency: number;
  timeliness: number;
  overall: number;
} {
  if (records.length === 0) {
    return { completeness: 0, validity: 0, consistency: 0, timeliness: 0, overall: 0 };
  }

  // Completeness: % de campos obrigatórios preenchidos
  const requiredFields = ['Shopping', 'Locatario', 'ValorFaturado', 'DataVencimento'];
  let completeRecords = 0;
  
  records.forEach(record => {
    const hasAllRequired = requiredFields.every(field => 
      record[field] !== null && record[field] !== undefined && record[field] !== ''
    );
    if (hasAllRequired) completeRecords++;
  });
  
  const completeness = (completeRecords / records.length) * 100;

  // Validity: % de registros com valores válidos
  let validRecords = 0;
  records.forEach(record => {
    const hasValidValues = 
      record.ValorFaturado >= 0 &&
      record.Inadimplencia >= 0 &&
      record.ValorPago >= 0 &&
      (record.DataVencimento ? new Date(record.DataVencimento).getTime() > 0 : true);
    if (hasValidValues) validRecords++;
  });
  
  const validity = (validRecords / records.length) * 100;

  // Consistency: Consistência entre campos relacionados
  let consistentRecords = 0;
  records.forEach(record => {
    const isConsistent = 
      record.ValorPago <= record.ValorFaturado &&
      record.Inadimplencia >= 0 &&
      (record.ValorFaturado >= (record.ValorPago + record.Inadimplencia) * 0.9); // Tolerância de 10%
    if (isConsistent) consistentRecords++;
  });
  
  const consistency = (consistentRecords / records.length) * 100;

  // Timeliness: % de registros com datas recentes (últimos 2 anos)
  const twoYearsAgo = new Date();
  twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
  
  let timelyRecords = 0;
  records.forEach(record => {
    if (record.DataVencimento) {
      const vencimento = new Date(record.DataVencimento);
      if (vencimento >= twoYearsAgo) timelyRecords++;
    }
  });
  
  const timeliness = records.length > 0 ? (timelyRecords / records.length) * 100 : 0;

  // Overall quality score
  const overall = (completeness + validity + consistency + timeliness) / 4;

  return {
    completeness: Math.round(completeness * 100) / 100,
    validity: Math.round(validity * 100) / 100,
    consistency: Math.round(consistency * 100) / 100,
    timeliness: Math.round(timeliness * 100) / 100,
    overall: Math.round(overall * 100) / 100
  };
}

export type InadimplenciaValidated = z.infer<typeof InadimplenciaSchema>;
export type InadimplenciaFiltersValidated = z.infer<typeof InadimplenciaFiltersSchema>;
export type InadimplenciaPaginationValidated = z.infer<typeof InadimplenciaPaginationSchema>;