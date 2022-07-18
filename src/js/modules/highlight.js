import axios from 'axios'

export default class Highlight {
    constructor() {
        this.highlightButton = document.querySelector("#highlight-button")
        this.highlightIcon = document.querySelector(".icon-heimursaga-highlight")
        this._csrf = document.querySelector('[name="_csrf"]').value
        this.entryId = document.querySelector("#entry-id").value
        this.hasVisitorHighlighted = document.querySelector("#has-highlighted").value
        this.highlightCount = document.querySelector("#highlight-count")
        this.check = document.querySelector("#highlight-check")
        this.waitTimer
        this.events()
    }

    events() {
        this.highlightButton.addEventListener("click", (e) => {
            e.preventDefault()
            this.buttonClickHandler()
        })   
    }

    buttonClickHandler() {

        if (document.querySelector(".icon-heimursaga-highlight").style.color == "rgb(60, 115, 170)"){

            this.changePrimary()
            parent.window.notyf.success(`You have highlighted this entry`);
            this.waitTimer = setTimeout(() => this.sendRequest(), 750)

        } else {

            this.changeBlue()
            parent.window.notyf.error({background: '#3C73AA', message: `Your highlight has been removed`});
            this.waitTimer = setTimeout(() => this.sendRequest(), 750)


        }
    }

    sendRequest() {
        if (document.querySelector(".icon-heimursaga-highlight").style.color != "rgb(60, 115, 170)"){
            axios.post(`/addHighlight/${this.entryId}`, {_csrf: this._csrf, id: this.entryId}).then(() => {
                console.log('highlight added')
            })
        } else {
            axios.post(`/removeHighlight/${this.entryId}`, {_csrf: this._csrf, id: this.entryId}).then(() => {
                console.log('highlight removed')
            })
        }
    }


    changePrimary() {
        document.querySelector(".icon-heimursaga-highlight").style.color = "#AC6D46"
        document.querySelector("#highlight-check").removeAttribute('hidden', true)

    }

    changeBlue() {
        document.querySelector(".icon-heimursaga-highlight").style.color = "#3C73AA"
        document.querySelector("#highlight-check").setAttribute('hidden', true)
    }

}
