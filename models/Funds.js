const { ObjectId } = require("mongodb");

const fundsCollection = require("../db").db().collection("funds");

let Funds = function (
  customerExpId,
  stripeAccountId,
  amount,
  status,
  createdAt,
  plateformFeePercent
) {
  this.customerExpId = customerExpId;
  this.stripeAccountId = stripeAccountId;
  this.amount = amount;
  this.plateformFeePercent = plateformFeePercent;
  this.status = status;
  this.createdAt = createdAt;
  this.errors = [];
};

Funds.create = async (data, expId) => {
  try {
    const { amount, destination, status } = data;
    console.log(data, expId);
    const resp = await fundsCollection.insertOne({
      stripeAccountId: destination,
      customerExpId: ObjectId(expId),
      amount: parseFloat(amount / 100),
      status,
      plateformFeePercent: process.env.PLATEFORM_FEE,
      createdAt: new Date().toISOString(),
    });
    return resp;
  } catch (err) {
    console.log(err);
    return err;
  }
};

module.exports = Funds;
