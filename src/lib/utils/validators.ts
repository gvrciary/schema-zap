import { SQLDialect, type Table } from '$lib/types';
import { REQUIRED_LENGTH_TYPES, OPTIONAL_LENGTH_TYPES } from '$lib/constants';

export function isValidTableName(name: string, visualTables: Table[]): boolean {
  if (!name.trim()) return false;
  if (visualTables.some((t) => t.name.toLowerCase() === name.trim().toLowerCase())) return false;
  return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name);
}

export function requiresLength(dataType: string, selectedDialect: SQLDialect): boolean {
  const requiredTypes = REQUIRED_LENGTH_TYPES[selectedDialect] || [];
  return requiredTypes.includes(dataType.toUpperCase());
}

export function canHaveLength(dataType: string, selectedDialect: SQLDialect): boolean {
  const requiredTypes = REQUIRED_LENGTH_TYPES[selectedDialect] || [];
  const optionalTypes = OPTIONAL_LENGTH_TYPES[selectedDialect] || [];
  return (
    requiredTypes.includes(dataType.toUpperCase()) ||
    optionalTypes.includes(dataType.toUpperCase())
  );
}

export function isFeatureSupported(feature: string, selectedDialect: SQLDialect): boolean {
  switch (feature) {
    case 'autoIncrement':
      return selectedDialect !== SQLDialect.POSTGRESQL;
    case 'foreignKey':
      return true;
    case 'unique':
      return true;
    case 'defaultValue':
      return true;
    default:
      return true;
  }
}

export function tableHasPrimaryKey(tableName: string, visualTables: Table[], excludeColumn: string = ''): boolean {
  const table = visualTables.find((t) => t.name === tableName);
  if (!table) return false;
  
  return table.columns.some((column) => column.primaryKey && column.name !== excludeColumn);
}
