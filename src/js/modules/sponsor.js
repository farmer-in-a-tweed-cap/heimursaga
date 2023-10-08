import DOMPurify from "dompurify";

export default class Sponsor {
  constructor() {
    this.sponsorButton = document.querySelector("#modal-button");
    this.sponsorModal = new bootstrap.Modal(
      document.querySelector("#sponsor-modal")
    );
    this.sponsorModalHeader = document.querySelector("#modal-header");
    this.sponsorModalBody = document.querySelector("#modal-body");
    this.sponsorModalFooter = document.querySelector("#modal-footer");
    this.username = document.querySelector("#profile-username").innerText;
    //
    this.publishableKey = document.querySelector("#stripePubKey").value;
    this.stripeAccountId = document.querySelector("#stripeAccountId").value;
    this.monthlyProductId = document.querySelector("#monthlyProductId").value;
    this.yearlyProductId = document.querySelector("#yearlyProductId").value;
    console.log(this.monthlyProductId, this.yearlyProductId);
    this.explorer = "nelliebly";
    this.waitTimer;
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

  sendRequest() {}

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
      .addEventListener("click", () => this.subscribeHTML());
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
        </div>

        <div class="mb-3 mx-5">
            <input class="form-control mb-3" placeholder="credit card field here"></input>
            <button class="btn btn-secondary" id="back-btn">Back</button>
            <button class="btn btn-primary" id="one-time-payment">Submit</button>
        </div>
    </div>`);

    document
      .querySelector("#back-btn")
      .addEventListener("click", () => this.initialHTML());
    document
      .querySelector("#one-time-payment")
      .addEventListener("click", () => this.giveOneTimeFund());
  }

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
        <input type="radio" class="btn-check" name="options-outlined" id="monthly-outlined" autocomplete="off">
        <label class="btn btn-outline-primary" for="monthly-outlined">$7/Monthly</label>
        
        <input type="radio" class="btn-check" name="options-outlined" id="yearly-outlined" autocomplete="off">
        <label class="btn btn-outline-primary" for="yearly-outlined">$60/Yearly</label>
    </div>

    <div class="my-3 mx-5">
        <input class="form-control mb-3" placeholder="credit card field here"></input>
        <button class="btn btn-secondary" id="back-btn">Back</button>
        <button class="btn btn-primary" id="sponser-explorer">Submi12t</button>
    </div>`);
    document
      .querySelector("#back-btn")
      .addEventListener("click", () => this.initialHTML());
    document
      .querySelector("#sponser-explorer")
      .addEventListener("click", () => this.sponserUser());
  }

  sponserUser = () => {
    const publishableKey = this.publishableKey;
    const stripe = Stripe(publishableKey);
    const sponserBtn = document.getElementById("sponser");

    // selected subscription
    let monthlySubsActive = true;
    let optionSelected = true;
    var monthlyRadio = document.getElementById("monthly-outlined");
    var yearlyRadio = document.getElementById("yearly-outlined");

    if (monthlyRadio.checked) monthlySubsActive = true;
    else if (yearlyRadio.checked) monthlySubsActive = false;
    else optionSelected = false;

    const fundBtn = document.getElementById("fund-button");
    const stripeAccountId = this.stripeAccountId;
    const explorer = this.explorer;

    console.log(this.monthlyProductId, "sss");
    const amountField = document.getElementById("amount");

    if (!optionSelected) return;
    if (monthlySubsActive) {
      fetch(
        `/sponser/${explorer}/${stripeAccountId}/${this.monthlyProductId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      )
        .then(async (result) => {
          const response = await result.json();
          console.log(response);
          return response;
        })
        .then((response) => {
          if (response?.url) window.location = response.url;
        });
    } else {
      fetch(`/sponser/${explorer}/${stripeAccountId}/${this.yearlyProductId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })
        .then(async (result) => {
          const response = await result.json();
          console.log(response);
          return response;
        })
        .then((response) => {
          if (response?.url) window.location = response.url;
        });
    }
  };
  giveOneTimeFund = () => {
    // if (fundBtn && amountField) {
    // 	fundBtn.addEventListener('click', () => {
    // 		let amount = parseInt(amountField.value);
    // 		if (amount){
    // 			if(amount > 2000) {
    // 				console.error('amount should be less than 2001')
    // 				const error = document.getElementById('error');
    // 				error.innerHTML = 'amount should be less than 2001';
    // 			}
    // 			else{
    // 				fundBtn.classList.add("disabled");
    // 				fundBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Loading...';
    // 				fetch(`/funding/${explorer}/${stripeAccountId}/${amount}`, {
    // 					method: 'GET',
    // 					headers: {
    // 						'Content-Type': 'application/json'
    // 					},
    // 				})
    // 					.then(async (result) => {
    // 						const response = await result.json();
    // 						return response
    // 					})
    // 					.then((response) => {
    // 						if (response?.url)
    // 							window.location = response.url
    // 					}).catch(()=>{
    // 						fundBtn.classList.remove("disabled");
    // 						fundBtn.innerHTML = "Give Fund";
    // 					})
    // 			}
    // 			}else {
    // 			const error = document.getElementById('error');
    // 			error.innerHTML = 'this field is required';
    // 		}
    // 	})
    // }
  };
}
