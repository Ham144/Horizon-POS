import SibApiV3Sdk from 'sib-api-v3-sdk';

// Set API key
const defaultClient = SibApiV3Sdk.ApiClient.instance;
const apiKey = defaultClient.authentications['api-key'];
apiKey.apiKey = process.env.BREVO_API_KEY;

// Kirim email function
async function sendEmailService({ toEmail, subject, htmlContent }) {

    const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

    const sendSmtpEmail = {
        sender: { name: process.env.STARTUP, email: process.env.BREVO_EMAIL },
        to: [{ email: toEmail }],
        subject,
        htmlContent,
    };

    try {
        const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
        return data;
    } catch (error) {
        console.error('Error sending email:', error.response?.text || error.message);
        throw error;
    }
}


export default sendEmailService

