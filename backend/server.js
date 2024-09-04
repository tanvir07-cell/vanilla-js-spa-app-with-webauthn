import fs from "node:fs";

import "dotenv/config";

import express from "express";
import { Low } from "lowdb";
import { JSONFilePreset } from "lowdb/node";
// import * as url from "node:url";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import * as jwtJsDecode from "jwt-js-decode";
// import SimpleWebAuthnServer from "@simplewebauthn/server";
import base64url from "base64url";

import SimpleWebAuthnServer from "@simplewebauthn/server";

// const __dirname = url.fileURLToPath(new URL(".", import.meta.url));
const defaultData = { users: [] };

const app = express();
app.use(express.json());

const db = await JSONFilePreset(
  new URL("./users.json", import.meta.url).pathname,
  defaultData
);
await db.read();

const rpID = "localhost";
const protocol = "http";
const port = 5050;
const expectedOrigin = `${protocol}://${rpID}:${port}`;

app.use(express.static(new URL("../frontend", import.meta.url).pathname));
app.use(express.json());
app.use(
  express.urlencoded({
    extended: true,
  })
);

// find user by email
const findUser = (email) => {
  return db.data.users.find((user) => user.email === email);
};

// Setup email transporter (using Gmail for example)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_ID,

    // my email's app key
    pass: process.env.GMAIL_PASS,
  },
});

// Generate JWT Token
const generateToken = (email) => {
  const secretKey = process.env.SECRET_KEY;
  return jwt.sign({ email }, secretKey, { expiresIn: "1h" });
};

// ALL ENDPOINT SERVES THE index.html file

app.post("/auth/register", async (req, res) => {
  const { name, email, password } = req.body;

  const hashedPassword = bcrypt.hashSync(password, 10);
  const isUserExist = findUser(email);

  if (isUserExist) {
    res.status(400).send({ ok: false, message: "User already exists" });
    return;
  }

  // Create a verification token
  const token = generateToken(email);

  // Send verification email
  const verificationUrl = `${expectedOrigin}/auth/verify-email?token=${token}`;
  const mailOptions = {
    from: process.env.GMAIL_ID,
    to: email,
    subject: "Email Verification",
    text: `Please verify your email by clicking the link: ${verificationUrl}`,
  };

  await transporter.sendMail(mailOptions);

  // Add the user to the database with a "verified" flag set to false
  db.data.users.push({
    name,
    email,
    password: hashedPassword,
    verified: false,
  });
  await db.write();

  res.status(200).send({
    ok: true,
    message:
      "User registered successfully. Please check your email to verify your account.",
  });
});

app.post("/auth/login", (req, res) => {
  const { email, password } = req.body;
  const user = findUser(email);

  console.log("inside login,", user);
  try {
    if (user) {
      if (!user.verified) {
        return res
          .status(400)
          .send({ ok: false, message: "Please verify your email first!" });
      }

      const matchPassword = bcrypt.compareSync(password, user.password);

      if (matchPassword) {
        return res.status(200).send({
          ok: true,
          message: "Login successful",
          user: {
            name: user.name,
            email: user.email,
            verified: user.verified,
          },
        });
      }
      return res
        .status(400)
        .send({ ok: false, message: "Invalid Credentials!" });
    }

    return res.status(400).send({ ok: false, message: "Invalid Credentials!" });
  } catch (err) {
    console.error(err);
  }
});

// Email verification endpoint
app.get("/auth/verify-email", async (req, res) => {
  const token = req.query.token;

  if (!token) {
    return res.status(400).send({ ok: false, message: "Invalid token" });
  }

  try {
    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    const user = findUser(decoded.email);

    if (user) {
      user.verified = true;
      await db.write();
      const file = fs.readFileSync(
        new URL("./successVerification.html", import.meta.url).pathname
      );
      res.status(200).send(file.toString());
    } else {
      res.status(400).send({ ok: false, message: "User not found" });
    }
  } catch (error) {
    res.status(400).send({ ok: false, message: "Invalid or expired token" });
  }
});

// login with google:

app.post("/auth/login-google", (req, res) => {
  let jwt = jwtJsDecode.jwtDecode(req.body.credential);
  let payload = jwt.payload;
  let user = {
    email: payload.email,
    name: payload.given_name,
    password: false,
    picture: payload.picture,
  };
  const userFound = findUser(user.email);

  console.log("found", userFound);

  if (!userFound) {
    // User doesn't exist we create it
    db.data.users.push({
      ...user,
      verified: true,
      federated: {
        google: payload.aud,
      },
    });
    db.write();
    res.send({
      ok: true,
      user: {
        name: user.name,
        email: user.email,
        picture: user.picture,
      },
    });
    return;
  }

  // if already user added using the registration form

  // User exists, we update it with the Google data
  userFound.federated = {
    google: payload.aud,
  };
  db.write();
  res.send({
    ok: true,
    user: {
      name: userFound?.name,
      email: userFound?.email,
      picture: user.picture,
    },
  });
});

//webauth:

app.post("/auth/auth-options", (req, res) => {
  console.log(req.body.email);
  const user = findUser(req.body.email);
  console.log(user);

  if (user) {
    return res.send({
      password: true,
      google: user.federated && user.federated.google,
      webauthn: user.webauthn,
    });
  } else {
    res.send({
      password: true,
    });
  }
});

// webauth register:

app.post("/auth/webauth-registration-options", (req, res) => {
  const user = findUser(req.body.email);
  console.log("inside webauthn", user);

  const options = {
    rpName: "Vanilla Product",
    rpID,
    userID: user.email.replace("@", "+").replace(".", "_"),
    userName: user.name,
    timeout: 60000,
    attestationType: "none",

    /**
     * Passing in a user's list of already-registered authenticator IDs here prevents users from
     * registering the same device multiple times. The authenticator will simply throw an error in
     * the browser if it's asked to perform registration when one of these ID's already resides
     * on it.
     */
    excludeCredentials: user.devices
      ? user.devices.map((dev) => ({
          id: dev.credentialID,
          type: "public-key",
          transports: dev.transports,
        }))
      : [],

    authenticatorSelection: {
      userVerification: "required",
      residentKey: "required",
    },
    /**
     * The two most common algorithms: ES256, and RS256
     */
    supportedAlgorithmIDs: [-7, -257],
  };

  /**
   * The server needs to temporarily remember this value for verification, so don't lose it until
   * after you verify an authenticator response.
   */
  const regOptions = SimpleWebAuthnServer.generateRegistrationOptions(options);
  user.currentChallenge = regOptions.challenge;
  db.write();

  res.send(regOptions);
});

app.post("/auth/webauth-registration-verification", async (req, res) => {
  const user = findUser(req.body.user.email);
  const data = req.body.data;

  const expectedChallenge = user.currentChallenge;

  let verification;
  try {
    const options = {
      credential: data,
      expectedChallenge: `${expectedChallenge}`,
      expectedOrigin,
      expectedRPID: rpID,
      requireUserVerification: true,
    };
    verification = await SimpleWebAuthnServer.verifyRegistrationResponse(
      options
    );
  } catch (error) {
    console.log(error);
    return res.status(400).send({ error: error.toString() });
  }

  const { verified, registrationInfo } = verification;

  if (verified && registrationInfo) {
    const { credentialPublicKey, credentialID, counter } = registrationInfo;

    const existingDevice = user.devices
      ? user.devices.find((device) =>
          new Buffer(device.credentialID.data).equals(credentialID)
        )
      : false;

    if (!existingDevice) {
      const newDevice = {
        credentialPublicKey,
        credentialID,
        counter,
        transports: data.response.transports,
      };
      if (user.devices == undefined) {
        user.devices = [];
      }
      user.webauthn = true;
      user.devices.push(newDevice);
      db.write();
    }
  }

  res.send({ ok: true });
});

app.post("/auth/webauth-login-options", (req, res) => {
  const user = findUser(req.body.email);
  // if (user==null) {
  //     res.sendStatus(404);
  //     return;
  // }
  const options = {
    timeout: 60000,
    allowCredentials: [],
    devices:
      user && user.devices
        ? user.devices.map((dev) => ({
            id: dev.credentialID,
            type: "public-key",
            transports: dev.transports,
          }))
        : [],
    userVerification: "required",
    rpID,
  };
  const loginOpts = SimpleWebAuthnServer.generateAuthenticationOptions(options);
  if (user) user.currentChallenge = loginOpts.challenge;
  res.send(loginOpts);
});

app.post("/auth/webauth-login-verification", async (req, res) => {
  const data = req.body.data;
  const user = findUser(req.body.email);
  if (user == null) {
    res.sendStatus(400).send({ ok: false });
    return;
  }

  const expectedChallenge = user.currentChallenge;

  let dbAuthenticator;
  const bodyCredIDBuffer = base64url.toBuffer(data.rawId);

  for (const dev of user.devices) {
    const currentCredential = Buffer(dev.credentialID.data);
    if (bodyCredIDBuffer.equals(currentCredential)) {
      dbAuthenticator = dev;
      break;
    }
  }

  if (!dbAuthenticator) {
    return res.status(400).send({
      ok: false,
      message: "Authenticator is not registered with this site",
    });
  }

  let verification;
  try {
    const options = {
      credential: data,
      expectedChallenge: `${expectedChallenge}`,
      expectedOrigin,
      expectedRPID: rpID,
      authenticator: {
        ...dbAuthenticator,
        credentialPublicKey: new Buffer(
          dbAuthenticator.credentialPublicKey.data
        ), // Re-convert to Buffer from JSON
      },
      requireUserVerification: true,
    };
    verification = await SimpleWebAuthnServer.verifyAuthenticationResponse(
      options
    );
  } catch (error) {
    return res.status(400).send({ ok: false, message: error.toString() });
  }

  const { verified, authenticationInfo } = verification;

  if (verified) {
    dbAuthenticator.counter = authenticationInfo.newCounter;
  }

  res.send({
    ok: true,
    user: {
      name: user.name,
      email: user.email,
    },
  });
});

app.get("*", (req, res) => {
  res.sendFile(new URL("../frontend/index.html", import.meta.url).pathname);
});

app.listen(port, () => {
  console.log(`App listening ${expectedOrigin}`);
});
