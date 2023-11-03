const { ObjectId } = require("mongodb");

const connectAccCustomersCollection = require("../db").db().collection("connectAccountCustomers");

// Define the ConnectAccountCustomer constructor
function ConnectAccountCustomer(customerId, cusExpId, stripeAccountId) {
  this.customerId = customerId;
  this.cusExpId = cusExpId;
  this.stripeAccountId = stripeAccountId;
}

// Create a new ConnectAccountCustomer document
ConnectAccountCustomer.prototype.createNew = async function () {
  try {
    console.log(this.customerId, this.cusExpId, this.stripeAccountId);
    const result = await connectAccCustomersCollection.insertOne({
      customerId: this.customerId,
      cusExpId: this.cusExpId,
      stripeAccountId: this.stripeAccountId,
    });
    return result;
  } catch (error) {
    console.log(error);
  }
};

// Add a function to find a document by customerId
ConnectAccountCustomer.find = async function (where) {
  try {
    const customer = await connectAccCustomersCollection.findOne(where);
    return customer;
  } catch (error) {
    console.log(error);
    return null;
  }
};

ConnectAccountCustomer.findByExpIdAndAccId = async (expId, stripeAccountId) => {
  try {
    const customer = await connectAccCustomersCollection.findOne({
      cusExpId: expId,
      stripeAccountId,
    });
    return customer;
  } catch (err) {
    console.log(err);
    return null;
  }
};

module.exports = ConnectAccountCustomer;
