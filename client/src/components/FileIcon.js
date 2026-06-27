import React from "react";
import {
  Folder,
  FolderOpen,
  FileText,
  FileImage,
  FileVideo,
  FileAudio,
  FileCode,
  FileArchive,
  FileSpreadsheet,
  File,
  Database,
} from "lucide-react";

const EXT_MAP = {
  // Documents
  pdf: { icon: FileText, color: "#ef4444" },
  doc: { icon: FileText, color: "#3b82f6" },
  docx: { icon: FileText, color: "#3b82f6" },
  txt: { icon: FileText, color: "#94a3b8" },
  md: { icon: FileText, color: "#94a3b8" },
  rtf: { icon: FileText, color: "#94a3b8" },

  // Spreadsheets
  xls: { icon: FileSpreadsheet, color: "#22c55e" },
  xlsx: { icon: FileSpreadsheet, color: "#22c55e" },
  csv: { icon: FileSpreadsheet, color: "#22c55e" },

  // Images
  jpg: { icon: FileImage, color: "#a855f7" },
  jpeg: { icon: FileImage, color: "#a855f7" },
  png: { icon: FileImage, color: "#a855f7" },
  gif: { icon: FileImage, color: "#a855f7" },
  bmp: { icon: FileImage, color: "#a855f7" },
  svg: { icon: FileImage, color: "#a855f7" },
  webp: { icon: FileImage, color: "#a855f7" },
  ico: { icon: FileImage, color: "#a855f7" },

  // Video
  mp4: { icon: FileVideo, color: "#f59e0b" },
  avi: { icon: FileVideo, color: "#f59e0b" },
  mkv: { icon: FileVideo, color: "#f59e0b" },
  mov: { icon: FileVideo, color: "#f59e0b" },
  wmv: { icon: FileVideo, color: "#f59e0b" },

  // Audio
  mp3: { icon: FileAudio, color: "#ec4899" },
  wav: { icon: FileAudio, color: "#ec4899" },
  flac: { icon: FileAudio, color: "#ec4899" },
  aac: { icon: FileAudio, color: "#ec4899" },

  // Code
  js: { icon: FileCode, color: "#fbbf24" },
  jsx: { icon: FileCode, color: "#38bdf8" },
  ts: { icon: FileCode, color: "#38bdf8" },
  tsx: { icon: FileCode, color: "#38bdf8" },
  py: { icon: FileCode, color: "#4ade80" },
  java: { icon: FileCode, color: "#fb923c" },
  cs: { icon: FileCode, color: "#818cf8" },
  cpp: { icon: FileCode, color: "#22d3ee" },
  c: { icon: FileCode, color: "#22d3ee" },
  go: { icon: FileCode, color: "#34d399" },
  rb: { icon: FileCode, color: "#f87171" },
  php: { icon: FileCode, color: "#a78bfa" },
  html: { icon: FileCode, color: "#fb923c" },
  css: { icon: FileCode, color: "#38bdf8" },
  json: { icon: FileCode, color: "#fbbf24" },
  xml: { icon: FileCode, color: "#94a3b8" },
  sh: { icon: FileCode, color: "#4ade80" },
  bat: { icon: FileCode, color: "#94a3b8" },
  ps1: { icon: FileCode, color: "#818cf8" },

  // Archives
  zip: { icon: FileArchive, color: "#f97316" },
  rar: { icon: FileArchive, color: "#f97316" },
  "7z": { icon: FileArchive, color: "#f97316" },
  tar: { icon: FileArchive, color: "#f97316" },
  gz: { icon: FileArchive, color: "#f97316" },

  // Database
  sql: { icon: Database, color: "#22d3ee" },
  db: { icon: Database, color: "#22d3ee" },
  sqlite: { icon: Database, color: "#22d3ee" },
};

export default function FileIcon({ name, isFolder, size = 16 }) {
  if (isFolder) {
    return <Folder size={size} color="#fbbf24" style={{ flexShrink: 0 }} />;
  }

  const ext = name.split(".").pop()?.toLowerCase() || "";
  const mapping = EXT_MAP[ext];

  if (!mapping) {
    return <File size={size} color="#475569" style={{ flexShrink: 0 }} />;
  }

  const IconComponent = mapping.icon;
  return (
    <IconComponent
      size={size}
      color={mapping.color}
      style={{ flexShrink: 0 }}
    />
  );
}
