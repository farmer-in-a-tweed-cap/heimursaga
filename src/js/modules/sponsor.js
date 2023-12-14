import DOMPurify from "dompurify";
import axios from "axios";
export default class Sponsor {
  constructor() {
    this.sponsorButton = document.querySelector("#modal-button");
    this.sponsorModal = new bootstrap.Modal(
      document.querySelector("#sponsor-modal")
    );
    this._csrf = document.querySelector('[name="_csrf"]').value
    this.sponsorModalHeader = document.querySelector("#modal-header");
    this.sponsorModalBody = document.querySelector("#modal-body");
    this.sponsorModalFooter = document.querySelector("#modal-footer");
    this.username = document.querySelector("#profile-username").innerText;

    this.publishableKey = document.querySelector("#stripePubKey").value;
    this.stripeAccountId = document.querySelector("#stripeAccountId").value;
    this.monthlyProductId = document.querySelector("#monthlyProductId").value;
    this.yearlyProductId = document.querySelector("#yearlyProductId").value;
    this.explorer = document.querySelector("#profile-username").innerText;
    this.waitTimer;
    this.cardElement;
    this.sponserUser = this.sponserUser.bind(this); // Using .bind()
    this.events();
  }

  events() {
    this.sponsorButton.addEventListener("click", (e) => {
      e.preventDefault();
      this.buttonClickHandler();
    });
  }

  buttonClickHandler() {
    this.sponsorModal.show();
    this.initialHTML();
  }

  initialHTML() {
    this.sponsorModalHeader.innerHTML = `<h3 class="text-primary text-center w-100">SPONSORSHIP OPTIONS</h3>`;
    this.sponsorModalBody.innerHTML = `<div class="row mb-3">
        <div class="col">
            <div class="text-center">
                <h4>Single Payment</h4>
            </div>
            <small>any amount</small>
            <div class="">
                <ul class="text-small list-unstyled mt-3 mx-3">
                    <li class="mb-2">
                        <s>Access to sponsor-only entries</s>
                    </li>
                    <li class="mb-2">
                        <s>Latest entries in your email inbox</s>
                    </li>
                    <li class="mb-2">
                        Contribute to ongoing exploration and discovery!
                    </li>
                </ul>
            </div>
            <div class="text-center">
                <button class="btn btn-primary" id="singlepayment-select-btn">Select</button>
            </div>
        </div>
        <div class="col">
            <div class="text-center">
                <h4>Subscription</h4>
            </div>
            <small>$7 monthly / $60 yearly</small>
            <div class="">
                <ul class="list-unstyled mt-3 mx-3">
                    <li class="mb-2">
                        Access to sponsor-only entries
                    </li>
                    <li class="mb-2">
                        Latest entries in your email inbox
                    </li>
                    <li class="mb-2">
                        Contribute to ongoing exploration and discovery!
                    </li>
                </ul>
            </div>
            <div class="text-center">
                <button class="btn btn-primary" id="subscription-select-btn">Select</button>
            </div>																	
        </div>
    </div>`;
    document
      .querySelector("#singlepayment-select-btn")
      .addEventListener("click", () => this.singlePaymentHTML());
    document
      .querySelector("#subscription-select-btn")
      .addEventListener("click", () => this.fetchSubscriptionDetails());
  }

  fetchSubscriptionDetails = async () => {
    const { data } = await axios.get(
      `/sponsor/${this.explorer}/${this.stripeAccountId}`
    );
    if (data?.plan) {
      this.alreadyHaveSubscription(data.plan);
    } else {
      this.subscribeHTML();
    }
  };

  createNotification(username, type, amount) {
    axios.post(`/newSponsorNotification/${username}/${type}/${amount}`, {_csrf: this._csrf}).then(() => {
      console.log('notification added')
  })
  }

  singlePaymentHTML() {
    this.sponsorModalHeader.innerHTML = DOMPurify.sanitize(
      `<h3 class="text-primary text-center w-100">Single Payment Sponsorship</h3>`
    );
    this.sponsorModalBody.innerHTML = DOMPurify.sanitize(`<div class="mb-4">
        <ul class="text-small list-unstyled mx-3">
            <li class="mb-2">
                <s>Access to sponsor-only entries</s>
            </li>
            <li class="mb-2">
                <s>Latest entries in your email inbox</s>
            </li>
            <li class="mb-2">
                Contribute to ongoing exploration and discovery!
            </li>
        </ul>
    </div>

    <hr>

    <div class="">
        <div class="my-3 mx-5">
            <label class="form-label">Enter Amount</label>
            <label class="form-text text-muted">- minimum $5</label>
            <div class="input-group">
                <input id="amount" type="number" class="form-control"
                aria-label="Dollar amount (with dot and two decimal places)" required>
                <span class="input-group-text">$</span>
            </div>
            <div class="error text-danger"></div>
        </div>

        <div class="mb-3 mx-5">
          <form id="payment-form">
            <div id="card-element" class="p-2 border rounded mb-3">
              <!-- elements from stripe will be inserted here. -->
            </div>
          </form>
            <button class="btn btn-secondary" id="back-btn">Back</button>
            <button class="btn btn-primary" id="one-time-payment">Submit</button>
        </div>
    </div>`);
    this.mountStripeElements();
    document
      .querySelector("#back-btn")
      .addEventListener("click", () => this.initialHTML());
    document
      .querySelector("#one-time-payment")
      .addEventListener("click", () => this.giveOneTimeFund());
  }

  alreadyHaveSubscription = (plan) => {
    this.sponsorModalHeader.innerHTML = DOMPurify.sanitize(
      `<h3 class="text-primary text-center w-100">Subscription Detail</h3>`
    );
    this.sponsorModalBody.innerHTML = DOMPurify.sanitize(`
    <div class="mb-4">
        <ul class="text-small list-unstyled mx-3">
            <li class="mb-2">
                Access to sponsor-only entries
            </li>
            <li class="mb-2">
                Latest entries in your email inbox
            </li>
            <li class="mb-2">
                Contribute to ongoing exploration and discovery!
            </li>
        </ul>
    </div>

    <hr>

    <div class="my-3 mx-5">
      <div>You are already sponsoring this explorer with a
        <span style="color: green; font-weight: bold;"> ${plan} </span>
          subscription. 
      </div>
        <button class="btn btn-secondary mt-3" id="back-btn">Back</button>
    </div>`);
    document
      .querySelector("#back-btn")
      .addEventListener("click", () => this.initialHTML());
  };

  subscribeHTML() {
    this.sponsorModalHeader.innerHTML = DOMPurify.sanitize(
      `<h3 class="text-primary text-center w-100">Subscription Sponsorship</h3>`
    );
    this.sponsorModalBody.innerHTML = DOMPurify.sanitize(`<div class="mb-4">
        <ul class="text-small list-unstyled mx-3">
            <li class="mb-2">
                Access to sponsor-only entries
            </li>
            <li class="mb-2">
                Latest entries in your email inbox
            </li>
            <li class="mb-2">
                Contribute to ongoing exploration and discovery!
            </li>
        </ul>
    </div>

    <hr>

    <div class="my-3">
        <input type="radio" class="btn-check" name="options-outlined" id="monthly-outlined" autocomplete="off" checked>
        <label class="btn btn-outline-primary" for="monthly-outlined">$7/Monthly</label>
        
        <input type="radio" class="btn-check" name="options-outlined" id="yearly-outlined" autocomplete="off">
        <label class="btn btn-outline-primary" for="yearly-outlined">$60/Yearly</label>
    </div>

    <div class="my-3 mx-5">
      <form id="payment-form">
        <div id="card-element" class="p-2 border rounded mb-3">
          <!-- elements from stripe will be inserted here. -->
        </div>
      </form>
  
        <button class="btn btn-secondary" id="back-btn">Back</button>
        <button class="btn btn-primary" id="sponser-explorer">
          <span id="loading-spinner" class="spinner-border spinner-border-sm" role="status" style="display: none;"></span>
          Submit
        </button>

    </div>`);

    this.mountStripeElements();
    document
      .querySelector("#back-btn")
      .addEventListener("click", () => this.initialHTML());
    document
      .querySelector("#sponser-explorer")
      .addEventListener("click", () => this.sponserUser());
  }

  mountStripeElements = () => {
    const publishableKey = this.publishableKey;
    this.stripe = Stripe(publishableKey);
    var elements = this.stripe.elements();

    this.cardElement = elements.create("card");
    this.cardElement.mount("#card-element");
  };

  sponserUser = async () => {
    const { token, error } = await this.stripe.createToken(this.cardElement);
    this.cardToken = token.id;

    // selected subscription
    let monthlySubsActive = true;
    let optionSelected = true;
    var monthlyRadio = document.getElementById("monthly-outlined");
    var yearlyRadio = document.getElementById("yearly-outlined");

    const modal = document.getElementById("sponsor-modal");
    var modalBackdrop = document.querySelector(".modal-backdrop");

    const button = document.getElementById("sponser-explorer");
    const spinner = document.getElementById("loading-spinner");

    button.disabled = true;
    spinner.style.display = "inline-block";
    button.innerHTML =
    '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Submitting...';


    if (monthlyRadio.checked) monthlySubsActive = true;
    else if (yearlyRadio.checked) monthlySubsActive = false;
    else optionSelected = false;

    const stripeAccountId = this.stripeAccountId;
    const explorer = this.explorer;


    if (!optionSelected) return;
    if (monthlySubsActive) {
      fetch(
        `/sponser/${explorer}/${stripeAccountId}/${this.monthlyProductId}/${this.cardToken}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      )
        .then(async (result) => {
          const response = await result.json();
          button.disabled = false;
          spinner.style.display = "none";
          button.textContent = "Submit";
          if (response.success) {
            this.createNotification(this.username, 'subscription', "monthly")
            this.sponsorModal.hide()
            parent.window.notyf.success(`Sponsor subscription to ${this.username} successful!`);
          }
          return response;
        })
        .catch((err) => {
          parent.window.notyf.error({background: '#ac4946', message: `Subscription payment unsuccessful.`});
          button.disabled = false;
          spinner.style.display = "none";
          button.textContent = "Submit";
          console.log("error:", err);
        });
    } else {
      fetch(
        `/sponser/${explorer}/${stripeAccountId}/${this.yearlyProductId}/${this.cardToken}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      )
        .then(async (result) => {
          button.disabled = false;
          spinner.style.display = "none";
          button.textContent = "Submit";
          const response = await result.json();
          if (response.success) {
            this.createNotification(this.username, 'subscription', "yearly")
            this.sponsorModal.hide()
            parent.window.notyf.success(`Sponsor subscription to ${this.username} successful!`);
          }

          return response;
        })
        .catch((err) => {
          parent.window.notyf.error({background: '#ac4946', message: `Subscription payment unsuccessful.`});
          button.disabled = false;
          spinner.style.display = "none";
          button.textContent = "Submit";
          console.log("error:", err);
        });
    }
  };

  giveOneTimeFund = async () => {
    const amountField = document.getElementById("amount");
    const cardField = document.getElementById("card-element");

    const fundSubmitBtn = document.getElementById("one-time-payment");
    const { token, error } = await this.stripe.createToken(this.cardElement);
    if (error) {
      cardField.style.border = "1px solid red";
      return;
    }
    this.cardToken = token.id;

    if (fundSubmitBtn && amountField) {
      amountField.style.border = "1px solid gray";
      let amount = parseFloat(amountField.value);

      if (amount) {
        if (amount.length) {
          amountField.style.border = "1px solid red";
        } else if (amount > 2000) {
          amountField.style.border = "1px solid red";
          const error = document.querySelector(".error");
          error.innerHTML = "Amount must be less than 2001";
  
        }  else if (amount < 5) {
        amountField.style.border = "1px solid red";
        const error = document.querySelector(".error");
        error.innerHTML = "Amount must be greater than 5";
        
        } else {
          fundSubmitBtn.classList.add("disabled");
          fundSubmitBtn.innerHTML =
            '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Submitting...';
          fetch(
            `/funding/${this.stripeAccountId}/${amount}/${this.cardToken}`,
            {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
              },
            }
          )
            .then(async (result) => {
              const response = await result.json();
              fundSubmitBtn.classList.remove("disabled");
              fundSubmitBtn.innerHTML = "Submit";
              amountField.value = "";
              if (response.status == "succeeded") {
                this.createNotification(this.username, 'one-time-payment', amount)
                this.sponsorModal.hide()
                parent.window.notyf.success(`Sponsor payment to ${this.username} successful!`);
              } else {
                parent.window.notyf.error({background: '#ac4946', message: `Payment unsuccessful`});
              }
              return response;
            })
            .catch((err) => {
              parent.window.notyf.error({background: '#ac4946', message: `Payment unsuccessful: ${err.error.raw.message}}`});
              const error = document.getElementById("error");
              error.innerHTML = err.error.raw.message;
              fundSubmitBtn.classList.remove("disabled");
              fundSubmitBtn.innerHTML = "Submit";
            });
        }
      } else {
        amountField.style.border = "1px solid red";
        const error = document.getElementById("error");
        error.innerHTML = "this field is required";
      }
    }
  };
}
