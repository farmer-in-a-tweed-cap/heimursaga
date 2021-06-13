export default class RegistrationForm {
    constructor() {
        this.allFields = document.querySelectorAll(".registration-form .form-control")
        this.insertValidationElements()
        this.events()
    }

    // Events
    events() {
        alert("registration form js is running")
    }

    // Methods
    insertValidationElements() {
        this.allFields.forEach(function(el){
            el.insertAdjacentHTML('afterend', '<div class="alert alert-danger small liveValidationMessage liveValidateMessage--visible"></div>')
        })
    }

}