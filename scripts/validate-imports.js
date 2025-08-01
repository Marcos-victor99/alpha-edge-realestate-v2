#!/usr/bin/env node

/**
 * Script de validação automática de imports
 * Verifica se todos os ícones Lucide React estão corretamente importados
 */

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

const DASHBOARD_PATTERN = 'src/components/Dashboard/*.tsx';
const LUCIDE_IMPORT_REGEX = /import\s*{\s*([^}]+)\s*}\s*from\s*['"]lucide-react['"];?/;
const ICON_USAGE_REGEX = /<([A-Z][a-zA-Z0-9]*)/g;

class ImportValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
  }

  async validateDashboards() {
    console.log('🔍 Validando imports de ícones Lucide React nos dashboards...\n');
    
    const dashboardFiles = await glob(DASHBOARD_PATTERN);
    
    for (const file of dashboardFiles) {
      await this.validateFile(file);
    }
    
    this.printResults();
    return this.errors.length === 0;
  }

  async validateFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const fileName = path.basename(filePath);
    
    console.log(`📄 Verificando ${fileName}...`);
    
    // Extrair imports do lucide-react
    const importedIcons = this.extractLucideImports(content);
    
    // Extrair ícones usados no JSX
    const usedIcons = this.extractUsedIcons(content);
    
    // Verificar ícones usados mas não importados
    const missingImports = usedIcons.filter(icon => !importedIcons.includes(icon));
    
    // Verificar ícones importados mas não usados
    const unusedImports = importedIcons.filter(icon => !usedIcons.includes(icon));
    
    if (missingImports.length > 0) {
      this.errors.push({
        file: fileName,
        type: 'missing_imports',
        icons: missingImports,
        message: `Ícones usados mas não importados: ${missingImports.join(', ')}`
      });
      console.log(`  ❌ Ícones não importados: ${missingImports.join(', ')}`);
    }
    
    if (unusedImports.length > 0) {
      this.warnings.push({
        file: fileName,
        type: 'unused_imports',
        icons: unusedImports,
        message: `Ícones importados mas não usados: ${unusedImports.join(', ')}`
      });
      console.log(`  ⚠️  Ícones não usados: ${unusedImports.join(', ')}`);
    }
    
    if (missingImports.length === 0 && unusedImports.length === 0) {
      console.log(`  ✅ Todos os imports estão corretos`);
    }
    
    console.log();
  }

  extractLucideImports(content) {
    const match = content.match(LUCIDE_IMPORT_REGEX);
    if (!match) return [];
    
    return match[1]
      .split(',')
      .map(icon => icon.trim())
      .filter(icon => icon && /^[A-Z]/.test(icon));
  }

  extractUsedIcons(content) {
    const matches = [...content.matchAll(ICON_USAGE_REGEX)];
    const icons = matches
      .map(match => match[1])
      .filter(icon => /^[A-Z][a-zA-Z0-9]*$/.test(icon))
      .filter(icon => !this.isTremorComponent(icon))
      .filter(icon => !this.isReactComponent(icon))
      .filter(icon => !this.isCustomComponent(icon));
    
    return [...new Set(icons)]; // Remove duplicatas
  }

  isTremorComponent(iconName) {
    const tremorComponents = [
      'Card', 'Title', 'Text', 'Grid', 'Flex', 'Badge', 'Metric',
      'BarChart', 'AreaChart', 'LineChart', 'DonutChart', 'List', 
      'ListItem', 'Button', 'Bold', 'Italic'
    ];
    return tremorComponents.includes(iconName);
  }

  isReactComponent(iconName) {
    const reactComponents = [
      'Suspense', 'Fragment', 'Component', 'PureComponent'
    ];
    return reactComponents.includes(iconName);
  }

  isCustomComponent(iconName) {
    const customComponents = [
      // Componentes UI customizados
      'KpiCard', 'ChartCard', 'ComparativeKpiCard', 'ComparisonChartCard',
      'InsightCard', 'InsightGrid', 'ErrorBoundary', 'ChartErrorFallback',
      'CategoryBarCard', 'CompactCategoryBarCard', 'MiniKpiCard',
      
      // Componentes de tooltip customizados
      'FinancialTooltip', 'InadimplenciaTooltip', 'NOITooltip',
      
      // Componentes de gráficos
      'TreemapDrilldown', 'HeatmapAnalysis', 'SankeyFlow', 'NetworkGraph',
      
      // Componentes Recharts
      'ResponsiveContainer', 'CartesianGrid', 'XAxis', 'YAxis', 'Area',
      'ScatterChart', 'Scatter', 'ReferenceLine',
      
      // Componentes shadcn/ui
      'CardHeader', 'CardTitle', 'CardContent'
    ];
    return customComponents.includes(iconName);
  }

  printResults() {
    console.log('📊 RESULTADOS DA VALIDAÇÃO\n');
    
    if (this.errors.length === 0 && this.warnings.length === 0) {
      console.log('🎉 Parabéns! Todos os imports estão corretos.\n');
      return;
    }
    
    if (this.errors.length > 0) {
      console.log('❌ ERROS ENCONTRADOS:');
      this.errors.forEach(error => {
        console.log(`  📁 ${error.file}: ${error.message}`);
      });
      console.log();
    }
    
    if (this.warnings.length > 0) {
      console.log('⚠️  AVISOS:');
      this.warnings.forEach(warning => {
        console.log(`  📁 ${warning.file}: ${warning.message}`);
      });
      console.log();
    }
    
    console.log(`Total: ${this.errors.length} erro(s), ${this.warnings.length} aviso(s)\n`);
  }

  generateFixSuggestions() {
    if (this.errors.length === 0) return;
    
    console.log('🔧 SUGESTÕES DE CORREÇÃO:\n');
    
    this.errors.forEach(error => {
      if (error.type === 'missing_imports') {
        console.log(`📁 ${error.file}:`);
        console.log(`  Adicione aos imports: ${error.icons.join(', ')}`);
        console.log(`  
  import { 
    // ... outros imports
    ${error.icons.join(',\n    ')}
  } from "lucide-react";
        `);
      }
    });
  }
}

// Executar validação
async function main() {
  const validator = new ImportValidator();
  const isValid = await validator.validateDashboards();
  
  if (!isValid) {
    validator.generateFixSuggestions();
    process.exit(1);
  }
  
  process.exit(0);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default ImportValidator;