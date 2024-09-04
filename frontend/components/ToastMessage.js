export class ToastMessage extends HTMLElement {
  constructor() {
    super();

    this.root = this.attachShadow({ mode: "open" });

    const style = document.createElement("style");
    style.textContent = `
          .toast {
            visibility: hidden;
            min-width: 250px;
            margin-left: -125px;
            background-color: #333;
            color: #fff;
            text-align: center;
            border-radius: 5px;
            padding: 16px;
            position: fixed;
            z-index: 1;
            left: 50%;
            bottom: 30px;
            font-size: 17px;
            opacity: 0;
            transition: opacity 0.5s, visibility 0.5s;
          }
          
          .toast.show {
            visibility: visible;
            opacity: 1;
          }
        `;

    this.root.appendChild(style);

    const toastDiv = document.createElement("div");
    toastDiv.classList.add("toast");
    this.root.appendChild(toastDiv);
  }

  showMessage(message) {
    const toast = this.root.querySelector(".toast");
    toast.textContent = message; // Set the message
    toast.classList.add("show");

    // Remove the toast after 3 seconds
    setTimeout(() => {
      toast.classList.remove("show");
    }, 3000);
  }
}

customElements.define("toast-message", ToastMessage);
