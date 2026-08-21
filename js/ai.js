/* Optional local enhancement. Browser access to Ollama may be blocked by HTTPS/CORS; core play never depends on it. */
const AI = {
  available: false,
  prompt: `You are an educational assistant inside a fictional hospital triage simulator.
Explain why a fictional simulated patient was categorized Stable, Urgent, or Emergency.
Never diagnose a disease, recommend medications, provide individualized medical advice, or give treatment instructions.
Only explain fictional warning signs, symptoms, and vital signs.
Keep responses concise, educational, and appropriate for high school students.`,

  async check() {
    try {
      const response = await fetch('http://localhost:11434/api/tags', { signal:AbortSignal.timeout(900) });
      this.available = response.ok;
    } catch {
      this.available = false;
    }
    return this.available;
  },

  async ask(message) {
    if (!this.available) throw new Error('unavailable');
    const response = await fetch('http://localhost:11434/api/chat', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      signal:AbortSignal.timeout(5000),
      body:JSON.stringify({
        model:'llama3.2:3b',
        stream:false,
        messages:[{role:'system',content:this.prompt},{role:'user',content:message}]
      })
    });
    if (!response.ok) throw new Error('request failed');
    const data = await response.json();
    return typeof data.message?.content === 'string' ? data.message.content.slice(0,800) : '';
  },

  validCase(value) {
    const finiteInRange = (number,min,max) => Number.isFinite(number) && number >= min && number <= max;
    return value && typeof value === 'object'
      && Number.isInteger(value.age) && value.age >= 1 && value.age <= 110
      && Array.isArray(value.symptoms) && value.symptoms.length >= 1 && value.symptoms.length <= 6
      && value.symptoms.every(item => typeof item === 'string' && item.length > 0 && item.length <= 80)
      && typeof value.scenario === 'string' && value.scenario.length > 0 && value.scenario.length <= 400
      && finiteInRange(value.heartRate,20,240) && finiteInRange(value.spo2,50,100)
      && finiteInRange(value.temperature,90,110) && finiteInRange(value.systolicBP,50,250)
      && finiteInRange(value.diastolicBP,30,160) && finiteInRange(value.respiratoryRate,4,60)
      && ['stable','urgent','emergency'].includes(value.correctTriage)
      && typeof value.educationalReason === 'string' && value.educationalReason.length > 0 && value.educationalReason.length <= 600;
  },

  async case() {
    const raw = await this.ask('Return only JSON with age, symptoms, scenario, heartRate, spo2, temperature, systolicBP, diastolicBP, respiratoryRate, correctTriage, and educationalReason. Create a safe fictional educational case.');
    const value = JSON.parse(raw.replace(/\`\`\`json|\`\`\`/g,'').trim());
    return this.validCase(value) ? {...value,id:'AI-'+Math.floor(Math.random()*900)} : null;
  }
};
