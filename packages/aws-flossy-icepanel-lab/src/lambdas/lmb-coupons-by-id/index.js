/**
 * Lambda: lmb-matrix-findby-id-coupons-qry-svc-01
 * Implements CouponDetailsContract
 */
exports.handler = async (event) => {
  const startTime = Date.now();
  const payload = typeof event === 'string' ? JSON.parse(event) : (event.body ? (typeof event.body === 'string' ? JSON.parse(event.body) : event.body) : event);
  
  const couponId = payload.couponId;
  if (!couponId || !/^CPN-[A-Z0-9-]{4,16}$/.test(couponId)) {
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        statusCode: 400,
        error: {
          code: "INVALID_CONTRACT_PAYLOAD",
          message: "Field 'couponId' is required and must follow regex ^CPN-[A-Z0-9-]{4,16}$"
        }
      })
    };
  }

  // Domain catalog mock response adhering strictly to schema
  const mockDatabase = {
    "CPN-WELCOME-2026": {
      couponId: "CPN-WELCOME-2026",
      title: "Bienvenida Nueva Cuenta Corriente",
      description: "20% de descuento en comercios asociados por apertura digital",
      discountPercentage: 20,
      category: "ONBOARDING_RETAIL",
      status: "ACTIVE",
      expirationDate: "2026-12-31T23:59:59Z",
      merchant: "Mastercard Banking Network"
    },
    "CPN-LOYALTY-50": {
      couponId: "CPN-LOYALTY-50",
      title: "Cupón VIP Fidelidad",
      description: "50% de descuento en comisiones de transferencias internacionales",
      discountPercentage: 50,
      category: "PREMIUM_SERVICES",
      status: "ACTIVE",
      expirationDate: "2026-06-30T23:59:59Z",
      merchant: "Livo Global Payments"
    }
  };

  const item = mockDatabase[couponId] || {
    couponId: couponId,
    title: `Cupón Especial ${couponId}`,
    description: "Descuento promocional generado por el motor de campañas",
    discountPercentage: 15,
    category: "GENERAL_PROMO",
    status: "ACTIVE",
    expirationDate: "2026-11-30T23:59:59Z",
    merchant: "Aliados Comerciales Red BIAN"
  };

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      statusCode: 200,
      data: item,
      metadata: {
        executionTimeMs: Date.now() - startTime,
        version: "1.0.0"
      }
    })
  };
};

