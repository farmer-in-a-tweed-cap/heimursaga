const SponserCollection = require("../db").db().collection("sponsors");
let Sponsor = function (custConnectAccId, plan, hasTrial, endDate) {
  this.custConnectAccId = custConnectAccId;
  this.plan = plan;
  this.hasTrial = hasTrial;
  this.endDate = endDate;
};

Sponsor.create = async (custConnectAccId, plan, hasTrial, endDate) => {
  try {
    const response = await SponserCollection.insertOne({
      custConnectAccId,
      plan,
      hasTrial,
      endDate,
    });
    return response;
  } catch (err) {
    console.log(err);
  }
};

module.exports = Sponsor;
