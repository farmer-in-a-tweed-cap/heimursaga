// Usage: https://github.com/caroso1222/notyf
import { Notyf } from "notyf";

window.notyf = new Notyf({
  duration: 5000,
  position: {
    x: "right",
    y: "top"
  },
  dismissible: true,
  types: [
    {
      type: "default",
      backgroundColor: "#3B7DDD",
      icon: {
        className: "notyf__icon--success",
        tagName: "i",
      }
    },
    {
      type: "success",
      //backgroundColor: "#28a745",
      backgroundColor: "#598636",
      icon: {
        className: "notyf__icon--success",
        tagName: "i",
      }
    },
    {
      type: "warning",
      backgroundColor: "#ffc107",
      //backgroundColor: "#fa8072",
      icon: {
        className: "notyf__icon--error",
        tagName: "i",
      }
    },
    {
      type: "error",
      backgroundColor: "#f72b13",
      //backgroundColor: "#fa8072",
      icon: {
        className: "notyf__icon--error",
        tagName: "i",
      }
    }
  ]
});

const successMessage = document.getElementById('success-message')
const errorMessage = document.getElementById('error-message')

if (successMessage) {
  window.notyf.success(successMessage.textContent);
} else if (errorMessage) {
  window.notyf.error(errorMessage.textContent);
}