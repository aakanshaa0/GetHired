"use client";

import { useState } from "react";
import { Upload, FileCheck2 } from "lucide-react";

export default function FileDropzone() {
  const [fileName, setFileName] = useState<string | null>(null);

  return (
    <label
      htmlFor="cv-file-input"
      className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-slate-300 px-4 py-8 text-center transition-colors hover:border-teal-400 hover:bg-teal-50/40"
    >
      <input
        id="cv-file-input"
        type="file"
        name="file"
        required
        accept=".pdf,.doc,.docx"
        className="sr-only"
        onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
      />
      {fileName ? (
        <>
          <FileCheck2 className="h-6 w-6 text-teal-600" />
          <span className="text-sm font-medium text-slate-900">{fileName}</span>
          <span className="text-xs text-slate-500">Click to choose a different file</span>
        </>
      ) : (
        <>
          <Upload className="h-6 w-6 text-slate-400" />
          <span className="text-sm font-medium text-slate-700">Click to upload your resume</span>
          <span className="text-xs text-slate-500">PDF, DOC, or DOCX</span>
        </>
      )}
    </label>
  );
}
