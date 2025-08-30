package main

import (
	"encoding/json"
	"os"
	"path/filepath"
)

type profileManager struct{ path string }

func (m *profileManager) list() []profile {
	f, err := os.Open(m.path)
	if err != nil {
		return []profile{
			{Label: "claude-code", Command: []string{"npx", "-y", "@anthropic-ai/claude-code@latest"}},
			{Label: "cursor", Command: []string{"cursor-agent"}},
			{Label: "codex", Command: []string{"npx", "-y", "@openai/codex", "exec"}},
		}
	}
	defer f.Close()
	var ps []profile
	if err := json.NewDecoder(f).Decode(&ps); err != nil || len(ps) == 0 {
		return []profile{
			{Label: "claude-code", Command: []string{"npx", "-y", "@anthropic-ai/claude-code@latest"}},
			{Label: "cursor", Command: []string{"cursor-agent"}},
			{Label: "codex", Command: []string{"npx", "-y", "@openai/codex", "exec"}},
		}
	}
	return ps
}

func (m *profileManager) save(ps []profile) error {
	tmp := m.path + ".tmp"
	if err := os.MkdirAll(filepath.Dir(m.path), 0o755); err != nil {
		return err
	}
	f, err := os.Create(tmp)
	if err != nil {
		return err
	}
	enc := json.NewEncoder(f)
	enc.SetIndent("", "  ")
	if err := enc.Encode(ps); err != nil {
		f.Close()
		_ = os.Remove(tmp)
		return err
	}
	if err := f.Close(); err != nil {
		_ = os.Remove(tmp)
		return err
	}
	return os.Rename(tmp, m.path)
}
