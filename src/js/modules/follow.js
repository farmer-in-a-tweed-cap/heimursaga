import axios from 'axios'

export default class Follow {
    constructor() {
        this.followButton = document.querySelector("#follow-button")
        this.followIcon = document.querySelector(".icon-heimursaga-follow-alt")
        this._csrf = document.querySelector('[name="_csrf"]').value
        this.entryAuthor = document.querySelector("#entry-username").value
        this.isVisitorFollowing = document.querySelector("#is-following").value
        this.check = document.querySelector("#follow-check")
        this.waitTimer
        this.events()
    }

    events() {
        this.followButton.addEventListener("click", (e) => {
            e.preventDefault()
            this.buttonClickHandler()
        })   
    }

    buttonClickHandler() {

        if (document.querySelector(".icon-heimursaga-follow-alt").style.color == "rgb(60, 115, 170)"){

            this.changePrimary()
            this.waitTimer = setTimeout(() => this.sendRequest(), 750)

        } else {

            this.changeBlue()
            this.waitTimer = setTimeout(() => this.sendRequest(), 750)


        }
    }

    sendRequest() {
        if (document.querySelector(".icon-heimursaga-follow-alt").style.color != "rgb(60, 115, 170)"){
            axios.post(`/addFollow/${this.entryAuthor}`, {_csrf: this._csrf, username: this.entryAuthor}).then(() => {
                console.log('successfully followed')
            })
        } else {
            axios.post(`/removeFollow/${this.entryAuthor}`, {_csrf: this._csrf, username: this.entryAuthor}).then(() => {
                console.log('follow removed')
            })
        }
    }


    changePrimary() {
        document.querySelector(".icon-heimursaga-follow-alt").style.color = "#AC6D46"
        document.querySelector("#follow-button").classList.remove("text-blue")
        document.querySelector("#follow-button").classList.add("text-primary")
        document.querySelector("#follow-check").style.color = "#AC6D46"

    }

    changeBlue() {
        document.querySelector(".icon-heimursaga-follow-alt").style.color = "#3C73AA"
        document.querySelector("#follow-button").classList.remove("text-danger")
        document.querySelector("#follow-button").classList.add("text-blue")
        document.querySelector("#follow-check").style.color = "#FFFFFF"
    }

}
