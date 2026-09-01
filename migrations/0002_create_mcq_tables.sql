-- MCQs: top-level question entity owned by a user
CREATE TABLE mcqs (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  question TEXT NOT NULL,
  created_by_user_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (created_by_user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE INDEX idx_mcqs_created_by_user_id ON mcqs (created_by_user_id);
CREATE INDEX idx_mcqs_created_at ON mcqs (created_at);

-- MCQ choices: ordered answer options for an MCQ
CREATE TABLE mcq_choices (
  id TEXT PRIMARY KEY NOT NULL,
  mcq_id TEXT NOT NULL,
  choice_text TEXT NOT NULL,
  is_correct INTEGER NOT NULL DEFAULT 0 CHECK (is_correct IN (0, 1)),
  position INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (mcq_id) REFERENCES mcqs (id) ON DELETE CASCADE,
  UNIQUE (mcq_id, position)
);

CREATE INDEX idx_mcq_choices_mcq_id ON mcq_choices (mcq_id);

-- MCQ attempts: records a user's answer during preview (or future quiz attempt)
CREATE TABLE mcq_attempts (
  id TEXT PRIMARY KEY NOT NULL,
  mcq_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  selected_choice_id TEXT NOT NULL,
  is_correct INTEGER NOT NULL CHECK (is_correct IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (mcq_id) REFERENCES mcqs (id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  FOREIGN KEY (selected_choice_id) REFERENCES mcq_choices (id) ON DELETE RESTRICT
);

CREATE INDEX idx_mcq_attempts_mcq_id ON mcq_attempts (mcq_id);
CREATE INDEX idx_mcq_attempts_user_id ON mcq_attempts (user_id);
CREATE INDEX idx_mcq_attempts_mcq_user ON mcq_attempts (mcq_id, user_id);
