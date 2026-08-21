/* Main game state and UI coordination. Patient data and scoring logic stay in their own files. */
const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
let progress = Storage.get();
let state;

function freshState(queue) {
  return { score:0, streak:0, longest:0, completed:0, correct:0, times:[], queue,
    byLevel:{stable:[0,0],urgent:[0,0],emergency:[0,0]}, current:null, startedAt:0, locked:false, advancing:false, finished:false, timer:null };
}
function showPage(id) {
  $$('.page').forEach(page => page.classList.remove('active'));
  $(id).classList.add('active');
  if (id === '#home') renderSavedProgress();
  window.scrollTo({top:0,behavior:'smooth'});
}
function shuffled(items) { return [...items].sort(() => Math.random() - .5); }
function casePool() {
  const mode = $('#difficulty').value;
  if (mode === 'student') return patients.filter(p => p.difficulty !== 'codeblue');
  if (mode === 'codeblue') return patients.filter(p => p.difficulty !== 'student');
  return patients;
}
function makeQueue() {
  const pool = casePool();
  const used = new Set();
  const take = (level, count) => shuffled(pool.filter(patient => patient.correctTriage === level && !used.has(patient.id))).slice(0,count);
  const add = patientsToAdd => patientsToAdd.forEach(patient => used.add(patient.id));
  // Start with an engaging emergency case, then deliberately mix all three simulated categories.
  const opening = pool.find(patient => patient.id === '021') || shuffled(pool.filter(patient => patient.correctTriage === 'emergency'))[0];
  const queue = opening ? [opening] : [];
  if (opening) used.add(opening.id);
  const stable = take('stable',3); add(stable);
  const urgent = take('urgent',3); add(urgent);
  const emergency = take('emergency',2); add(emergency);
  queue.push(...shuffled([...stable,...urgent,...emergency]));
  const remaining = shuffled(pool.filter(patient => !used.has(patient.id))).slice(0,10-queue.length);
  return [...queue,...remaining].slice(0,10); // Unique IDs prevent repeats within one shift.
}
function renderSavedProgress() {
  $('#savedHigh').textContent = progress.highScore || 0;
  $('#savedCases').textContent = progress.total || 0;
}
function displayScore() {
  $('#score').textContent = state.score;
  $('#streak').textContent = state.streak;
}
async function startShift() {
  state = freshState(makeQueue());
  showPage('#game');
  loadCase();
  /* Dynamic generation is deliberately a quiet enhancement: the built-in case appears immediately. */
  if ($('#dynamic').checked && AI.available) {
    try {
      const generated = await AI.case();
      if (generated && !state.locked && state.completed === 0) { state.queue[0] = generated; loadCase(); }
    } catch { /* Valid built-in data remains in use. */ }
  }
}
function vital(label, value, abnormal) {
  return `<div class="vital ${abnormal ? 'abnormal' : ''}"><span>${label}</span><b>${value}</b></div>`;
}
function hintFor(patient) {
  const flags=[];
  if (patient.spo2 < 94) flags.push('oxygen saturation');
  if (patient.respiratoryRate > 22 || patient.respiratoryRate < 10) flags.push('breathing rate');
  if (patient.heartRate > 110 || patient.heartRate < 50) flags.push('heart rate');
  if (patient.systolicBP < 95) flags.push('blood pressure');
  return flags.length ? `Look closely at ${flags.join(', ')} in this fictional case.` : 'Consider the complete scenario; one number does not tell the whole story.';
}
function loadCase() {
  if (state.finished) return;
  if (state.completed === 10) return finishShift();
  const patient = state.queue[state.completed];
  state.current = patient;
  state.locked = false;
  state.advancing = false;
  document.querySelectorAll('.patient-card, .vitals').forEach(card => {
    card.classList.remove('patient-arrival');
    requestAnimationFrame(() => card.classList.add('patient-arrival'));
  });
  $('#result').hidden = true;
  $('#answer').textContent = '';
  $('#attendingQuestion').value = '';
  $$('[data-triage]').forEach(button => { button.disabled=false; button.removeAttribute('aria-pressed'); });
  $('#caseNum').textContent = state.completed + 1;
  $('#caseTitle').textContent = 'Incoming patient';
  $('#patientId').textContent = '#' + patient.id;
  $('#patientAge').textContent = patient.age + ' years';
  $('#symptoms').innerHTML = patient.symptoms.map(item => `<li>${item}</li>`).join('');
  $('#scenario').textContent = `“${patient.scenario}”`;
  $('#arrival').textContent = ['just now','4 minutes ago','9 minutes ago','14 minutes ago'][state.completed % 4];
  const displayVitals = [
    vital('Heart rate',`${patient.heartRate} BPM`,patient.heartRate < 50 || patient.heartRate > 110),
    vital('SpO₂',`${patient.spo2}%`,patient.spo2 < 94),
    vital('Temperature',`${patient.temperature}°F`,patient.temperature > 101.5),
    vital('Blood pressure',`${patient.systolicBP}/${patient.diastolicBP}`,patient.systolicBP < 95 || patient.systolicBP > 170),
    vital('Respiratory rate',`${patient.respiratoryRate}/min`,patient.respiratoryRate > 22 || patient.respiratoryRate < 10)
  ];
  $('#vitalGrid').innerHTML = displayVitals.join('');
  const showHint = $('#difficulty').value === 'student' && $('#hints').checked;
  $('#hint').hidden = !showHint;
  $('#hintText').textContent = hintFor(patient);
  state.startedAt = Date.now();
  clearInterval(state.timer);
  state.timer = setInterval(updateTimer, 250);
  updateTimer();
}
function updateTimer() {
  const seconds=(Date.now()-state.startedAt)/1000;
  const limit=$('#difficulty').value === 'codeblue' ? 25 : 45;
  $('#timerText').textContent=`00:${String(Math.floor(seconds)).padStart(2,'0')}`;
  $('#timerFill').style.width=Math.max(0,100-seconds/limit*100)+'%';
  if (seconds >= limit && !state.locked) chooseTriage('timeout');
}
async function chooseTriage(choice) {
  if (state.locked) return;
  state.locked=true;
  clearInterval(state.timer);
  const patient=state.current;
  const elapsed=(Date.now()-state.startedAt)/1000;
  const correct=choice===patient.correctTriage;
  state.times.push(elapsed);
  state.byLevel[patient.correctTriage][1]++;
  $$('[data-triage]').forEach(button=>{button.disabled=true;button.setAttribute('aria-pressed',String(button.dataset.triage===choice));});
  AudioFX.click();
  if(correct){
    state.correct++; state.streak++; state.longest=Math.max(state.longest,state.streak); state.byLevel[patient.correctTriage][0]++;
    const speedBonus=Math.round(Math.max(0,50-Math.min(elapsed,50)));
    const multiplier=1+Math.min(state.streak-1,4)*.1;
    const earned=Math.round((100+speedBonus)*multiplier);
    state.score+=earned; AudioFX.correct();
    $('#resultBadge').textContent=`✓ CORRECT · +${earned}`; $('#resultBadge').className='good';
    $('#resultTitle').textContent='Strong call.';
  } else {
    state.streak=0; AudioFX.wrong();
    $('#resultBadge').textContent='× INCORRECT · 0 POINTS'; $('#resultBadge').className='bad';
  $('#resultTitle').textContent=choice==='timeout'?'Time elapsed.':'Review the clues.';
  }
  state.completed++;
  displayScore();
  $('#analysisText').textContent=patient.educationalReason;
  // The button is disabled only while advancing; make it ready for this result screen.
  $('#nextBtn').disabled=false;
  $('#result').hidden=false;
  $('#nextBtn').textContent=state.completed===10?'View Shift Summary →':'Next Patient →';
  if(AI.available) {
    AI.ask(`Case: ${JSON.stringify(patient)}. The player chose ${choice}. Give a concise, 2–4 sentence Case Analysis.`)
      .then(text=>{if(text && state.current===patient) $('#analysisText').textContent=text;})
      .catch(()=>{});
  }
}
function finishShift() {
  if (state.finished) return;
  state.finished = true;
  clearInterval(state.timer);
  const accuracy=Math.round(state.correct/state.completed*100);
  const average=Math.round(state.times.reduce((sum,time)=>sum+time,0)/state.times.length);
  $('#finalScore').textContent=state.score;
  $('#finalAccuracy').textContent=accuracy+'%';
  $('#finalStreak').textContent=state.longest;
  $('#finalTime').textContent=average+'s';
  $('#grade').textContent=accuracy>=90?'S':accuracy>=80?'A':accuracy>=65?'B':'C';
  $('#breakdown').innerHTML=['stable','urgent','emergency'].map(level=>`<div><b>${level[0].toUpperCase()+level.slice(1)}</b><span>${state.byLevel[level][0]} / ${state.byLevel[level][1]} correctly identified</span></div>`).join('');
  progress.highScore=Math.max(progress.highScore||0,state.score);
  progress.longestStreak=Math.max(progress.longestStreak||0,state.longest);
  progress.total=(progress.total||0)+10;
  progress.bestAccuracy=Math.max(progress.bestAccuracy||0,accuracy);
  Storage.save(progress);
  showPage('#complete');
}
function saveSettings() {
  progress.settings={difficulty:$('#difficulty').value,hints:$('#hints').checked,dynamic:$('#dynamic').checked,muted:AudioFX.muted};
  Storage.save(progress);
}

$$('[data-triage]').forEach(button=>button.addEventListener('click',()=>chooseTriage(button.dataset.triage)));
$('#startBtn').addEventListener('click',startShift);
$('#newShiftBtn').addEventListener('click',startShift);
$('#nextBtn').addEventListener('click',()=>{
  if (state.advancing || state.finished) return;
  state.advancing=true;
  $('#nextBtn').disabled=true;
  loadCase();
});
$('#settingsBtn').addEventListener('click',()=>$('#settings').showModal());
$('#muteBtn').addEventListener('click',()=>{AudioFX.muted=!AudioFX.muted;$('#muteBtn').textContent=AudioFX.muted?'◔':'◖';saveSettings();});
$('#soundToggle').addEventListener('change',()=>{AudioFX.muted=!$('#soundToggle').checked;$('#muteBtn').textContent=AudioFX.muted?'◔':'◖';saveSettings();});
$('#resetBtn').addEventListener('click',()=>{Storage.reset();progress=Storage.get();AudioFX.muted=progress.settings.muted;renderSavedProgress();$('#settings').close();});
$('#askBtn').addEventListener('click',async()=>{const question=$('#attendingQuestion').value.trim();if(!question)return;$('#answer').textContent='Thinking…';try{$('#answer').textContent=await AI.ask(`Case: ${JSON.stringify(state.current)}. Question: ${question}`)}catch{$('#answer').textContent='Interactive case questions are available during supported demonstrations.'}});
document.addEventListener('keydown',event=>{if(!$('#game').classList.contains('active')||event.target.tagName==='INPUT')return;const choice={1:'stable',2:'urgent',3:'emergency'}[event.key];if(choice)chooseTriage(choice);});
$$('a[href^="#"]').forEach(link=>link.addEventListener('click',event=>{const target=link.getAttribute('href');if($(target)){event.preventDefault();showPage(target);history.replaceState(null,'',target);}}));
['difficulty','hints','dynamic'].forEach(id=>$('#'+id).addEventListener('change',saveSettings));
$('#difficulty').value=progress.settings.difficulty;
$('#hints').checked=progress.settings.hints;
$('#dynamic').checked=progress.settings.dynamic;
AudioFX.muted=progress.settings.muted;
$('#muteBtn').textContent=AudioFX.muted?'◔':'◖';
$('#soundToggle').checked=!AudioFX.muted;
renderSavedProgress();
AI.check().then(available => { $('#dynamicOption').hidden = !available; });
