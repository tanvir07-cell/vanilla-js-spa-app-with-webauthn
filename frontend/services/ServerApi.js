const ServerApi = {
  endpoint: "http://localhost:5050/auth/",
  // ADD HERE ALL THE OTHER API FUNCTIONS
  login: async (user) => {
    return await ServerApi.makePostRequest(ServerApi.endpoint + "login", user);
  },

  register: async (user) => {
    return await ServerApi.makePostRequest(
      ServerApi.endpoint + "register",
      user
    );
  },

  loginFromGoogle: async (data) => {
    return await ServerApi.makePostRequest(
      ServerApi.endpoint + "login-google",
      data
    );
  },

  checkAuthOptions: async (user) => {
    return await ServerApi.makePostRequest(
      ServerApi.endpoint + "auth-options",
      user
    );
  },

  webAuthn: {
    loginOptions: async (email) => {
      return await ServerApi.makePostRequest(
        ServerApi.endpoint + "webauth-login-options",
        {
          email,
        }
      );
    },
    loginVerification: async (email, data) => {
      return await ServerApi.makePostRequest(
        ServerApi.endpoint + "webauth-login-verification",
        {
          email,
          data,
        }
      );
    },
    registrationOptions: async () => {
      console.log(Auth.account);
      return await ServerApi.makePostRequest(
        ServerApi.endpoint + "webauth-registration-options",
        Auth.account
      );
    },
    registrationVerification: async (data) => {
      return await ServerApi.makePostRequest(
        ServerApi.endpoint + "webauth-registration-verification",
        {
          user: Auth.account,
          data,
        }
      );
    },
  },

  makePostRequest: async (url, data) => {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    return await response.json();
  },
};

export default ServerApi;
