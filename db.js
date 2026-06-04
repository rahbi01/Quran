// db.js
import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

export async function query(text, params) {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  console.log('executed query', { text, duration, rows: res.rowCount });
  return res;
}

// دوال خاصة بالـ API
export const getUsers = async () => {
  const res = await query('SELECT * FROM users ORDER BY id');
  return res.rows;
};

export const getUserById = async (id) => {
  const res = await query('SELECT * FROM users WHERE id = $1', [id]);
  return res.rows[0];
};

export const createUser = async (user) => {
  const { role, username, password, name, phone, avatar, color, level, warned, suspended, can_view_missing, is_super_admin, perms } = user;
  const res = await query(
    `INSERT INTO users (role, username, password, name, phone, avatar, color, level, warned, suspended, can_view_missing, is_super_admin, perms)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
    [role, username, password, name, phone, avatar, color, level, warned || 0, suspended || false, can_view_missing || false, is_super_admin || false, perms || {}]
  );
  return res.rows[0];
};

export const updateUser = async (id, updates) => {
  const setClause = Object.keys(updates).map((k, i) => `${k}=$${i+2}`).join(',');
  const values = [id, ...Object.values(updates)];
  const res = await query(`UPDATE users SET ${setClause} WHERE id=$1 RETURNING *`, values);
  return res.rows[0];
};

export const deleteUser = async (id) => {
  await query('DELETE FROM users WHERE id=$1', [id]);
};

// دوال مماثلة لـ: getPlans, getAssignments (من teacher_students), getRewardRules, getPointsCycles, getPagesPeriods, إلخ.

export default { query, getUsers, getUserById, createUser, updateUser, deleteUser };