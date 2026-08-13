import { NextRequest, NextResponse } from "next/server";
import { spawn } from "child_process";
import path from "path";

// Runs the Python agent — needs the Node runtime (child_process) and must never
// be cached, since each call is a live adjudication.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CASE_INDEX: Record<string, number> = {
  "SYN-PA-001": 1,
  "SYN-PA-002": 2,
  "SYN-PA-003": 3,
};

const PYTHON = process.env.PYTHON_BIN || "python3";
const TIMEOUT_MS = 90_000; // Bedrock round-trips can be slow

function runAgent(repoRoot: string, caseIndex: number): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const child = spawn(PYTHON, ["-m", "agent.adjudication_api", "--case", String(caseIndex)], {
      cwd: repoRoot,
      env: { ...process.env, PYTHONPATH: repoRoot, PYTHONUNBUFFERED: "1" },
    });

    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      reject(new Error("agent timed out"));
    }, TIMEOUT_MS);

    child.stdout.on("data", (d) => (stdout += d.toString()));
    child.stderr.on("data", (d) => (stderr += d.toString()));
    child.on("error", (err) => {
      clearTimeout(timer);
      reject(err);
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      const line = stdout.split("\n").find((l) => l.startsWith("RESULT_JSON:"));
      if (line) {
        try {
          resolve(JSON.parse(line.slice("RESULT_JSON:".length)));
          return;
        } catch (e) {
          reject(new Error("could not parse agent JSON: " + String(e)));
          return;
        }
      }
      reject(new Error(`agent exited ${code}: ${stderr.slice(-300) || "no RESULT_JSON emitted"}`));
    });
  });
}

export async function GET(req: NextRequest) {
  const caseId = req.nextUrl.searchParams.get("caseId") ?? "SYN-PA-001";
  const caseIndex = CASE_INDEX[caseId] ?? 1;
  // frontend/ is cwd at runtime; the Python package lives one level up.
  const repoRoot = path.join(process.cwd(), "..");

  try {
    const result = await runAgent(repoRoot, caseIndex);
    return NextResponse.json({ live: true, result });
  } catch (err) {
    // Never 500 the demo — signal the client to fall back to its fixture.
    return NextResponse.json({ live: false, error: String(err) }, { status: 200 });
  }
}
