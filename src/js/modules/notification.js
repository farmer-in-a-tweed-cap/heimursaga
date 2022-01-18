export default class Notification {
    constructor() {
        this.openedYet = false
        this.userNotificationsPane = document.querySelector("#user-notifications")
        this.openIcon = document.querySelector('#notification-icon')
        this.showNotifications()
        this.injectHTML()
        this.notificationList = document.querySelector('.notification-list')
        this.sendMessageToServer()
        this.events()
    }

    // Events
    events() {
        //this.openIcon.addEventListener("click", () => this.showNotifications())

    }

    // Methods
    sendMessageToServer() {
        this.socket.emit("testNotification", {message: "test notification"})
    }

    showNotifications() {
        if (!this.openedYet) {
            this.openConnection()
        }
        this.openedYet = true
        this.userNotificationsPane.classList.add("user-notifications")
    }

    openConnection() {
        //this.socket = io()
        this.socket.on('testNotificationFromServer', (data) => {
           this.displayMessageFromServer(data)
        })
    }

    displayMessageFromServer(data) {
        this.notificationList.insertAdjacentHTML('beforeend', `<p>${data.message}</p>`)
    }

    injectHTML() {
        this.userNotificationsPane.innerHTML = `
        <div class="dropdown-menu-header">
        4 New Notifications
        </div>
            <div class="notification-list"></div>
            <div class="list-group">
                <a href="#" class="list-group-item">
                    <div class="row g-0 align-items-center">
                        <div class="col-2">
                            <i class="text-danger" data-feather="alert-circle"></i>
                        </div>
                        <div class="col-10">
                            <div class="text-dark">Update completed</div>
                            <div class="text-muted small mt-1">Restart server 12 to complete the update.</div>
                            <div class="text-muted small mt-1">2h ago</div>
                        </div>
                    </div>
                </a>
            </div>
        <div class="dropdown-menu-footer">
            <a href="#" class="text-muted">Show all notifications</a>
        </div>`
    }
}