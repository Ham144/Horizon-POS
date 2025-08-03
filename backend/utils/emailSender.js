import nodemailer from "nodemailer";

const emailSender = async ({ to, subject, html }) => {
  if (!to || !subject || !html) {
    return ["", "Gagal, diperlukan to subject dan html"];
  }

  const transporter = nodemailer.createTransport({
    service: "outlook365",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: to,
      subject,
      html,
    });

    return [true, false];
  } catch (error) {
    console.log(error);
    return ["", `terjadi kesalahan ${JSON.stringify(error)}`];
  }
};

export default emailSender;
