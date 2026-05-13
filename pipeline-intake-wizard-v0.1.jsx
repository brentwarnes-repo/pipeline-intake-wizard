import { useState } from "react";

const QUESTIONS = [
  {
    id: "frustration",
    label: "01 — THE PROBLEM",
    question: "What keeps piling up without getting done?",
    hint: "Ideas you never act on. Information you save but never use. Work that stalls because you don't know the next step.",
    type: "text",
    placeholder: "e.g. I save articles and never read them. Or: I have tons of voice notes I never process.",
  },
  {
    id: "input",
    label: "02 — WHAT COMES IN",
    question: "What does this stuff look like when it arrives?",
    hint: "Pick everything that applies.",
    type: "multi",
    options: [
      "Voice memos or verbal ideas",
      "Text notes or written ideas",
      "Links, articles, or bookmarks",
      "Emails or messages",
      "Documents or files",
      "Screenshots or images",
      "Physical notes or paper",
      "Something else",
    ],
  },
  {
    id: "stuck",
    label: "03 — WHERE IT BREAKS",
    question: "Where does this stuff usually get stuck?",
    hint: "Most pipelines break at the same place every time.",
    type: "single",
    options: [
      "I capture it but never look at it again",
      "I look at it but don't know what to do with it",
      "I know what to do but never start",
      "I start but don't finish",
      "I finish but don't know where to put it",
    ],
  },
  {
    id: "output",
    label: "04 — WHAT DONE LOOKS LIKE",
    question: "If this pipeline worked, what would exist that doesn't exist now?",
    hint: "Complete this: 'After this runs, I will have...'",
    type: "text",
    placeholder: "e.g. A clear summary of every article I save. Or: My ideas ranked by what's worth doing.",
  },
  {
    id: "frequency",
    label: "05 — HOW OFTEN",
    question: "How often does this input arrive?",
    type: "single",
    options: [
      "Constantly — multiple times a day",
      "Daily",
      "A few times a week",
      "Weekly",
      "Irregularly",
    ],
  },
  {
    id: "aiexperience",
    label: "06 — WHERE YOU ARE",
    question: "How have you been using AI so far?",
    hint: "This shapes what your v0.1 looks like.",
    type: "single",
    options: [
      "Mostly chatting — questions and answers",
      "Some structured tasks — writing, summarizing, drafting",
      "I've run a few repeatable workflows",
      "I have working pipelines already",
    ],
  },
];

function getBreakFix(stuck) {
  const fixes = {
    "I capture it but never look at it again": "Build a review trigger — a scheduled time (weekly works) where you open the pile and do one thing with each item. Without a trigger, the pile is just a graveyard.",
    "I look at it but don't know what to do with it": "Build a triage prompt — one question you give AI for every item: 'What type of thing is this, and what's the one next action?' Run that first.",
    "I know what to do but never start": "The first step is too big. Shrink it to something completable in under 2 minutes. The pipeline doesn't fail at execution — it fails at ignition.",
    "I start but don't finish": "Define 'good enough to move forward' before you start. Perfectionism is a pipeline killer. Ship the 80% version.",
    "I finish but don't know where to put it": "You need a landing zone — one named place where outputs go consistently. The pipeline isn't done until the output has a home.",
  };
  return fixes[stuck] || "Find the exact moment the flow stops. That's the only thing you need to fix first.";
}

function getV01(answers) {
  const lvl = answers.aiexperience;
  if (lvl === "Mostly chatting — questions and answers") {
    return "Your v0.1 is a single prompt. Write one prompt that takes one piece of input and produces one useful output. Paste it into Claude or ChatGPT. Run it manually on 3 real items. Don't build anything yet — just prove the prompt works.";
  }
  if (lvl === "Some structured tasks — writing, summarizing, drafting") {
    return "Your v0.1 is a session template. Write down: what you bring in, what prompt you run, where the output goes. Run it manually once a week. Consistent manual execution before any automation.";
  }
  return "Your v0.1 is a defined workflow. Input → prompt → output → destination. Run it end-to-end manually at least 3 times before adding any automation or tooling.";
}

function generateSpec(answers) {
  const inputs = Array.isArray(answers.input) ? answers.input : [answers.input];
  const inputStr = inputs.length <= 2 ? inputs.join(", ") : `${inputs[0]}, ${inputs[1]} + ${inputs.length - 2} more`;
  return {
    oneLiner: `${inputStr} → [AI step] → ${answers.output || "useful output"}`,
    breakFix: getBreakFix(answers.stuck),
    v01: getV01(answers),
    steps: [
      "Write one prompt that handles one item from your pile",
      "Run it manually on 3 real examples — does it produce what you described?",
      "If yes: define where the output goes and name it consistently",
      "If yes: schedule a recurring time to run the whole thing",
      "Only automate after the manual version works reliably 3+ times",
    ],
  };
}

function Dots({ total, cur }) {
  return (
    <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{
          width: i === cur ? 18 : 5, height: 5, borderRadius: 3,
          background: i <= cur ? "#c8f060" : "#181828",
          transition: "all 0.25s",
          opacity: i > cur ? 0.5 : 1,
        }} />
      ))}
    </div>
  );
}

export default function App() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [tv, setTv] = useState("");
  const [mv, setMv] = useState([]);
  const [sv, setSv] = useState("");
  const [done, setDone] = useState(false);
  const [tab, setTab] = useState("spec");
  const [copied, setCopied] = useState(false);

  const q = QUESTIONS[step];
  const ok = q.type === "text" ? tv.trim() : q.type === "multi" ? mv.length > 0 : !!sv;

  function next() {
    if (!ok) return;
    const val = q.type === "text" ? tv.trim() : q.type === "multi" ? mv : sv;
    const a = { ...answers, [q.id]: val };
    setAnswers(a);
    setTv(""); setMv([]); setSv("");
    if (step + 1 >= QUESTIONS.length) setDone(true);
    else setStep(s => s + 1);
  }

  function back() {
    if (step === 0) return;
    setStep(s => s - 1);
    setTv(""); setMv([]); setSv("");
  }

  function reset() {
    setStep(0); setAnswers({}); setTv(""); setMv([]);
    setSv(""); setDone(false); setTab("spec"); setCopied(false);
  }

  const spec = done ? generateSpec(answers) : null;

  function copy() {
    if (!spec) return;
    const t = [
      "── PIPELINE SPEC ──────────────────────────",
      "",
      "PROBLEM",
      answers.frustration,
      "",
      "INPUTS",
      (Array.isArray(answers.input) ? answers.input : [answers.input]).join(", "),
      "",
      "WHERE IT BREAKS",
      answers.stuck,
      "",
      "DONE LOOKS LIKE",
      answers.output,
      "",
      "FREQUENCY",
      answers.frequency,
      "",
      "── YOUR PIPELINE ───────────────────────────",
      "",
      spec.oneLiner,
      "",
      "── WHERE IT BREAKS & THE FIX ───────────────",
      "",
      spec.breakFix,
      "",
      "── YOUR V0.1 ───────────────────────────────",
      "",
      spec.v01,
      "",
      "── NEXT 5 ACTIONS ──────────────────────────",
      "",
      ...spec.steps.map((s, i) => `${i + 1}. ${s}`),
      "",
      "────────────────────────────────────────────",
      "Pipeline Intake Wizard v0.1",
    ].join("\n");
    navigator.clipboard.writeText(t).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&display=swap');
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    .w{min-height:100vh;background:#08080f;display:flex;align-items:center;justify-content:center;padding:24px 16px;font-family:'IBM Plex Mono',monospace}
    .card{width:100%;max-width:560px;background:#0c0c18;border:1px solid #18182a;border-radius:3px;overflow:hidden}
    .hdr{background:#08080e;border-bottom:1px solid #14142a;padding:13px 24px;display:flex;align-items:center;justify-content:space-between}
    .wm{font-size:9px;letter-spacing:.22em;color:#8888aa;text-transform:uppercase}
    .wm b{color:#c8f060;font-weight:500}
    .body{padding:32px 28px 24px}
    .prow{display:flex;align-items:center;justify-content:space-between;margin-bottom:30px}
    .qlabel{font-size:9px;letter-spacing:.3em;color:#c8f060;text-transform:uppercase}
    .qnum{font-size:9px;color:#8888aa;letter-spacing:.12em}
    .qtxt{font-size:17px;font-weight:500;color:#ffffff;line-height:1.4;margin-bottom:7px}
    .qhint{font-size:11px;color:#aaaacc;line-height:1.6;margin-bottom:24px}
    textarea{width:100%;background:#060610;border:1px solid #333355;border-radius:2px;color:#ffffff;font-family:'IBM Plex Mono',monospace;font-size:13px;line-height:1.6;padding:12px 14px;resize:none;outline:none;min-height:84px;transition:border-color .2s;caret-color:#c8f060}
    textarea:focus{border-color:#c8f060}
    textarea::placeholder{color:#555577}
    .opts{display:flex;flex-direction:column;gap:5px}
    .opt{background:#080812;border:1px solid #2a2a48;border-radius:2px;color:#ccccee;font-family:'IBM Plex Mono',monospace;font-size:12px;padding:10px 13px;text-align:left;cursor:pointer;transition:all .12s;display:flex;align-items:center;gap:9px}
    .opt:hover{border-color:#6666aa;color:#ffffff}
    .opt.on{border-color:#c8f060;color:#c8f060;background:#080d04}
    .dot{width:5px;height:5px;border-radius:50%;border:1px solid currentColor;flex-shrink:0;transition:background .12s}
    .opt.on .dot{background:#c8f060}
    .acts{display:flex;align-items:center;justify-content:space-between;margin-top:24px;padding-top:18px;border-top:1px solid #222238}
    .bk{background:none;border:none;font-family:'IBM Plex Mono',monospace;font-size:10px;color:#8888aa;cursor:pointer;letter-spacing:.1em;transition:color .2s}
    .bk:hover:not(:disabled){color:#ffffff}
    .bk:disabled{opacity:.25;cursor:default}
    .nx{background:#c8f060;border:none;border-radius:2px;font-family:'IBM Plex Mono',monospace;font-size:10px;font-weight:500;letter-spacing:.18em;text-transform:uppercase;color:#08080f;padding:10px 22px;cursor:pointer;transition:all .15s}
    .nx:hover:not(:disabled){background:#d4ff6a}
    .nx:disabled{opacity:.2;cursor:not-allowed}
    .rhdr{padding:24px 28px 0}
    .rtag{font-size:9px;letter-spacing:.3em;color:#c8f060;text-transform:uppercase;margin-bottom:8px}
    .rtit{font-size:19px;font-weight:500;color:#ffffff;margin-bottom:3px}
    .rsub{font-size:11px;color:#aaaacc;line-height:1.5}
    .tabs{display:flex;border-bottom:1px solid #222238;padding:0 28px;margin-top:20px}
    .tb{background:none;border:none;font-family:'IBM Plex Mono',monospace;font-size:9px;letter-spacing:.18em;text-transform:uppercase;padding:9px 0;margin-right:20px;cursor:pointer;transition:color .15s;border-bottom:1px solid transparent;margin-bottom:-1px}
    .tb.on{color:#c8f060;border-bottom-color:#c8f060}
    .tb:not(.on){color:#8888aa}
    .tb:not(.on):hover{color:#ffffff}
    .tc{padding:22px 28px 24px}
    .sb{margin-bottom:20px}
    .sl{font-size:9px;letter-spacing:.25em;text-transform:uppercase;color:#8888aa;margin-bottom:7px}
    .sv{font-size:13px;color:#ddddff;line-height:1.6}
    .hi{color:#c8f060;font-size:13px;background:#080c04;border:1px solid #2a3a10;border-radius:2px;padding:11px 13px;line-height:1.5}
    .fb{background:#090c18;border:1px solid #2a3060;border-left:2px solid #6688ff;border-radius:2px;padding:13px 14px;font-size:11px;color:#aabbff;line-height:1.7}
    .vb{border:1px solid #2a3a10;border-left:2px solid #c8f060;border-radius:2px;padding:13px 14px;font-size:11px;color:#c8f060;line-height:1.7;background:#070a04}
    .stps{display:flex;flex-direction:column;gap:9px}
    .si{display:flex;gap:11px;align-items:flex-start;font-size:12px;color:#ddddff;line-height:1.5}
    .sn{flex-shrink:0;width:17px;height:17px;border-radius:50%;border:1px solid #6666aa;display:flex;align-items:center;justify-content:center;font-size:8px;color:#c8f060;margin-top:1px}
    .ract{padding:0 28px 24px;display:flex;gap:9px}
    .cpb{flex:1;background:#c8f060;border:none;border-radius:2px;font-family:'IBM Plex Mono',monospace;font-size:10px;font-weight:500;letter-spacing:.18em;text-transform:uppercase;color:#08080f;padding:12px;cursor:pointer;transition:all .15s}
    .cpb:hover{background:#d4ff6a}
    .cpb.ok{background:#0e1a04;color:#c8f060}
    .agb{background:none;border:1px solid #333355;border-radius:2px;font-family:'IBM Plex Mono',monospace;font-size:10px;color:#aaaacc;padding:12px 16px;cursor:pointer;transition:all .15s;white-space:nowrap;letter-spacing:.1em}
    .agb:hover{border-color:#8888aa;color:#ffffff}
  `;

  const TABS = ["spec", "fix", "v0.1", "steps"];

  return (
    <>
      <style>{css}</style>
      <div className="w">
        <div className="card">
          <div className="hdr">
            <div className="wm">Pipeline <b>Intake</b> Wizard · v0.1</div>
            {!done && <Dots total={QUESTIONS.length} cur={step} />}
          </div>

          {!done ? (
            <div className="body">
              <div className="prow">
                <div className="qlabel">{q.label}</div>
                <div className="qnum">{step + 1} / {QUESTIONS.length}</div>
              </div>
              <div className="qtxt">{q.question}</div>
              {q.hint && <div className="qhint">{q.hint}</div>}

              {q.type === "text" && (
                <textarea
                  value={tv}
                  onChange={e => setTv(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) next(); }}
                  placeholder={q.placeholder}
                  autoFocus
                />
              )}

              {(q.type === "single" || q.type === "multi") && (
                <div className="opts">
                  {q.options.map(o => {
                    const on = q.type === "multi" ? mv.includes(o) : sv === o;
                    return (
                      <button
                        key={o}
                        className={`opt${on ? " on" : ""}`}
                        onClick={() => q.type === "multi"
                          ? setMv(p => p.includes(o) ? p.filter(x => x !== o) : [...p, o])
                          : setSv(o)
                        }
                      >
                        <span className="dot" />{o}
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="acts">
                <button className="bk" onClick={back} disabled={step === 0}>← back</button>
                <button className="nx" onClick={next} disabled={!ok}>
                  {step + 1 === QUESTIONS.length ? "Build Spec →" : "Next →"}
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="rhdr">
                <div className="rtag">Your Pipeline Spec</div>
                <div className="rtit">Here's what you're building.</div>
                <div className="rsub">Start with v0.1 — one step, manual, one time. Then improve.</div>
              </div>

              <div className="tabs">
                {TABS.map(t => (
                  <button key={t} className={`tb${tab === t ? " on" : ""}`} onClick={() => setTab(t)}>
                    {t}
                  </button>
                ))}
              </div>

              <div className="tc">
                {tab === "spec" && (
                  <>
                    <div className="sb"><div className="sl">Pipeline in one line</div><div className="sv hi">{spec.oneLiner}</div></div>
                    <div className="sb"><div className="sl">Problem</div><div className="sv">{answers.frustration}</div></div>
                    <div className="sb"><div className="sl">Where it breaks</div><div className="sv">{answers.stuck}</div></div>
                    <div className="sb"><div className="sl">Done looks like</div><div className="sv">{answers.output}</div></div>
                    <div className="sb"><div className="sl">Frequency</div><div className="sv">{answers.frequency}</div></div>
                  </>
                )}
                {tab === "fix" && (
                  <div className="sb"><div className="sl">The break — and the fix</div><div className="fb">{spec.breakFix}</div></div>
                )}
                {tab === "v0.1" && (
                  <>
                    <div className="sb"><div className="sl">What to build first</div><div className="vb">{spec.v01}</div></div>
                    <div className="sb"><div className="sl">The rule</div><div className="sv">The smallest version a real person can use today. Automate nothing until the manual version works.</div></div>
                  </>
                )}
                {tab === "steps" && (
                  <div className="stps">
                    {spec.steps.map((s, i) => (
                      <div key={i} className="si"><div className="sn">{i + 1}</div><div>{s}</div></div>
                    ))}
                  </div>
                )}
              </div>

              <div className="ract">
                <button className={`cpb${copied ? " ok" : ""}`} onClick={copy}>
                  {copied ? "✓ Copied" : "Copy spec"}
                </button>
                <button className="agb" onClick={reset}>New pipeline</button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
