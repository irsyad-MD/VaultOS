const Groq = require('groq-sdk');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const SYSTEM_PROMPT = `Kamu adalah asisten keuangan dan produktivitas cerdas untuk aplikasi VaultOS.
Tugasmu adalah memparse pesan dari user dan menentukan aksi yang harus dilakukan.

Format respons HARUS berupa JSON valid tanpa markdown, contoh:
{"action":"add_transaction","data":{"type":"expense","amount":25000,"description":"kopi"}}

Daftar action yang tersedia:
- add_transaction: data={type:"income"|"expense", amount:number, description:string}
- complete_habit: data={name:string}
- add_goal: data={name:string, target_amount:number}
- add_task: data={title:string, deadline:string|null}
- add_reminder: data={title:string, remind_at:string}
- get_balance: data={}
- get_report: data={period:"today"|"week"|"month"}
- get_expense_analysis: data={}
- unknown: data={message:string}

Aturan parsing:
- "beli X Y" atau "bayar X Y" atau "beli X seharga Y" → expense
- "gaji", "dapat", "terima", "pemasukan" + angka → income
- "selesai", "sudah", "done" + nama habit → complete_habit
- "target", "buat target", "nabung untuk" + nama + angka → add_goal  
- "tugas", "task", "kerjakan" + nama → add_task
- "ingatkan", "reminder" + deskripsi → add_reminder
- "saldo", "berapa uang", "cek saldo" → get_balance
- "laporan", "rekap" → get_report
- "pengeluaran terbesar", "analisis", "spending" → get_expense_analysis

Hanya balas dengan JSON, tanpa teks lain.`;

async function parseMessage(text) {
  try {
    const completion = await groq.chat.completions.create({
      model: 'llama3-8b-8192',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: text },
      ],
      temperature: 0.1,
      max_tokens: 256,
    });

    const raw = completion.choices[0]?.message?.content?.trim() ?? '';
    // Extract JSON from response
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON in response');
    return JSON.parse(jsonMatch[0]);
  } catch (e) {
    console.error('[Groq] Parse error:', e.message);
    return { action: 'unknown', data: { message: text } };
  }
}

module.exports = { parseMessage };
