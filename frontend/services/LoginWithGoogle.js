import { ToastMessage } from "../components/ToastMessage.js";
import router from "./router.js";
import ServerApi from "./ServerApi.js";

const Auth = {
  loginFromGoogle: async (data) => {
    console.log(data);
    const response = await ServerApi.loginFromGoogle(data);
    console.log(response);
    if (response.ok) {
      // dispatching the app:user-update event on the global scope
      app.state.user = response.user;
      router.navigate("/");
    }
  },
  loginStep: 1,

  getShadowDomFields: () => {
    // Assuming shadowHost is the element that contains the Shadow DOM
    const shadowHost = document.querySelector("login-page"); // Replace with the actual selector of your shadow DOM host

    // Accessing the shadow root
    const shadowRoot = shadowHost.shadowRoot;

    // Accessing the fields within the shadow DOM
    const password = shadowRoot.querySelector("#login_section_password"); // Replace with actual ID or class
    const webauth = shadowRoot.querySelector("#section_webauthn"); // Replace with actual ID or class

    return { password, webauth };
  },

  checkAuthOptions: async (emailField, passwordField, webauthnField) => {
    const { password, webAuth } = Auth.getShadowDomFields();

    console.log(password, webAuth);

    console.log(passwordField, webauthnField);
    const response = await ServerApi.checkAuthOptions({
      email: emailField.value,
    });
    console.log(response);
    if (response.password) {
      passwordField.hidden = false;
    }
    if (response.webauthn) {
      webauthnField.hidden = false;
    }
    Auth.challenge = response.challenge;
    Auth.loginStep = 2;
  },

  // init: () => {
  //   Auth.loginStep = 1;
  //   const loginShadowRoot = document.querySelector("login-page").shadowRoot;
  //   console.log(loginShadowRoot);
  //   // const passwordField = loginShadowRoot.getElementById(
  //   //   "login_section_password"
  //   // );
  //   // const webauthnField = loginShadowRoot.getElementById("section_webauthn");

  //   passwordField.hidden = true;
  //   webauthnField.hidden = true;
  // },

  addWebAuthn: async () => {
    const options = await ServerApi.webAuthn.registrationOptions();
    options.authenticatorSelection.residentKey = "required";
    options.authenticatorSelection.requireResidentKey = true;
    options.extensions = {
      credProps: true,
    };
    const authRes = await SimpleWebAuthnBrowser.startRegistration(options);
    const verificationRes = await ServerApi.webAuthn.registrationVerification(
      authRes
    );
    if (verificationRes.ok) {
      alert("You can now login using the registered method!");
    } else {
      alert(verificationRes.message);
    }
  },

  webAuthnLogin: async (emailField) => {
    const email = emailField.value;
    const options = await ServerApi.webAuthn.loginOptions(email);
    const loginRes = await SimpleWebAuthnBrowser.startAuthentication(options);
    const verificationRes = await ServerApi.webAuthn.loginVerification(
      email,
      loginRes
    );
    console.log(verificationRes);
    if (verificationRes.ok) {
      app.state.user = verificationRes.user;
      router.navigate("/");
    } else {
      alert(verificationRes.message);
    }
  },
};

export default Auth;
// Auth.init();

globalThis.Auth = Auth;
