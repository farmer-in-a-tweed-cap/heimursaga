const User = require("../models/User");
const Entry = require("../models/Entry");
const Follow = require("../models/Follow");
const Flag = require("../models/Flag");
const connectAccCustomersCollection = require("../db").db().collection("connectAccountCustomers");
const sponsorsCollection = require("../db").db().collection("sponsors");
const followsCollection = require("../db").db().collection("follows");
const usersCollection = require("../db").db().collection("users");
const draftsCollection = require("../db").db().collection("drafts");
const likesCollection = require("../db").db().collection("likes");
const flagsCollection = require("../db").db().collection("flags");
const sessionsCollection = require("../db").db().collection("sessions");
const GeoJSON = require("geojson");
const Draft = require("../models/Draft");
const Highlight = require("../models/Highlight");
const sendgrid = require("@sendgrid/mail");
const { TouchPitchHandler } = require("mapbox-gl");
sendgrid.setApiKey(process.env.SENDGRIDAPIKEY);
const sanitizeHTML = require("sanitize-html");
const validator = require("validator");
const { render } = require("ejs");
const { ObjectId } = require("mongodb");
const Billing = require("../models/Billing");
const ObjectID = require("mongodb").ObjectID;


exports.getSubscritionDetails = async function (req, res) {
  try {
    const { stripeAccountId } = req.params;

    let { username, billingId } = req.session.user;
    let userDetail = await usersCollection.findOne({ username });
    //console.log(userDetail);
    //console.log(req.session.user);
    //console.log(req.params);
    if (billingId) {
      let customerDetails = await connectAccCustomersCollection.findOne({
        cusExpId: userDetail._id,
        stripeAccountId,
      });
      let plan = null;

      if (customerDetails) {
        //console.log(customerDetails);
        let sponsorDetails = await sponsorsCollection.findOne({
          custConnectAccId: customerDetails._id,
        });
        //console.log(sponsorDetails);
        const stripeAccountHolderDetails = await usersCollection.findOne({
          stripeAccountId,
        });
        //console.log(stripeAccountHolderDetails);
        if (sponsorDetails?.plan) {
          plan = "yearly";
          if (
            sponsorDetails.plan ===
            stripeAccountHolderDetails.products.monthlyProductId
          ) {
            plan = "monthly";
          }
        }
      }
      res.send({
        plan,
      });
    } else {
      res.send({ message: "billingId not found" });
    }
  } catch (err) {
    console.log(err);
    res.send(err);
  }
};
