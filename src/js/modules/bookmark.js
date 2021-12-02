import axios from 'axios'

export default class Bookmark {
    constructor() {
        this.bookmarkButton = document.querySelector("#bookmark-button")
        this.bookmarkIcon = document.querySelector(".icon-heimursaga-bookmark")
        this._csrf = document.querySelector('[name="_csrf"]').value
        this.entryId = document.querySelector("#entry-id").value
        this.hasVisitorBookmarked = document.querySelector("#has-bookmarked").value
        this.bookmarkCount = document.querySelector("#bookmark-count")
        this.check = document.querySelector("#bookmark-check")
        this.waitTimer
        this.events()
    }

    events() {
        this.bookmarkButton.addEventListener("click", (e) => {
            e.preventDefault()
            this.buttonClickHandler()
        })   
    }

    buttonClickHandler() {

        if (document.querySelector(".icon-heimursaga-bookmark").style.color == "rgb(60, 115, 170)"){

            this.changePrimary()
            this.waitTimer = setTimeout(() => this.sendRequest(), 750)

        } else {

            this.changeBlue()
            this.waitTimer = setTimeout(() => this.sendRequest(), 750)


        }
    }

    sendRequest() {
        if (document.querySelector(".icon-heimursaga-bookmark").style.color != "rgb(60, 115, 170)"){
            axios.post(`/addBookmark/${this.entryId}`, {_csrf: this._csrf, id: this.entryId}).then(() => {
                console.log('successfully bookmarked')
            })
        } else {
            axios.post(`/removeBookmark/${this.entryId}`, {_csrf: this._csrf, id: this.entryId}).then(() => {
                console.log('bookmark removed')
            })
        }
    }


    changePrimary() {
        document.querySelector(".icon-heimursaga-bookmark").style.color = "#AC6D46"
        document.querySelector("#bookmark-button").classList.remove("text-blue")
        document.querySelector("#bookmark-button").classList.add("text-primary")
        document.querySelector("#bookmark-check").removeAttribute('hidden', true)

    }

    changeBlue() {
        document.querySelector(".icon-heimursaga-bookmark").style.color = "#3C73AA"
        document.querySelector("#bookmark-button").classList.remove("text-danger")
        document.querySelector("#bookmark-button").classList.add("text-blue")
        document.querySelector("#bookmark-check").setAttribute('hidden', true)
    }

}
