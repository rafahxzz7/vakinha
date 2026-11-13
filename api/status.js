export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'método não permitido' });

  const key = process.env.STRATON_KEY;
  if (!key) return res.status(500).json({ error: 'STRATON_KEY não configurada' });

  const id = String(req.query.id || '');
  if (!/^[A-Za-z0-9_-]{3,80}$/.test(id)) return res.status(400).json({ error: 'id inválido' });

  const r = await fetch(
    'https://stratonbot.app/api/public/v1/cashin/' + encodeURIComponent(id),
    { headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' } }
  );

  const bruto = await r.json().catch(() => ({}));

  if (!r.ok) {
    return res.status(r.status).json({ error: bruto?.error || 'falha na consulta', detalhe: bruto });
  }

  const d = bruto.data || {};
  res.setHeader('Cache-Control', 'no-store');
  return res.status(200).json({
    id: d.transaction_id,
    status: d.status,
    emv: d.pix_code,
    qr_url: d.qr_code,
    expires_at: d.expires_at,
    paid_at: d.paid_at
  });
}