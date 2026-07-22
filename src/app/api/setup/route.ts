import { pool } from "@/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Drop old users table that had email column and recreate with username
    await pool.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'users' AND column_name = 'email'
        ) THEN
          DROP TABLE users CASCADE;
        END IF;
      END $$;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        username VARCHAR(100) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'user',
        approved INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
      
      -- Add approved column if it doesn't exist (for existing tables)
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'users' AND column_name = 'approved'
        ) THEN
          ALTER TABLE users ADD COLUMN approved INTEGER NOT NULL DEFAULT 0;
        END IF;
      END $$;

      CREATE TABLE IF NOT EXISTS projects (
        id SERIAL PRIMARY KEY,
        owner_name VARCHAR(255) NOT NULL,
        project_no VARCHAR(100) NOT NULL,
        plot_no VARCHAR(100) NOT NULL,
        project_location VARCHAR(255) NOT NULL DEFAULT 'Abu Dhabi',
        noc VARCHAR(50) NOT NULL DEFAULT 'Pending',
        perspective_3d VARCHAR(50) NOT NULL DEFAULT 'Pending',
        architecture VARCHAR(50) NOT NULL DEFAULT 'Pending',
        structure VARCHAR(50) NOT NULL DEFAULT 'Pending',
        status VARCHAR(100) NOT NULL DEFAULT 'In Progress',
        contractor VARCHAR(255) NOT NULL DEFAULT '',
        remarks TEXT NOT NULL DEFAULT '',
        archived INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        last_edited_by VARCHAR(255) NOT NULL DEFAULT 'Admin'
      );

      CREATE TABLE IF NOT EXISTS audit_logs (
        id SERIAL PRIMARY KEY,
        project_id INTEGER NOT NULL,
        field VARCHAR(100) NOT NULL,
        old_value TEXT NOT NULL DEFAULT '',
        new_value TEXT NOT NULL DEFAULT '',
        edited_by VARCHAR(255) NOT NULL DEFAULT 'Admin',
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    return NextResponse.json({
      success: true,
      message: "Database tables created successfully!",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
