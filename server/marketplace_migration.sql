-- ============================================================
-- SnapLocate Marketplace — Database Migration
-- Run this in: Supabase Dashboard → SQL Editor → Run
-- ============================================================

-- ─── ENUMS ───────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE marketplace_category AS ENUM (
    'Textbooks', 'Electronics', 'Vehicles', 'Furniture', 'Clothing', 'Sports', 'Other'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE marketplace_condition AS ENUM (
    'Like New', 'Good', 'Fair', 'Needs Repair'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE marketplace_status AS ENUM (
    'Active', 'Reserved', 'Sold', 'Draft', 'Deleted'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE marketplace_report_reason AS ENUM (
    'Spam', 'Inappropriate', 'Scam', 'Other'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE marketplace_report_status AS ENUM (
    'Pending', 'Resolved', 'Dismissed'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── MARKETPLACE LISTINGS ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS marketplace_listings (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id         UUID NOT NULL,                                      -- tenant isolation (plain uuid, matches existing pattern)
  seller_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title          TEXT NOT NULL CHECK (char_length(title) BETWEEN 3 AND 200),
  description    TEXT CHECK (char_length(description) <= 2000),
  price          NUMERIC(10, 2),                                      -- NULL = Free item
  is_negotiable  BOOLEAN NOT NULL DEFAULT FALSE,
  category       marketplace_category NOT NULL DEFAULT 'Other',
  condition      marketplace_condition NOT NULL DEFAULT 'Good',
  status         marketplace_status NOT NULL DEFAULT 'Active',
  images         TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],            -- Cloudinary URLs, max 5
  views_count    INTEGER NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mkt_listings_org        ON marketplace_listings(org_id);
CREATE INDEX IF NOT EXISTS idx_mkt_listings_seller     ON marketplace_listings(seller_id);
CREATE INDEX IF NOT EXISTS idx_mkt_listings_status     ON marketplace_listings(status);
CREATE INDEX IF NOT EXISTS idx_mkt_listings_category   ON marketplace_listings(category);
CREATE INDEX IF NOT EXISTS idx_mkt_listings_created    ON marketplace_listings(created_at DESC);

-- ─── MARKETPLACE SAVED (WISHLIST / BOOKMARKS) ─────────────────
CREATE TABLE IF NOT EXISTS marketplace_saved (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id      UUID NOT NULL,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  listing_id  UUID NOT NULL REFERENCES marketplace_listings(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, listing_id)
);

CREATE INDEX IF NOT EXISTS idx_mkt_saved_user    ON marketplace_saved(user_id);
CREATE INDEX IF NOT EXISTS idx_mkt_saved_listing ON marketplace_saved(listing_id);

-- ─── MARKETPLACE CHATS ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS marketplace_chats (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id          UUID NOT NULL,
  listing_id      UUID NOT NULL REFERENCES marketplace_listings(id) ON DELETE CASCADE,
  buyer_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  seller_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  is_archived     BOOLEAN NOT NULL DEFAULT FALSE,
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (buyer_id, listing_id)                                       -- one thread per buyer per listing
);

-- Critical: inbox sorts by most-recent — index prevents degradation at scale
CREATE INDEX IF NOT EXISTS idx_mkt_chats_last_msg   ON marketplace_chats(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_mkt_chats_buyer      ON marketplace_chats(buyer_id);
CREATE INDEX IF NOT EXISTS idx_mkt_chats_seller     ON marketplace_chats(seller_id);
CREATE INDEX IF NOT EXISTS idx_mkt_chats_listing    ON marketplace_chats(listing_id);

-- ─── MARKETPLACE MESSAGES ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS marketplace_messages (
  id       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id   UUID NOT NULL,
  chat_id  UUID NOT NULL REFERENCES marketplace_chats(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content  TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 1000),
  is_read  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mkt_msg_chat   ON marketplace_messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_mkt_msg_sender ON marketplace_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_mkt_msg_read   ON marketplace_messages(is_read) WHERE is_read = FALSE;

-- ─── MARKETPLACE REPORTS ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS marketplace_reports (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id      UUID NOT NULL,
  reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  listing_id  UUID NOT NULL REFERENCES marketplace_listings(id) ON DELETE CASCADE,
  reason      marketplace_report_reason NOT NULL DEFAULT 'Other',
  status      marketplace_report_status NOT NULL DEFAULT 'Pending',
  admin_note  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (reporter_id, listing_id)                                    -- one report per user per listing
);

CREATE INDEX IF NOT EXISTS idx_mkt_reports_listing ON marketplace_reports(listing_id);
CREATE INDEX IF NOT EXISTS idx_mkt_reports_status  ON marketplace_reports(status);
CREATE INDEX IF NOT EXISTS idx_mkt_reports_created ON marketplace_reports(created_at DESC);
