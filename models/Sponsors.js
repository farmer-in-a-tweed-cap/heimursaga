const { ObjectId } = require("mongodb");
const ConnectAccountCustomer = require("./ConnectAccountCustomers");
const SponserCollection = require("../db").db().collection("sponsors");
const usersCollection = require("../db").db().collection("users");

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

Sponsor.findAllSponsoredByUserId = async (expId) => {
  try {
    const resp = await usersCollection
      .aggregate([
        {
          $lookup: {
            from: "connectAccountCustomers",
            localField: "_id",
            foreignField: "cusExpId",
            as: "customer",
          },
        },
        {
          $unwind: "$customer", // Unwind the array created by the lookup
        },
        {
          $lookup: {
            from: "sponsors",
            localField: "customer._id",
            foreignField: "custConnectAccId",
            as: "sponsered",
          },
        },
        {
          $unwind: "$sponsered", // Unwind the array created by the lookup
        },
        {
          $match: {
            $expr: {
              $eq: ["$customer._id", ObjectId(expId)] // Match customer._id to expId
            }
          },
        },
        {
          $project: {
            sponsered: 1,
            sponsorsUsername: "$username",
            _id: 1,
          },
        },
      ])
      .toArray();
    return resp;
  } catch (err) {
    console.log(err);
    return err;
  }
};

Sponsor.findAllSponsorsByAccId = async (stripeAccountId) => {
  try {
    const response = await usersCollection
      .aggregate([
        {
          $lookup: {
            from: "connectAccountCustomers",
            localField: "stripeAccountId",
            foreignField: "stripeAccountId",
            as: "customer",
          },
        },
        {
          $unwind: "$customer", // Unwind the array created by the lookup
        },
        {
          $lookup: {
            from: "sponsors",
            localField: "customer._id",
            foreignField: "custConnectAccId",
            as: "sponsor",
          },
        },
        {
          $unwind: "$sponsor",
        },
        {
          $match: {
            stripeAccountId, // Only include records where stripeAccountId is = given stripeaccId
          },
        },
        {
          $project: {
            sponsoredUsername: "$username",
            sponsor: 1,
            stripeAccountId: 1,
          },
        },
      ])
      .toArray();

    return response;
  } catch (err) {
    console.log(err);
    return err;
  }
};

module.exports = Sponsor;
