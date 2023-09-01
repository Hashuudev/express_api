const express = require("express");
require("dotenv").config();
const cors = require("cors");
const nodemailer = require("nodemailer");
const app = express();
// This is a public sample test API key.
// Don’t submit any personally identifiable information in requests made with this key.
// Sign in to see your own test API key embedded in code samples.
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
var corsOptions = {
  origin: "*",
  optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
};
app.use(express.json());
app.use(cors(corsOptions));

const transporter = nodemailer.createTransport({
  host: "sandbox.smtp.mailtrap.io",
  port: 465,
  secure: false,
  auth: {
    user: "abb2b824173412",
    pass: "b67ef371224669",
  },
});

const calculateOrderAmount = (items) => {
  // Replace this constant with a calculation of the order's amount
  // Calculate the order total on the server to prevent
  // people from directly manipulating the amount on the client
  const { numPatients, package } = items;

  return +numPatients * package;
};

app.post("/create-payment-intent", async (req, res) => {
  const { items } = req.body;

  console.log(items);
  // Create a PaymentIntent with the order amount and currency
  const paymentIntent = await stripe.paymentIntents.create({
    amount: calculateOrderAmount(items),
    currency: "USD",
    // In the latest version of the API, specifying the `automatic_payment_methods` parameter is optional because Stripe enables its functionality by default.

    automatic_payment_methods: {
      enabled: true,
    },
  });

  res.send({
    clientSecret: paymentIntent.client_secret,
    totalAmount: calculateOrderAmount(items),
  });
});

app.post("/send_appointment_mail", async (req, res) => {
  const { doctorEmail, userEmail, data } = req.body;
  console.log(doctorEmail, userEmail, data);

  const {
    patientsName,
    patientAge,
    totalPatients,
    time,
    totalPrice,
    patientPhone,
    doctors,
  } = data[0];

  const { doctorName, location, expertise, phone } = doctors;
  const date = new Date(time);

  // Options for formatting the date
  const options = {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    timeZoneName: "short",
  };

  const formattedDate = date.toLocaleDateString("en-US", options);

  try {
    const patientMail = await transporter.sendMail({
      from: '"Dr Fixit', // sender address
      to: userEmail, // list of receivers
      subject: "Hello ✔", // Subject line
      text: `

      Subject line – Confirmation of your appointment in Dr Fixit 
      
      Hi ${patientsName}, 
      
      Thanks for getting in touch. 
      
      This is a confirmation email regarding your appointment at Dr Fixit with Dr ${doctorName}  at ${formattedDate}. Please be available 30 minutes prior to your appointed time.  
      
      Regards, 
      
      ${doctorName}
      
      ${location} 
      
      Dr Fixit 
      
      ${phone}
      No of Patients : ${totalPatients}
      Total Fees : ${totalPrice}
      `, // plain text body
      // html body
    });
    const doctorMail = await transporter.sendMail({
      from: '"Dr Fixit', // sender address
      to: doctorEmail, // list of receivers
      subject: "Hello ✔", // Subject line
      text: `

      Subject line – Confirmation of your appointment in Dr Fixit 
      
      Hi ${doctorName}, 
      
      Thanks for getting in touch. 
      
      This is a confirmation email regarding your appointment at Dr Fixit with  ${patientsName}  at ${formattedDate}. Please be available 30 minutes prior to your appointed time.  
      
      Regards, 
      
      Dr Fixit 
      
      Patient Phone no:${patientPhone}
      No of Patients : ${totalPatients}
      Total Fees : ${totalPrice}
      `, // plain text body
      // html body
    });

    res.send(true);
  } catch (error) {
    console.log(error);

    res.send(false);
  }
});

app.listen(3000, () => console.log("Node server listening on port 3000!"));
