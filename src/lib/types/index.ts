export interface Column {
  name: string;
  type: string;
  nullable: boolean;
  primaryKey: boolean;
  foreignKey?: {
    table: string;
    column: string;
  };
  defaultValue?: string;
  autoIncrement?: boolean;
  unique?: boolean;
  length?: number;
}

export interface Table {
  name: string;
  columns: Column[];
  position: Position;
}

export interface Relationship {
  id: string;
  fromTable: string;
  fromColumn: string;
  toTable: string;
  toColumn: string;
  type: 'one-to-one' | 'one-to-many' | 'many-to-many';
  junctionTable?: string;
}

export interface Position {
  x: number;
  y: number;
}

export interface DatabaseSchema {
  tables: Table[];
  relationships: Relationship[];
}

export enum SQLDialect {
  MYSQL = 'MySQL',
  POSTGRESQL = 'PostgreSQL',
  SQLITE = 'SQLite',
  MARIADB = 'MariaDB'
}

export interface CanvasState {
  zoom: number;
  panX: number;
  panY: number;
  selectedTable?: string;
  draggedTable?: string;
}

export interface ParseResult {
  success: boolean;
  schema?: DatabaseSchema;
  error?: ErrorResult;
}

export interface ErrorResult {
  message: string;
  statementIndex?: number;
}

export interface SyntaxParseResult {
  success: boolean;
  error?: string;
  statementIndex?: number;
}

export interface TypeAndLength {
  baseType: string;
  length: number | undefined;
}
