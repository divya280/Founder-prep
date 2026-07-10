import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { parseFrontmatter } from "@/lib/rag/frontmatter";
import { chunkDocument } from "@/lib/rag/chunk";
import { embedBatch } from "@/lib/rag/embed";
import { DOCS_DIR, SUPPORTED_EXTENSIONS } from "@/lib/rag/config";
import type { Json } from "@/types/supabase";
import type {
  ChunkMetadata,
  IngestFileResult,
  IngestionResult,
} from "@/types/rag";

// End-to-end ingestion: read → chunk → embed → store, with a per-file audit
// trail. Writes use the service-role admin client (bypasses RLS). Runs
// server-side only (fs access), triggered manually via POST /api/ingest.

// Files in the docs dir that are not compliance content.
const IGNORE_FILES = new Set(["README.md"]);

interface IngestOptions {
  /** Label recorded in ingestion_runs.trigger (e.g. "api"). */
  trigger?: string;
  /** Re-embed even if the file content hash is unchanged. */
  force?: boolean;
}

async function readDocFiles(absDir: string): Promise<string[]> {
  const entries = await fs.readdir(absDir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter((name) => !name.startsWith("."))
    .filter((name) => !IGNORE_FILES.has(name))
    .filter((name) =>
      SUPPORTED_EXTENSIONS.includes(
        path.extname(name).toLowerCase() as (typeof SUPPORTED_EXTENSIONS)[number],
      ),
    )
    .sort();
}

/** Read a doc's raw text. PDFs go through pdf-parse (lazy-loaded). */
async function readDocText(absPath: string, ext: string): Promise<string> {
  if (ext === ".pdf") {
    const buffer = await fs.readFile(absPath);
    const mod: unknown = await import("pdf-parse");
    const candidate =
      (mod as { default?: unknown }).default ?? (mod as unknown);
    if (typeof candidate !== "function") {
      throw new Error("pdf-parse: unexpected module shape");
    }
    const parsed = (await (candidate as (b: Buffer) => Promise<{ text: string }>)(
      buffer,
    )) as { text?: string };
    return parsed.text ?? "";
  }
  return fs.readFile(absPath, "utf8");
}

function hashContent(raw: string): string {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

export async function ingestAll(
  options: IngestOptions = {},
): Promise<IngestionResult> {
  const admin = createAdminClient();
  const absDir = path.join(process.cwd(), DOCS_DIR);

  // Open the run log up front so even a mid-run crash leaves a "running" row.
  const { data: runRow, error: runError } = await admin
    .from("ingestion_runs")
    .insert({ status: "running", trigger: options.trigger ?? "api" })
    .select("id")
    .single();

  if (runError || !runRow) {
    throw new Error(
      `Could not open ingestion run: ${runError?.message ?? "unknown"}`,
    );
  }
  const runId = runRow.id;

  const files: IngestFileResult[] = [];
  let chunkCount = 0;

  try {
    const fileNames = await readDocFiles(absDir);

    for (const fileName of fileNames) {
      const result = await ingestFile(admin, absDir, fileName, runId, options);
      files.push(result);
      chunkCount += result.chunks;
    }

    const successCount = files.filter(
      (f) => f.status === "ingested" || f.status === "skipped",
    ).length;
    const anyFailed = files.some((f) => f.status === "failed");
    const status: IngestionResult["status"] =
      files.length === 0
        ? "success"
        : anyFailed && successCount === 0
          ? "failed"
          : anyFailed
            ? "partial"
            : "success";

    await admin
      .from("ingestion_runs")
      .update({
        status,
        file_count: files.length,
        file_success_count: successCount,
        chunk_count: chunkCount,
        files: files as unknown as Json,
        finished_at: new Date().toISOString(),
      })
      .eq("id", runId);

    return {
      runId,
      status,
      fileCount: files.length,
      fileSuccessCount: successCount,
      chunkCount,
      files,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await admin
      .from("ingestion_runs")
      .update({
        status: "failed",
        file_count: files.length,
        chunk_count: chunkCount,
        files: files as unknown as Json,
        error: message,
        finished_at: new Date().toISOString(),
      })
      .eq("id", runId);

    return {
      runId,
      status: "failed",
      fileCount: files.length,
      fileSuccessCount: 0,
      chunkCount,
      files,
      error: message,
    };
  }
}

async function ingestFile(
  admin: ReturnType<typeof createAdminClient>,
  absDir: string,
  fileName: string,
  runId: string,
  options: IngestOptions,
): Promise<IngestFileResult> {
  try {
    const ext = path.extname(fileName).toLowerCase();
    const raw = await readDocText(path.join(absDir, fileName), ext);
    const contentHash = hashContent(raw);

    // Skip unchanged files unless forced — avoids re-spending embedding calls.
    if (!options.force) {
      const { data: existing } = await admin
        .from("rag_documents")
        .select("content_hash, chunk_count")
        .eq("source_file", fileName)
        .maybeSingle();
      if (existing?.content_hash === contentHash) {
        return {
          source: fileName,
          status: "skipped",
          chunks: existing.chunk_count ?? 0,
          skippedReason: "unchanged",
        };
      }
    }

    const { frontmatter, body } = parseFrontmatter(raw, fileName);
    const chunks = chunkDocument(body);

    if (chunks.length === 0) {
      return {
        source: fileName,
        status: "skipped",
        chunks: 0,
        skippedReason: "no content after chunking",
      };
    }

    // Embed BEFORE touching stored data. If embedding throws, the existing
    // chunks for this source stay intact (no half-deleted state).
    const vectors = await embedBatch(chunks.map((c) => c.content));

    const rows = chunks.map((chunk, i) => {
      const metadata: ChunkMetadata = {
        source: fileName,
        title: frontmatter.title,
        category: frontmatter.category ?? null,
        mandatory: frontmatter.mandatory ?? null,
        last_updated: frontmatter.last_updated ?? null,
        // Carried per-chunk on purpose so generation can attach the caveat
        // no matter which chunk was retrieved. `sources` is NOT carried here.
        disclaimer: frontmatter.disclaimer ?? null,
        chunk_index: chunk.chunkIndex,
      };
      return {
        content: chunk.content,
        embedding: JSON.stringify(vectors[i]),
        metadata: metadata as unknown as Json,
        chunk_index: chunk.chunkIndex,
      };
    });

    // Swap: delete this source's old chunks, then insert the fresh set.
    const { error: deleteError } = await admin
      .from("embeddings")
      .delete()
      .filter("metadata->>source", "eq", fileName);
    if (deleteError) {
      throw new Error(`delete old chunks: ${deleteError.message}`);
    }

    const { error: insertError } = await admin.from("embeddings").insert(rows);
    if (insertError) {
      throw new Error(`insert chunks: ${insertError.message}`);
    }

    // Upsert the document-level record (sources live here, not per chunk).
    const { error: docError } = await admin.from("rag_documents").upsert(
      {
        source_file: fileName,
        title: frontmatter.title,
        category: frontmatter.category ?? null,
        mandatory: frontmatter.mandatory ?? null,
        domain_specific: frontmatter.domain_specific ?? false,
        jurisdiction: frontmatter.jurisdiction ?? null,
        last_updated: frontmatter.last_updated ?? null,
        disclaimer: frontmatter.disclaimer ?? null,
        sources: (frontmatter.sources ?? []) as unknown as Json,
        chunk_count: chunks.length,
        content_hash: contentHash,
        last_ingested_at: new Date().toISOString(),
        last_run_id: runId,
      },
      { onConflict: "source_file" },
    );
    if (docError) {
      throw new Error(`upsert rag_documents: ${docError.message}`);
    }

    return { source: fileName, status: "ingested", chunks: chunks.length };
  } catch (error) {
    return {
      source: fileName,
      status: "failed",
      chunks: 0,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
