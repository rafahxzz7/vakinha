export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'método não permitido' });

  const key = process.env.STRATON_KEY;
  if (!key) return res.status(500).json({ error: 'STRATON_KEY não configurada' });

  const { amount, reference, payer } = req.body || {};
  const valor = Number(amount);

  if (!valor || valor < 1) return res.status(400).json({ error: 'valor inválido' });
  if (valor > 5000) return res.status(400).json({ error: 'valor acima de R$ 5.000,00' });
  if (!payer?.name || !payer?.email || !payer?.document) {
    return res.status(400).json({ error: 'dados do pagador incompletos' });
  }

  const r = await fetch('https://stratonbot.app/api/public/v1/cashin', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json',
      'Idempotency-Key': crypto.randomUUID()
    },
    body: JSON.stringify({
      amount: Number(valor.toFixed(2)),
      external_id: reference,
      description: 'Doacao Maria Cecilia',
      customer: {
        name: payer.name,
        email: payer.email,
        document: payer.document
      }
    })
  });

  const bruto = await r.json().catch(() => ({}));

  if (!r.ok) {
    return res.status(r.status).json({
      error: bruto?.error || 'falha ao criar cobrança',
      detalhe: bruto
    });
  }

  const d = bruto.data || {};
  return res.status(200).json({
    id: d.transaction_id,
    emv: d.pix_code,
    qr_url: d.qr_code,
    expires_at: d.expires_at
  });
}