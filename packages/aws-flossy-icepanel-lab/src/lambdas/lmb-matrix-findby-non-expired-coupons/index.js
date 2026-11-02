/**
 * Lambda: lmb-matrix-findby-non-expired-coupons-qry-svc-01
 * Implements NonExpiredCouponsContract with cursor pagination to prevent LLM Context Bloat
 */
exports.handler = async (event) => {
  const payload = typeof event === 'string' ? JSON.parse(event) : (event.body ? (typeof event.body === 'string' ? JSON.parse(event.body) : event.body) : event);
  const { customerId, category = "ALL", limit = 3, cursorToken } = payload;

  if (!customerId) {
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        statusCode: 400,
        error: { code: "MISSING_CUSTOMER_ID", message: "customerId is required" }
      })
    };
  }

  // Large simulated enterprise catalog (would bloat context window if unpaginated)
  const fullCatalog = [
    { couponId: "CPN-RET-01", title: "15% off en Zara & Massimo Dutti", discountPercentage: 15, category: "RETAIL", expirationDate: "2026-12-31T23:59:59Z", merchant: "Inditex Group" },
    { couponId: "CPN-DIN-02", title: "2x1 en Cenas Gourmet Astrid & Gastón", discountPercentage: 50, category: "DINING", expirationDate: "2026-11-30T23:59:59Z", merchant: "Acurio Restaurantes" },
    { couponId: "CPN-TRV-03", title: "USD 100 de bono en Vuelos LATAM", discountPercentage: 25, category: "TRAVEL", expirationDate: "2026-12-15T23:59:59Z", merchant: "LATAM Airlines" },
    { couponId: "CPN-RET-04", title: "20% en Apple Store Autorizado", discountPercentage: 20, category: "RETAIL", expirationDate: "2026-12-24T23:59:59Z", merchant: "iShop Retail" },
    { couponId: "CPN-ENT-05", title: "Entradas Cineplanet VIP 2x1", discountPercentage: 50, category: "ENTERTAINMENT", expirationDate: "2026-11-20T23:59:59Z", merchant: "Cineplanet" },
    { couponId: "CPN-TRV-06", title: "30% de descuento en Hoteles Marriott", discountPercentage: 30, category: "TRAVEL", expirationDate: "2027-01-31T23:59:59Z", merchant: "Marriott Bonvoy" },
    { couponId: "CPN-DIN-07", title: "Café Starbucks de cortesía con consumo", discountPercentage: 100, category: "DINING", expirationDate: "2026-11-15T23:59:59Z", merchant: "Starbucks Coffee" },
    { couponId: "CPN-RET-08", title: "10% adicional en Falabella.com", discountPercentage: 10, category: "RETAIL", expirationDate: "2026-12-31T23:59:59Z", merchant: "Saga Falabella" }
  ];

  // 1. Filter by category
  let filtered = category === "ALL" 
    ? fullCatalog 
    : fullCatalog.filter(c => c.category === category);

  // 2. Resolve offset from cursorToken
  let startIndex = 0;
  if (cursorToken) {
    try {
      const decoded = JSON.parse(Buffer.from(cursorToken, "base64").toString("utf8"));
      startIndex = Number(decoded.offset || 0);
    } catch (e) {
      startIndex = 0;
    }
  }

  const effectiveLimit = Math.min(Math.max(1, limit), 20);
  const sliced = filtered.slice(startIndex, startIndex + effectiveLimit);
  const nextOffset = startIndex + effectiveLimit;
  const hasMore = nextOffset < filtered.length;

  const nextCursorToken = hasMore 
    ? Buffer.from(JSON.stringify({ offset: nextOffset, category, timestamp: Date.now() })).toString("base64")
    : null;

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      statusCode: 200,
      data: sliced,
      pageInfo: {
        totalMatched: filtered.length,
        returnedCount: sliced.length,
        limit: effectiveLimit,
        hasMore,
        nextCursorToken
      }
    })
  };
};
