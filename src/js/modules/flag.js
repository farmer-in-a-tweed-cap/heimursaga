import axios from 'axios'

export default class Flag {
    constructor() {
        this.flagButton = document.querySelector("#flag-button")
        this.flagIcon = document.querySelector(".icon-heimursaga-flag")
        this._csrf = document.querySelector('[name="_csrf"]').value
        this.entryId = document.querySelector("#entry-id").value
        this.hasFlagged = document.querySelector("#has-flagged").value
        this.flagLabel = document.querySelector("#flag-label")
        this.waitTimer
        this.events()
    }

    events() {
        this.flagButton.addEventListener("click", (e) => {
            e.preventDefault()
            this.buttonClickHandler()
        })   
    }

    buttonClickHandler() {
        console.log(this.entryId)

        var response = confirm('Are you sure you want to flag this entry for a violation of the Explorer Code? This action is irreversible.')

        if (response) {
            console.log('flag confirmed')
            this.changePrimary()
            parent.window.notyf.error('You have flagged this entry for review');
            document.querySelector("#flag-label").innerText = 'flagged'
            this.waitTimer = setTimeout(() => this.sendRequest(), 750)
        } else {
            console.log('flag cancelled')
        }

    }

    sendRequest() {
            axios.post(`/addFlag/${this.entryId}`, {_csrf: this._csrf, id: this.entryId}).then(() => {
                console.log('successfully flagged')
            })

    }


    changePrimary() {
        document.querySelector(".icon-heimursaga-flag").style.color = "#adb5bd"
        document.querySelector("#flag-label").style.color = "#adb5bd"
        document.querySelector("#flag-button").disabled = true

    }


}
