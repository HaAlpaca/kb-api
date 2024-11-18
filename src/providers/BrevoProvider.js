const SibApiV3Sdk = require('@getbrevo/brevo')
// const brevo = require('@getbrevo/brevo')
import { env } from '~/config/environment'

let apiInstance = new SibApiV3Sdk.TransactionalEmailsApi()
let apiKey = apiInstance.authentications['apiKey']
apiKey.apiKey = env.BREVO_API_KEY

const sendEmail = async (recipientEmail, customSubject, htmlContent) => {
  // khoi tao sendSmtpEmail
  let sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail()
  // tai khoan gui mail: dia chi admin tai khoan tren BREVO
  sendSmtpEmail.sender = {
    name: env.ADMIN_EMAIL_NAME,
    email: env.ADMIN_EMAIL_ADDRESS
  }
  // gui la 1 array vi co the gui den nhieu tk => sau nay mo rong
  sendSmtpEmail.to = [{ email: recipientEmail }]
  // tieu de
  sendSmtpEmail.subject = customSubject
  // content
  sendSmtpEmail.htmlContent = htmlContent

  // handle gui mail
  return apiInstance.sendTransacEmail(sendSmtpEmail)
}

export const BrevoProvider = {
  sendEmail
}
