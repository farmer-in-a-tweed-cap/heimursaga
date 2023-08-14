let Funds = function (
  stripeCustomerId,
  stripeAccountId,
  amount,
  plateformFeePercent,
  paymentIntentId
) {
  this.stripeCustomerId = stripeCustomerId;
  this.stripeAccountId = stripeAccountId;
  this.amount = amount;
  this.plateformFeePercent = plateformFeePercent;
  this.paymentIntentId = paymentIntentId;
  this.errors = [];
};

module.exports = Funds;
