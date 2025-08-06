import { SQLDialect } from '$lib/types';

export const SQL_DATA_TYPES: Record<string, string[]> = {
  [SQLDialect.MYSQL]: [
    'TINYINT',
    'SMALLINT',
    'MEDIUMINT',
    'INT',
    'INTEGER',
    'BIGINT',
    'DECIMAL',
    'NUMERIC',
    'FLOAT',
    'DOUBLE',
    'DOUBLE PRECISION',
    'REAL',
    'BIT',
    'CHAR',
    'VARCHAR',
    'BINARY',
    'VARBINARY',
    'TINYTEXT',
    'TEXT',
    'MEDIUMTEXT',
    'LONGTEXT',
    'TINYBLOB',
    'BLOB',
    'MEDIUMBLOB',
    'LONGBLOB',
    'DATE',
    'TIME',
    'DATETIME',
    'TIMESTAMP',
    'YEAR',
    'BOOLEAN',
    'BOOL',
    'JSON',
    'ENUM',
    'SET',
    'GEOMETRY',
    'POINT',
    'LINESTRING',
    'POLYGON',
    'MULTIPOINT',
    'MULTILINESTRING',
    'MULTIPOLYGON',
    'GEOMETRYCOLLECTION'
  ],
  [SQLDialect.POSTGRESQL]: [
    'SMALLINT',
    'INTEGER',
    'BIGINT',
    'SERIAL',
    'BIGSERIAL',
    'DECIMAL',
    'NUMERIC',
    'REAL',
    'DOUBLE PRECISION',
    'FLOAT4',
    'FLOAT8',
    'MONEY',
    'CHAR',
    'CHARACTER',
    'VARCHAR',
    'CHARACTER VARYING',
    'TEXT',
    'BYTEA',
    'DATE',
    'TIME',
    'TIMESTAMP',
    'TIMESTAMPTZ',
    'INTERVAL',
    'BOOLEAN',
    'BOOL',
    'UUID',
    'JSON',
    'JSONB',
    'ARRAY',
    'INET',
    'CIDR',
    'MACADDR',
    'MACADDR8',
    'TSVECTOR',
    'TSQUERY',
    'INT4RANGE',
    'INT8RANGE',
    'NUMRANGE',
    'TSRANGE',
    'TSTZRANGE',
    'DATERANGE',
    'XML',
    'BIT',
    'BIT VARYING'
  ],
  [SQLDialect.SQLITE]: [
    'INTEGER',
    'REAL',
    'TEXT',
    'BLOB',
    'INT',
    'TINYINT',
    'SMALLINT',
    'MEDIUMINT',
    'BIGINT',
    'UNSIGNED BIG INT',
    'INT2',
    'INT8',
    'CHARACTER',
    'VARCHAR',
    'VARYING CHARACTER',
    'NCHAR',
    'NATIVE CHARACTER',
    'NVARCHAR',
    'CLOB',
    'DOUBLE',
    'DOUBLE PRECISION',
    'FLOAT',
    'NUMERIC',
    'DECIMAL',
    'BOOLEAN',
    'DATE',
    'DATETIME'
  ],
  [SQLDialect.MARIADB]: [
    'TINYINT',
    'SMALLINT',
    'MEDIUMINT',
    'INT',
    'INTEGER',
    'BIGINT',
    'INT1',
    'INT2',
    'INT3',
    'INT4',
    'INT8',
    'MIDDLEINT',
    'DECIMAL',
    'DEC',
    'NUMERIC',
    'FIXED',
    'NUMBER',
    'FLOAT',
    'FLOAT4',
    'FLOAT8',
    'DOUBLE',
    'DOUBLE PRECISION',
    'REAL',
    'BIT',
    'CHAR',
    'CHARACTER',
    'VARCHAR',
    'CHAR VARYING',
    'CHARACTER VARYING',
    'BINARY',
    'VARBINARY',
    'CHAR BYTE',
    'TINYTEXT',
    'TEXT',
    'MEDIUMTEXT',
    'LONGTEXT',
    'TINYBLOB',
    'BLOB',
    'MEDIUMBLOB',
    'LONGBLOB',
    'LONG',
    'LONG VARCHAR',
    'LONG VARBINARY',
    'NATIONAL CHAR',
    'NATIONAL VARCHAR',
    'NCHAR',
    'NVARCHAR',
    'DATE',
    'TIME',
    'DATETIME',
    'TIMESTAMP',
    'YEAR',
    'BOOLEAN',
    'BOOL',
    'JSON',
    'ENUM',
    'SET',
    'GEOMETRY',
    'POINT',
    'LINESTRING',
    'POLYGON',
    'MULTIPOINT',
    'MULTILINESTRING',
    'MULTIPOLYGON',
    'GEOMETRYCOLLECTION',
    'INET4',
    'INET6',
    'UUID',
    'VECTOR',
    'CLOB',
    'RAW',
    'VARCHAR2',
    'SERIAL',
    'ROW'
  ]
};

export const REQUIRED_LENGTH_TYPES: Record<string, string[]> = {
  [SQLDialect.MYSQL]: ['CHAR', 'VARCHAR', 'BINARY', 'VARBINARY', 'BIT'],
  [SQLDialect.POSTGRESQL]: [
    'CHAR',
    'CHARACTER',
    'VARCHAR',
    'CHARACTER VARYING',
    'BIT',
    'BIT VARYING'
  ],
  [SQLDialect.SQLITE]: [],
  [SQLDialect.MARIADB]: [
    'CHAR',
    'CHARACTER',
    'VARCHAR',
    'CHAR VARYING',
    'CHARACTER VARYING',
    'BINARY',
    'VARBINARY',
    'CHAR BYTE',
    'BIT',
    'NATIONAL CHAR',
    'NATIONAL VARCHAR',
    'NCHAR',
    'NVARCHAR'
  ]
};

export const OPTIONAL_LENGTH_TYPES: Record<string, string[]> = {
  [SQLDialect.MYSQL]: [
    'TINYINT',
    'SMALLINT',
    'MEDIUMINT',
    'INT',
    'INTEGER',
    'BIGINT',
    'DECIMAL',
    'NUMERIC',
    'FLOAT',
    'DOUBLE'
  ],
  [SQLDialect.POSTGRESQL]: ['DECIMAL', 'NUMERIC', 'TIME', 'TIMESTAMP', 'TIMESTAMPTZ', 'INTERVAL'],
  [SQLDialect.SQLITE]: [
    'CHARACTER',
    'VARCHAR',
    'VARYING CHARACTER',
    'NCHAR',
    'NATIVE CHARACTER',
    'NVARCHAR',
    'NUMERIC',
    'DECIMAL'
  ],
  [SQLDialect.MARIADB]: [
    'TINYINT',
    'SMALLINT',
    'MEDIUMINT',
    'INT',
    'INTEGER',
    'BIGINT',
    'INT1',
    'INT2',
    'INT3',
    'INT4',
    'INT8',
    'MIDDLEINT',
    'DECIMAL',
    'DEC',
    'NUMERIC',
    'FIXED',
    'NUMBER',
    'FLOAT',
    'FLOAT4',
    'FLOAT8',
    'DOUBLE',
    'DOUBLE PRECISION',
    'REAL',
    'TIME',
    'DATETIME',
    'TIMESTAMP'
  ]
};

export const SQL_EXAMPLES: Record<string, string> = {
  [SQLDialect.MYSQL]: `
CREATE TABLE authors (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL
);

CREATE TABLE tags (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE profiles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  author_id INT UNIQUE,
  bio TEXT,
  FOREIGN KEY (author_id) REFERENCES authors(id)
);

CREATE TABLE books (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  author_id INT,
  FOREIGN KEY (author_id) REFERENCES authors(id)
);

CREATE TABLE book_tags (
  book_id INT,
  tag_id INT,
  PRIMARY KEY (book_id, tag_id),
  FOREIGN KEY (book_id) REFERENCES books(id),
  FOREIGN KEY (tag_id) REFERENCES tags(id)
);
`.trim(),

  [SQLDialect.POSTGRESQL]: `
CREATE TABLE customers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL
);

CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100),
  price NUMERIC(10,2)
);

CREATE TABLE addresses (
  id SERIAL PRIMARY KEY,
  customer_id INT UNIQUE,
  street TEXT,
  city TEXT,
  FOREIGN KEY (customer_id) REFERENCES customers(id)
);

CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  customer_id INT,
  order_date TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (customer_id) REFERENCES customers(id)
);

CREATE TABLE order_products (
  order_id INT,
  product_id INT,
  PRIMARY KEY (order_id, product_id),
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);
`.trim(),

  [SQLDialect.MARIADB]: `
CREATE TABLE employees (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL
);

CREATE TABLE labels (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE passports (
  id INT AUTO_INCREMENT PRIMARY KEY,
  employee_id INT UNIQUE,
  number VARCHAR(50),
  FOREIGN KEY (employee_id) REFERENCES employees(id)
);

CREATE TABLE tasks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200),
  employee_id INT,
  FOREIGN KEY (employee_id) REFERENCES employees(id)
);

CREATE TABLE task_labels (
  task_id INT,
  label_id INT,
  PRIMARY KEY (task_id, label_id),
  FOREIGN KEY (task_id) REFERENCES tasks(id),
  FOREIGN KEY (label_id) REFERENCES labels(id)
);
`.trim(),

  [SQLDialect.SQLITE]: `
CREATE TABLE doctors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL
);

CREATE TABLE tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL
);

CREATE TABLE licenses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  doctor_id INTEGER UNIQUE,
  license_number TEXT,
  FOREIGN KEY (doctor_id) REFERENCES doctors(id)
);

CREATE TABLE appointments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  doctor_id INTEGER,
  patient_name TEXT,
  appointment_date TEXT,
  FOREIGN KEY (doctor_id) REFERENCES doctors(id)
);

CREATE TABLE appointment_tags (
  appointment_id INTEGER,
  tag_id INTEGER,
  PRIMARY KEY (appointment_id, tag_id),
  FOREIGN KEY (appointment_id) REFERENCES appointments(id),
  FOREIGN KEY (tag_id) REFERENCES tags(id)
);
`.trim()
};

export const SQL_KEYWORDS = [
  'CREATE',
  'ALTER',
  'DROP',
  'TRUNCATE',
  'RENAME',
  'TABLE',
  'DATABASE',
  'SCHEMA',
  'INDEX',
  'VIEW',
  'TRIGGER',
  'PROCEDURE',
  'FUNCTION',
  'CONSTRAINT',
  'PRIMARY',
  'FOREIGN',
  'UNIQUE',
  'CHECK',
  'KEY',
  'REFERENCES',
  'CASCADE',
  'RESTRICT',
  'SET',
  'NO',
  'ACTION',
  'INSERT',
  'UPDATE',
  'DELETE',
  'SELECT',
  'REPLACE',
  'MERGE',
  'UPSERT',
  'FROM',
  'WHERE',
  'GROUP',
  'HAVING',
  'ORDER',
  'BY',
  'LIMIT',
  'OFFSET',
  'DISTINCT',
  'ALL',
  'TOP',
  'FETCH',
  'FIRST',
  'ROWS',
  'ONLY',
  'JOIN',
  'INNER',
  'LEFT',
  'RIGHT',
  'FULL',
  'OUTER',
  'CROSS',
  'NATURAL',
  'ON',
  'USING',
  'UNION',
  'INTERSECT',
  'EXCEPT',
  'MINUS',
  'WITH',
  'RECURSIVE',
  'AS',
  'EXISTS',
  'IN',
  'ANY',
  'SOME',
  'ALL',
  'CASE',
  'WHEN',
  'THEN',
  'ELSE',
  'END',
  'IF',
  'IFNULL',
  'NULLIF',
  'COALESCE',
  'COUNT',
  'SUM',
  'AVG',
  'MIN',
  'MAX',
  'GROUP_CONCAT',
  'STRING_AGG',
  'OVER',
  'PARTITION',
  'ROW_NUMBER',
  'RANK',
  'DENSE_RANK',
  'LEAD',
  'LAG',
  'FIRST_VALUE',
  'LAST_VALUE',
  'NTILE',
  'NOT',
  'NULL',
  'DEFAULT',
  'AUTO_INCREMENT',
  'AUTOINCREMENT',
  'IDENTITY',
  'UNSIGNED',
  'SIGNED',
  'ZEROFILL',
  'BINARY',
  'COLLATE',
  'BEGIN',
  'COMMIT',
  'ROLLBACK',
  'SAVEPOINT',
  'TRANSACTION',
  'WORK',
  'GRANT',
  'REVOKE',
  'DENY',
  'ROLE',
  'USER',
  'PRIVILEGES',
  'AND',
  'OR',
  'NOT',
  'BETWEEN',
  'LIKE',
  'ILIKE',
  'REGEXP',
  'RLIKE',
  'IS',
  'ISNULL',
  'ISNOTNULL',
  'TRUE',
  'FALSE',
  'UNKNOWN',
  'ESCAPE',
  'CAST',
  'CONVERT',
  'EXTRACT',
  'CURRENT_DATE',
  'CURRENT_TIME',
  'CURRENT_TIMESTAMP',
  'NOW',
  'CURRENT_USER',
  'SESSION_USER',
  'SYSTEM_USER',
  'TEMPORARY',
  'TEMP',
  'GLOBAL',
  'LOCAL',
  'SESSION',
  'EXPLAIN',
  'DESCRIBE',
  'DESC',
  'SHOW',
  'USE'
];
