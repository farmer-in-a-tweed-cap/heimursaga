const connectAccCustomersCollection = require("../db")
  .db()
  .collection("connectAccountCustomers");

// Define the ConnectAccountCustomer constructor
function ConnectAccountCustomer(customerId, cusExpId, stripeAccountId) {
  this.customerId = customerId;
  this.cusExpId = cusExpId;
  this.stripeAccountId = stripeAccountId;
}

// Create a new ConnectAccountCustomer document
ConnectAccountCustomer.createNew = async function () {
  try {
    const result = await connectAccCustomersCollection.insertOne({
      customerId: this.customerId,
      cusExpId: this.cusExpId,
      stripeAccountId: this.stripeAccountId,
    });

    console.log(result, "res");
  } catch (error) {
    console.log(error);
  }
};

// Add a function to find a document by customerId
ConnectAccountCustomer.findByCustomerId = async function (customerId) {
  try {
    const customer = await connectAccCustomersCollection.findOne({
      customerId,
    });
    return customer;
  } catch (error) {
    console.log(error);
    return null;
  }
};

module.exports = ConnectAccountCustomer;
