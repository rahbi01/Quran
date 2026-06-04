// init-db.js
import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function init() {
  await pool.query(`
    -- 1. جدول المستخدمين (طلاب، معلمون، مشرفون)
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      role VARCHAR(20) NOT NULL,
      username VARCHAR(50) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      name VARCHAR(100) NOT NULL,
      phone VARCHAR(20),
      avatar VARCHAR(10),
      color CHAR(1),
      level VARCHAR(100),
      warned INT DEFAULT 0,
      suspended BOOLEAN DEFAULT false,
      can_view_missing BOOLEAN DEFAULT false,
      is_super_admin BOOLEAN DEFAULT false,
      perms JSONB DEFAULT '{}',
      created_at TIMESTAMP DEFAULT NOW()
    );

    -- 2. العلاقة بين المعلمين والطلاب (تحل محل ASSIGNMENTS)
    CREATE TABLE IF NOT EXISTS teacher_students (
      teacher_id INT REFERENCES users(id) ON DELETE CASCADE,
      student_id INT REFERENCES users(id) ON DELETE CASCADE,
      PRIMARY KEY (teacher_id, student_id)
    );

    -- 3. المقررات الأسبوعية
    CREATE TABLE IF NOT EXISTS plans (
      id SERIAL PRIMARY KEY,
      student_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      teacher_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type VARCHAR(30) NOT NULL, -- 'حفظ', 'سرد', 'تقييم مرحلة'
      sard_subtype VARCHAR(10),  -- 'full', 'review'
      start_date DATE NOT NULL,
      new_mem TEXT,
      recent_mem TEXT,
      old_mem TEXT,
      sard_text TEXT,
      sard_notes TEXT,
      phase_desc TEXT,
      notes TEXT,
      status VARCHAR(10) GENERATED ALWAYS AS (
        CASE 
          WHEN start_date > CURRENT_DATE THEN 'future'
          WHEN start_date <= CURRENT_DATE AND start_date + INTERVAL '6 days' >= CURRENT_DATE THEN 'current'
          ELSE 'past'
        END
      ) STORED,
      created_at TIMESTAMP DEFAULT NOW()
    );

    -- 4. التقارير اليومية (كل يوم على حدة)
    CREATE TABLE IF NOT EXISTS daily_reports (
      id SERIAL PRIMARY KEY,
      plan_id INT NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
      day_index INT NOT NULL, -- 0=الأحد ... 6=السبت
      tasks JSONB,            -- { listening: true, recitation_mastery: true, ... }
      sard_done BOOLEAN,
      sard_text TEXT,
      sard_notes TEXT,
      phase_mem TEXT,
      old_mem TEXT,
      notes TEXT,
      submitted_at TIMESTAMP NOT NULL,
      UNIQUE(plan_id, day_index)
    );

    -- 5. تقييمات نهاية المقرر
    CREATE TABLE IF NOT EXISTS evaluations (
      id SERIAL PRIMARY KEY,
      plan_id INT NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
      new_score INT,
      new_pass BOOLEAN,
      recent_score INT,
      old_score INT,
      old_pass BOOLEAN,
      rev_score INT,
      rev_pass BOOLEAN,
      phase_score INT,
      phase_pass BOOLEAN,
      notes TEXT,
      points INT NOT NULL,
      stars INT NOT NULL,
      evaluation_date DATE NOT NULL,
      UNIQUE(plan_id)
    );

    -- 6. قواعد المكافآت
    CREATE TABLE IF NOT EXISTS reward_rules (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      months INT NOT NULL,
      active BOOLEAN DEFAULT false,
      slabs JSONB NOT NULL -- [{min, max, rate}]
    );

    -- 7. دورات النقاط
    CREATE TABLE IF NOT EXISTS points_cycles (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      start_date DATE NOT NULL,
      end_date DATE,
      archived BOOLEAN DEFAULT false,
      plan_limit INT DEFAULT 6
    );

    -- 8. فترات صفحات الحفظ
    CREATE TABLE IF NOT EXISTS pages_periods (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      start_date DATE NOT NULL,
      end_date DATE,
      archived BOOLEAN DEFAULT false
    );

    -- 9. صفحات وتقييمات الطالب لكل فترة
    CREATE TABLE IF NOT EXISTS student_pages (
      period_id INT REFERENCES pages_periods(id) ON DELETE CASCADE,
      student_id INT REFERENCES users(id) ON DELETE CASCADE,
      pages INT,
      phase_score INT,
      phase_pass BOOLEAN,
      PRIMARY KEY (period_id, student_id)
    );

    -- 10. سجل الجلسات (لإعادة الدخول)
    CREATE TABLE IF NOT EXISTS sessions (
      user_id INT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      token VARCHAR(255) UNIQUE,
      expires_at TIMESTAMP
    );
  `);
  console.log('✅ All tables created');
  await pool.end();
}

init().catch(console.error);