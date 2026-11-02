/**
 * Lambda: lmb-(env)-io-sale-cust-cpgn-ex-qry_findby-01
 * Implements CustomerCampaignExecutionContract
 */
exports.handler = async (event) => {
  const payload = typeof event === 'string' ? JSON.parse(event) : (event.body ? (typeof event.body === 'string' ? JSON.parse(event.body) : event.body) : event);
  const { customerId, channel = "AGENTIC_CHAT" } = payload;

  if (!customerId) {
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        statusCode: 400,
        error: { code: "INVALID_REQUEST", message: "customerId is required" }
      })
    };
  }

  // Active customer marketing campaigns
  const campaigns = [
    {
      campaignId: "CPG-CASHBACK-BOOST-2026",
      name: "Cashback 5% en Supermercados y Restaurantes",
      discountRate: 5.0,
      targetSegment: "AFFLUENT_RETAIL",
      status: "ACTIVE"
    },
    {
      campaignId: "CPG-P2P-ZERO-FEE",
      name: "Transferencias Inmediatas Sin Comisión",
      discountRate: 100.0,
      targetSegment: "ALL_CUSTOMERS",
      status: "ACTIVE"
    }
  ];

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      statusCode: 200,
      data: {
        customerId,
        channel,
        campaignsCount: campaigns.length,
        eligibleCampaigns: campaigns
      }
    })
  };
};

