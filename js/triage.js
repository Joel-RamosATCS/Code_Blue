/* Simplified educational scoring algorithm — not real hospital triage guidance. */
function urgencyScore(p){
 let score=0; // Each warning sign adds points; higher totals mean greater simulated urgency.
 if(p.spo2<90) score+=5; else if(p.spo2<94) score+=2;
 if(p.heartRate>130||p.heartRate<50) score+=4; else if(p.heartRate>105) score+=1;
 if(p.respiratoryRate>28||p.respiratoryRate<10) score+=4; else if(p.respiratoryRate>22) score+=1;
 if(p.systolicBP<90) score+=4;
 const words=(p.symptoms.join(' ')+' '+p.scenario).toLowerCase();
 ['difficulty breathing','severe bleeding','fainted','confusion','trouble speaking','blue-tinged','difficult to wake','chest pressure'].forEach(clue=>{if(words.includes(clue))score+=3});
 return score;
}
function simulatedLevel(p){const s=urgencyScore(p);return s>=7?'emergency':s>=2?'urgent':'stable'};
