/**
 * スーパーリカー SQL Server 接続ライブラリ
 * ASHIZUKA-SERVER\SQLEXPRESS2022,49854 / DB: Posmst
 */
import sql from 'mssql';

// ポート直指定の場合、instanceName は使用しない（競合する）
// ASHIZUKA-SERVER (192.168.0.151) \SQLEXPRESS2022,49854
const config: sql.config = {
  server: '192.168.0.151',
  port: 49854,
  database: 'Posmst',
  user: 'imp',
  password: 'impjp',
  options: {
    trustServerCertificate: true,
    enableArithAbort: true,
    encrypt: false,
  },
  connectionTimeout: 15000,
  requestTimeout: 30000,
};

let pool: sql.ConnectionPool | null = null;

export async function getPool(): Promise<sql.ConnectionPool> {
  if (pool && pool.connected) return pool;
  pool = await sql.connect(config);
  return pool;
}

export async function query<T = Record<string, unknown>>(
  queryStr: string
): Promise<T[]> {
  const p = await getPool();
  const result = await p.request().query(queryStr);
  return result.recordset as T[];
}
