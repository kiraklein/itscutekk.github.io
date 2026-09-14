const form = document.getElementById('riskForm');
const emptyState = document.getElementById('emptyState');
const resultContent = document.getElementById('resultContent');
let latest = null;

const gapRules = [
  ['q5', v => v > 0, 'Document intended use, prohibited use, known limitations and approved users.'],
  ['q6', v => v > 0, 'Attach recorded quality, bias, failure-mode and adversarial test evidence.'],
  ['q7', v => v > 0, 'Establish traceability for model/version, material inputs/outputs and key decisions.'],
  ['q8', v => v > 0, 'Assign named business and technical owners with clear accountability.'],
  ['q9', v => v > 0, 'Define monitoring thresholds, incident triggers and review cadence.'],
  ['q10', v => v > 0, 'Document an operational pause, override or rollback mechanism.']
];

function getValue(name){
  const el = form.querySelector(`input[name="${name}"]:checked`);
  return el ? Number(el.value) : 0;
}

function riskFrom(score){
  if(score <= 9) return ['Low','low','Current controls indicate a lower-risk profile. Maintain ownership, monitoring and traceability as the system changes.'];
  if(score <= 20) return ['Medium','medium','Material governance work remains. Close the evidence gaps and require explicit review before wider deployment.'];
  return ['High','high','This profile warrants enhanced review before production use, especially around autonomy, sensitive data, consequential decisions and rollback.'];
}

function buildControls(values, level){
  const controls = new Set();
  controls.add('Maintain a named business owner and technical owner for the system.');
  controls.add('Record the model/provider/version and approved purpose at each material release.');
  if(values.q1 >= 2) controls.add('Require meaningful human review for consequential decisions and document escalation criteria.');
  if(values.q2 >= 2) controls.add('Apply data minimisation, access controls, retention limits and privacy review for sensitive inputs.');
  if(values.q3 >= 2) controls.add('Restrict tool/action permissions to least privilege and require confirmation for destructive or external actions.');
  if(values.q4 >= 2) controls.add('Insert a human approval gate before consequential outputs are acted upon.');
  if(values.q6 > 0) controls.add('Run and retain scenario, failure-mode, bias and adversarial testing before material release.');
  if(values.q7 > 0) controls.add('Enable logs sufficient to reconstruct material AI-assisted decisions.');
  if(values.q9 > 0) controls.add('Monitor quality, harmful outcomes, drift and incidents with explicit thresholds.');
  if(values.q10 > 0) controls.add('Implement a tested kill switch, rollback or manual fallback path.');
  if(level === 'High') controls.add('Require independent risk/security review and explicit approval before production deployment.');
  return [...controls];
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const values = {};
  for(let i=1;i<=10;i++) values[`q${i}`] = getValue(`q${i}`);
  const score = Object.values(values).reduce((a,b)=>a+b,0);
  const [level, cls, summary] = riskFrom(score);
  const name = document.getElementById('systemName').value.trim();
  const owner = document.getElementById('owner').value.trim() || 'Not specified';
  const gaps = gapRules.filter(([q,test])=>test(values[q])).map(([, ,text])=>text);
  const controls = buildControls(values, level);
  const decision = level === 'Low'
    ? 'Proceed with documented ownership and routine monitoring. Reassess after material model, data, purpose or permission changes.'
    : level === 'Medium'
      ? 'Conditional proceed only after the listed evidence gaps are closed and the control set is confirmed by the accountable reviewer.'
      : 'Do not proceed to unrestricted production use until enhanced review is completed and critical controls are demonstrably in place.';

  latest = {generatedAt:new Date().toISOString(), system:name, owner, score, maxScore:34, riskLevel:level, evidenceGaps:gaps, recommendedControls:controls, decision, answers:values};

  document.getElementById('resultName').textContent = name;
  document.getElementById('score').textContent = score;
  const badge = document.getElementById('riskBadge');
  badge.textContent = `${level} risk`;
  badge.className = `risk-badge ${cls}`;
  document.getElementById('riskSummary').textContent = summary;
  document.getElementById('gaps').innerHTML = gaps.length ? gaps.map(x=>`<li>${x}</li>`).join('') : '<li>No major evidence gaps detected in this first-pass assessment.</li>';
  document.getElementById('controls').innerHTML = controls.map(x=>`<li>${x}</li>`).join('');
  document.getElementById('decision').innerHTML = `<strong>Owner:</strong> ${owner}<br><strong>Recommendation:</strong> ${decision}`;
  emptyState.hidden = true;
  resultContent.hidden = false;
  resultContent.scrollIntoView({behavior:'smooth', block:'start'});
});

document.getElementById('printBtn').addEventListener('click',()=>window.print());
document.getElementById('jsonBtn').addEventListener('click',()=>{
  if(!latest) return;
  const blob = new Blob([JSON.stringify(latest,null,2)],{type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${latest.system.toLowerCase().replace(/[^a-z0-9]+/g,'-') || 'velceron'}-governance.json`;
  a.click();
  URL.revokeObjectURL(url);
});