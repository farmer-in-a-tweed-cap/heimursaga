
let Billing = function (explorerId, plan, hasTrial, endDate, billingId) {
  this.explorerId = explorerId;
  this.plan = plan;
  this.hasTrial = hasTrial;
  this.endDate = endDate;
  this.billingId = billingId;
  this.errors = [];
};


module.exports = Billing



