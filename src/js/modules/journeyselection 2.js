import axios from 'axios'

export default class Journey {
    constructor() {
        this.selectJourney = document.querySelector("#journeyOptions")
        this._csrf = document.querySelector('[name="_csrf"]').value
        this.username = document.querySelector('.profile-username').innerHTML
        this.waitTimer
        this.events()
    }

    events() {
        this.selectJourney.addEventListener("input", (e) => {
            this.journey = document.querySelector('#journeyOptions').value
            e.preventDefault()
            this.buttonClickHandler()
        })   
    }

    buttonClickHandler() {

            this.waitTimer = setTimeout(() => this.sendRequest(), 750)
    }

    sendRequest() {
        
            if (this.journey != "All Journeys") {
                window.location.href = `/journal/${this.username}/${this.journey}`

            } else {
                window.location.href = `/journal/${this.username}`
            }

    }


}
