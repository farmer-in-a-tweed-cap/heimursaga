import axios from 'axios'
import DOMPurify from 'dompurify'


export default class Sponsor {
    constructor() {
        this.sponsorButton = document.querySelector("#modal-button")
        this.sponsorModal = new bootstrap.Modal(document.querySelector("#sponsor-modal"))
        this.sponsorModalHeader = document.querySelector("#modal-header")
        this.sponsorModalBody = document.querySelector("#modal-body")
        this.sponsorModalFooter = document.querySelector("#modal-footer")
        this.waitTimer
        this.events()
    }

    events() {
        this.sponsorButton.addEventListener("click", (e) => {
            e.preventDefault()
            this.buttonClickHandler()
        })
    }

    buttonClickHandler() {
        this.sponsorModal.show()
        this.initialHTML()
    }

    sendRequest() {

    }

    initialHTML() {
        this.sponsorModalHeader.innerHTML = `<h3 class="text-primary text-center w-100">Sponsorship Options</h3>`
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
    </div>`

    document.querySelector("#singlepayment-select-btn").addEventListener("click", () => this.singlePaymentHTML())
    document.querySelector("#subscription-select-btn").addEventListener("click", () => this.subscribeHTML())

    }

    singlePaymentHTML() {
        this.sponsorModalHeader.innerHTML = DOMPurify.sanitize(`<h3 class="text-primary text-center w-100">Single Payment Sponsorship</h3>`)
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
            <button class="btn btn-primary">Submit</button>
        </div>
    </div>`)

        document.querySelector("#back-btn").addEventListener("click", () => this.initialHTML())
    }

    subscribeHTML() {
        this.sponsorModalHeader.innerHTML = DOMPurify.sanitize(`<h3 class="text-primary text-center w-100">Subscription Sponsorship</h3>`)
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
        <button class="btn btn-primary">Submit</button>
    </div>`)
    document.querySelector("#back-btn").addEventListener("click", () => this.initialHTML())

    }


}
