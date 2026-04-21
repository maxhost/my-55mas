import type { ColumnMapping, DbColumn } from '../types';

/**
 * Normalize a string for comparison: lowercase, remove accents, trim.
 */
function normalize(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

/**
 * Score how well a CSV column name matches a DB column name.
 * Returns 0 (no match) to 1 (exact match).
 */
function matchScore(csvCol: string, dbCol: string): number {
  const a = normalize(csvCol);
  const b = normalize(dbCol);

  if (!a || !b) return 0;
  if (a === b) return 1;
  // Require the shorter string to be ≥4 chars to avoid spurious substring hits
  // like "age" matching "otherlanguage"
  if (Math.min(a.length, b.length) >= 4 && (a.includes(b) || b.includes(a))) return 0.7;

  // Check for common aliases
  const aliases: Record<string, string[]> = {
    name: ['nombre', 'nom', 'nome', 'fullname', 'full_name'],
    email: ['correo', 'mail', 'emailaddress'],
    phone: ['telefone', 'telefono', 'tel'],
    city: ['ciudad', 'cidade', 'ville', 'ciutat'],
    country: ['pais', 'pays'],
    status: ['estado', 'estat', 'statut', 'candidatestatus'],
    nif: ['nie', 'taxid', 'dni', 'cif', 'identificacion'],
    is_business: ['clienttype', 'type', 'tipo'],
    legacy_id: ['client', 'specialist', 'numero', 'appointment', 'appointmentnumber', 'pedido', 'numeropedido'],
    created_at: ['joinedat', 'registeredat', 'fecha', 'createdat'],
    terms_accepted: ['termsofconditions', 'terms', 'terminos', 'condiciones'],
    billing_state: ['stateprovince', 'state', 'province', 'estado', 'provincia'],
    gender: ['genero', 'sexo'],
    birth_date: ['dateofbirth', 'fechanacimiento', 'datanascimento'],
    has_car: ['havecar', 'coche', 'carro'],
    preferred_payment: ['preferredpayment', 'pago', 'pagamento'],
    professional_status: ['professionalstatus', 'situacionprofesional'],
    address: ['billingaddress', 'direccion', 'endereco', 'morada'],
    postal_code: ['postalcode', 'codigopostal', 'zip', 'cep'],
    talent_tag_column: ['55handler', 'handler', 'handler55', 'etiqueta', 'etiquetas', 'tags', 'tag'],
    internal_notes: ['description', 'descripcion', 'descricao', 'notes', 'notas', 'notasinternas', 'internalnotes'],
    other_language: [
      'otherlanguage', 'otherlanguages',
      'otroidioma', 'otrosidiomas',
      'outroidioma', 'outrosidiomas', 'outralingua', 'outraslinguas',
      'autrelangue', 'autreslangues',
      'altreidioma', 'altresidiomes',
      'languages', 'idiomas', 'linguas', 'langues', 'idiomes',
    ],
    // ── Orders / Pedidos ─────────────────────────────
    contact_name: ['clientname', 'nombrecliente', 'nomecliente', 'clientename'],
    contact_email: ['clientemail', 'emailcliente'],
    service_name: ['servicename', 'servicio', 'servico'],
    talent_name: ['specialist', 'especialista', 'talent', 'talento'],
    schedule_type: ['recurring', 'recorrente', 'recurrente'],
    price_subtotal: ['totalpricewdiscount', 'totalpricewithdiscount', 'subtotal'],
    price_total: ['billedprice', 'precofacturado', 'totalcobrado'],
    talent_amount: ['specialistamount', 'montoespecialista', 'importeespecialista'],
    staff_member_name: ['55member', 'staffmember', 'miembro55', 'membre55'],
    appointment_date: ['appointmentdate', 'fechacita', 'fechaservicio', 'servicedate'],
    service_state: ['stateprovince', 'comunidad', 'region'],
    unit_price: ['unitprice', 'preciounitario', 'precounitario'],
    specialist_unit_price: ['specialistunitprice', 'specialistup', 'preciounitarioespecialista'],
    quantity: ['cantidad', 'quantidade', 'qty'],
    discount: ['descuento', 'desconto'],
    payment_status: ['clientpayed', 'clientpaid', 'pagocliente', 'pagado'],
    rating: ['valoracion', 'avaliacao', 'puntuacion'],
    stripe_id: ['stripeid', 'stripepaymentid', 'idpago'],
  };

  for (const [key, synonyms] of Object.entries(aliases)) {
    const allTerms = [normalize(key), ...synonyms];
    if (allTerms.includes(a) && allTerms.includes(b)) return 0.6;
  }

  return 0;
}

/**
 * Auto-match CSV columns to DB columns by name similarity.
 * Each CSV column gets the best-scoring DB column (or null if no match > threshold).
 */
export function autoMatchColumns(
  csvHeaders: string[],
  dbColumns: DbColumn[]
): ColumnMapping[] {
  const usedDbColumns = new Set<string>();
  const threshold = 0.5;

  return csvHeaders.map((csvCol) => {
    let bestMatch: string | null = null;
    let bestScore = 0;

    for (const dbCol of dbColumns) {
      if (usedDbColumns.has(dbCol.name)) continue;

      const score = matchScore(csvCol, dbCol.name);
      if (score > bestScore && score >= threshold) {
        bestScore = score;
        bestMatch = dbCol.name;
      }
    }

    if (bestMatch) usedDbColumns.add(bestMatch);

    // DEBUG: log every auto-match result
    console.log(`[column-matcher] CSV "${csvCol}" → DB "${bestMatch}" (score ${bestScore.toFixed(2)})`);

    return {
      csvColumn: csvCol,
      dbColumn: bestMatch,
    };
  });
}
