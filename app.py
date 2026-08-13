"""
Claims Adjudication Simulator — Web UI
Run: .venv/bin/python app.py
"""

import io
import json
import logging
import os
import sys
import contextlib

from flask import Flask, Response, render_template_string, stream_with_context

sys.path.insert(0, os.path.dirname(__file__))
from agent.claims_adjudication_agent import adjudicate
from data.synthetic_cases import ALL_CASES

app = Flask(__name__)

HTML = """
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Claims Adjudication Simulator</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', system-ui, sans-serif; background: #0f1117; color: #e2e8f0; min-height: 100vh; }

  header {
    background: linear-gradient(135deg, #1a1f2e 0%, #162032 100%);
    border-bottom: 1px solid #2d3748;
    padding: 24px 40px;
  }
  header h1 { font-size: 1.6rem; font-weight: 700; color: #fff; }
  header p  { font-size: 0.9rem; color: #718096; margin-top: 4px; }
  .badge {
    display: inline-block; background: #2b6cb0; color: #bee3f8;
    font-size: 0.72rem; font-weight: 600; padding: 2px 10px;
    border-radius: 999px; margin-left: 10px; vertical-align: middle;
  }

  main { max-width: 960px; margin: 40px auto; padding: 0 24px; }

  .cases { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 32px; }

  .case-card {
    background: #1a1f2e; border: 1px solid #2d3748; border-radius: 12px;
    padding: 20px; cursor: pointer; transition: all .2s;
  }
  .case-card:hover { border-color: #4a90d9; transform: translateY(-2px); }
  .case-card.active { border-color: #4a90d9; background: #1e2a3a; }

  .case-card .tag {
    display: inline-block; font-size: 0.72rem; font-weight: 700;
    padding: 3px 10px; border-radius: 999px; margin-bottom: 10px;
  }
  .approve .tag { background: #1c4532; color: #9ae6b4; }
  .deny    .tag { background: #4a1818; color: #feb2b2; }
  .review  .tag { background: #4a3a10; color: #fbd38d; }

  .case-card h3 { font-size: 0.95rem; font-weight: 600; color: #e2e8f0; margin-bottom: 6px; }
  .case-card p  { font-size: 0.8rem; color: #718096; line-height: 1.5; }

  .run-btn {
    display: block; width: 100%; margin-top: 14px;
    padding: 9px; border-radius: 8px; border: none;
    font-size: 0.85rem; font-weight: 600; cursor: pointer; transition: all .2s;
  }
  .approve .run-btn { background: #276749; color: #f0fff4; }
  .approve .run-btn:hover { background: #2f855a; }
  .deny    .run-btn { background: #9b2c2c; color: #fff5f5; }
  .deny    .run-btn:hover { background: #c53030; }
  .review  .run-btn { background: #744210; color: #fffaf0; }
  .review  .run-btn:hover { background: #975a16; }

  #output-panel {
    background: #1a1f2e; border: 1px solid #2d3748; border-radius: 12px;
    padding: 24px; min-height: 300px;
  }
  #output-panel h2 { font-size: 1rem; font-weight: 600; color: #a0aec0; margin-bottom: 16px; }

  #output {
    font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
    font-size: 0.82rem; line-height: 1.7; white-space: pre-wrap;
    color: #e2e8f0;
  }

  .spinner {
    display: none; width: 20px; height: 20px;
    border: 2px solid #2d3748; border-top-color: #4a90d9;
    border-radius: 50%; animation: spin .7s linear infinite;
    margin-bottom: 12px;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  .decision-APPROVE { color: #68d391; font-weight: 700; }
  .decision-DENY    { color: #fc8181; font-weight: 700; }
  .decision-NEEDS   { color: #f6e05e; font-weight: 700; }
  .rule-sat   { color: #68d391; }
  .rule-fail  { color: #fc8181; }
  .rule-low   { color: #f6e05e; }
  .separator  { color: #4a5568; }

  .status-bar {
    display: flex; align-items: center; gap: 10px;
    margin-bottom: 16px; font-size: 0.82rem; color: #718096;
  }

  footer { text-align: center; padding: 32px; font-size: 0.78rem; color: #4a5568; }
</style>
</head>
<body>

<header>
  <h1>Claims Adjudication Simulator <span class="badge">Biopharma Hack Day @ AWS</span></h1>
  <p>AI-powered prior authorization for oncology drugs · Pembrolizumab (Keytruda) · NSCLC · Strands + Bedrock</p>
</header>

<main>
  <div class="cases">

    <div class="case-card approve" id="card-1">
      <span class="tag">Expected: APPROVE</span>
      <h3>SYN-PA-001 — Male, 65</h3>
      <p>Stage IV NSCLC · PD-L1 78% · EGFR wild-type · ECOG 1 · Treatment-naïve</p>
      <button class="run-btn" onclick="runCase(1)">▶ Run Case 1</button>
    </div>

    <div class="case-card deny" id="card-2">
      <span class="tag">Expected: DENY</span>
      <h3>SYN-PA-002 — Female, 52</h3>
      <p>Stage IV NSCLC · EGFR exon-19 deletion confirmed · Checkpoint inhibitor contraindicated</p>
      <button class="run-btn" onclick="runCase(2)">▶ Run Case 2</button>
    </div>

    <div class="case-card review" id="card-3">
      <span class="tag">Expected: NEEDS REVIEW</span>
      <h3>SYN-PA-003 — Male, 71</h3>
      <p>Stage IIIB NSCLC · PD-L1/EGFR/ALK all PENDING · Rapid progression · ECOG 2</p>
      <button class="run-btn" onclick="runCase(3)">▶ Run Case 3</button>
    </div>

  </div>

  <div id="output-panel">
    <div class="status-bar">
      <div class="spinner" id="spinner"></div>
      <h2 id="panel-title">Select a case above to run the adjudication agent</h2>
    </div>
    <div id="output"></div>
  </div>
</main>

<footer>
  All patient data is 100% synthetic · Not for clinical use · Built with Strands Agents SDK + Amazon Bedrock
</footer>

<script>
let controller = null;

function colorize(text) {
  return text
    .replace(/(✅)/g, '<span class="rule-sat">$1</span>')
    .replace(/(❌)/g, '<span class="rule-fail">$1</span>')
    .replace(/(⚠️)/g, '<span class="decision-NEEDS">$1</span>')
    .replace(/(🚨)/g, '<span class="rule-fail">$1</span>')
    .replace(/\b(APPROVE)\b/g, '<span class="decision-APPROVE">$1</span>')
    .replace(/\b(DENY)\b/g, '<span class="decision-DENY">$1</span>')
    .replace(/\b(NEEDS REVIEW)\b/g, '<span class="decision-NEEDS">$1</span>')
    .replace(/\b(EXPEDITE)\b/g, '<span class="rule-fail">$1</span>')
    .replace(/(═+|─+)/g, '<span class="separator">$1</span>')
    .replace(/\b(SATISFIED)\b/g, '<span class="rule-sat">$1</span>')
    .replace(/\b(NOT SATISFIED)\b/g, '<span class="rule-fail">$1</span>')
    .replace(/(LOW.*NEEDS REVIEW)/g, '<span class="rule-low">$1</span>');
}

function runCase(num) {
  if (controller) controller.abort();
  controller = new AbortController();

  document.querySelectorAll('.case-card').forEach(c => c.classList.remove('active'));
  document.getElementById('card-' + num).classList.add('active');

  const labels = ['', 'APPROVE (Standard urgency)', 'DENY', 'NEEDS REVIEW + EXPEDITE urgency'];
  document.getElementById('panel-title').textContent = 'Running Case ' + num + ' — ' + labels[num] + '…';
  document.getElementById('spinner').style.display = 'block';
  document.getElementById('output').innerHTML = '';

  const out = document.getElementById('output');

  fetch('/run/' + num, { signal: controller.signal })
    .then(resp => {
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      function read() {
        reader.read().then(({ done, value }) => {
          if (done) {
            document.getElementById('spinner').style.display = 'none';
            document.getElementById('panel-title').textContent = 'Case ' + num + ' complete';
            return;
          }
          const chunk = decoder.decode(value, { stream: true });
          out.innerHTML += colorize(chunk);
          out.scrollTop = out.scrollHeight;
          read();
        });
      }
      read();
    })
    .catch(err => {
      if (err.name !== 'AbortError') {
        document.getElementById('spinner').style.display = 'none';
        out.innerHTML += '\\n[Error: ' + err.message + ']';
      }
    });
}
</script>
</body>
</html>
"""


@app.route("/")
def index():
    return render_template_string(HTML)


@app.route("/run/<int:case_num>")
def run_case(case_num):
    if case_num not in (1, 2, 3):
        return "Invalid case", 400

    _, prescription = ALL_CASES[case_num - 1]

    def generate():
        buf = io.StringIO()
        log_buf = io.StringIO()

        # Capture both stdout and logging output
        handler = logging.StreamHandler(log_buf)
        handler.setLevel(logging.INFO)
        root_logger = logging.getLogger()
        root_logger.addHandler(handler)

        try:
            with contextlib.redirect_stdout(buf):
                result = adjudicate(prescription)

            # Stream the finalize_adjudication formatted report first
            yield "\n"
            for line in result.splitlines():
                yield line + "\n"

        except Exception as e:
            yield f"\n[ERROR] {e}\n"
        finally:
            root_logger.removeHandler(handler)

    return Response(
        stream_with_context(generate()),
        mimetype="text/plain",
        headers={"X-Accel-Buffering": "no", "Cache-Control": "no-cache"},
    )


if __name__ == "__main__":
    print("\n  Claims Adjudication Simulator")
    print("  Open: http://localhost:5001\n")
    app.run(host="0.0.0.0", port=5001, debug=False, threaded=True)
